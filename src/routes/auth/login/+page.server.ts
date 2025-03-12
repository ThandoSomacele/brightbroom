// src/routes/auth/login/+page.server.ts
import { lucia } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { Argon2id } from 'oslo/password';
import { db } from '$lib/server/db';
import { user, key } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

// Validate user exists before showing login page
export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    throw redirect(302, '/profile');
  }
  
  return {};
};

// Form validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const actions: Actions = {
  default: async ({ request, cookies, url }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString().toLowerCase();
    const password = formData.get('password')?.toString();
    const redirectTo = url.searchParams.get('redirectTo') || '/profile';
    
    // Validate form data
    try {
      loginSchema.parse({ email, password });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.flatten().fieldErrors;
        return fail(400, { error: Object.values(errors)[0]?.[0] || 'Invalid input' });
      }
    }
    
    try {
      // Find the user key
      const [keyData] = await db.select()
        .from(key)
        .where(eq(key.id, `email:${email}`))
        .limit(1);
      
      // If no key found
      if (!keyData || !keyData.hashedPassword) {
        return fail(400, { error: 'Invalid email or password' });
      }

      // Get the user
      const [userData] = await db.select()
        .from(user)
        .where(eq(user.id, keyData.userId))
        .limit(1);
      
      if (!userData) {
        return fail(400, { error: 'Invalid email or password' });
      }
      
      // Verify password
      const hasher = new Argon2id();
      const validPassword = await hasher.verify(keyData.hashedPassword, password!);
      
      if (!validPassword) {
        return fail(400, { error: 'Invalid email or password' });
      }
      
      // Create a new session
      const session = await lucia.createSession(userData.id, {});
      
      // Set session cookie
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies.set(sessionCookie.name, sessionCookie.value, {
        path: '.',
        ...sessionCookie.attributes
      });
      
      // Redirect to the requested page or profile
      throw redirect(302, redirectTo);
    } catch (error) {
      // Handle login failures
      console.error('Login error:', error);
      return fail(500, { error: 'An error occurred during login' });
    }
  }
};
