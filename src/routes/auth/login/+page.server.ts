import { auth } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
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
    const email = formData.get('email')?.toString().toLowerCase();
    const password = formData.get('password')?.toString();
    const redirectTo = url.searchParams.get('redirectTo') || '/profile';
    
    try {
      // Validate form data
      if (!email || !password) {
        return fail(400, { error: 'Email and password are required' });
      }
      
      // Attempt to log in using Lucia
      // This now handles all the validation and session creation
      const key = await auth.useKey('email', email, password);
      const session = await auth.createSession({
        userId: key.userId,
        attributes: {}
      });
      
      const authRequest = auth.handleRequest({ request, cookies });
      authRequest.setSession(session);

      // Redirect to the requested page or profile
      throw redirect(302, redirectTo);
    } catch (error) {
      console.error('Login error:', error);
      return fail(400, { error: 'Invalid email or password' });
    }
  }
};
