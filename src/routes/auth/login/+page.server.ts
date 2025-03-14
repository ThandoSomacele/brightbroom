// src/routes/auth/login/+page.server.ts
import {
  createSession,
  generateSessionToken,
  setSessionTokenCookie
} from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

// Validate user exists before showing login page
export const load: PageServerLoad = async ({ locals }) => {
  // Instead of using locals.auth.validate(), check for locals.session
  if (locals.session) {
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
    
    try {
      // Validate form data
      if (!email || !password) {
        return fail(400, { error: 'Email and password are required' });
      }
      
      // Find the user by email
      const [userData] = await db.select()
        .from(user)
        .where(eq(user.email, email))
        .limit(1);
        
      if (!userData) {
        return fail(400, { error: 'Invalid email or password' });
      }
      
      // Verify password (using Argon2id from oslo)
      const { Argon2id } = await import('oslo/password');
      const hasher = new Argon2id();
      const validPassword = await hasher.verify(userData.passwordHash, password);
      
      if (!validPassword) {
        return fail(400, { error: 'Invalid email or password' });
      }
      
      // Generate a session token and create a session
      const token = generateSessionToken();
      const session = await createSession(token, userData.id);
      
      // Set the session cookie
      setSessionTokenCookie({ cookies, url, request }, token, session.expiresAt);
      
      // Redirect to the requested page or profile
      throw redirect(302, redirectTo);
    } catch (error) {
      console.error('Login error:', error);
      return fail(400, { error: 'Invalid email or password' });
    }
  }
};
