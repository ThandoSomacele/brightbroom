// src/routes/auth/login/+page.server.ts
import { auth } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

// Validate user exists before showing login page
export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();
  if (session) {
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
    const email = formData.get('email');
    const password = formData.get('password');
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
      // Try to find a key for this user
      const key = await auth.useKey(
        'email',
        email!.toString().toLowerCase(),
        password!.toString()
      );
      
      // Create a new session
      const session = await auth.createSession({
        userId: key.userId,
        attributes: {}
      });
      
      // Set session cookie
      const sessionCookie = auth.createSessionCookie(session);
      cookies.set(sessionCookie.name, sessionCookie.value, {
        path: '.',
        ...sessionCookie.attributes
      });
      
      // Redirect to the requested page or profile
      throw redirect(302, redirectTo);
    } catch (error) {
      // Handle login failures
      console.error('Login error:', error);
      return fail(400, { error: 'Invalid email or password' });
    }
  }
};
