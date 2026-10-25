// src/routes/auth/login/+page.server.ts
import {
  createSession,
  generateSessionToken,
  getUserByEmail,
  setSessionTokenCookie
} from '$lib/server/auth';
import { validateCSRFToken } from '$lib/server/csrf';
import { safeRedirectPath } from '$lib/utils/safe-redirect';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

// Form validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const actions: Actions = {
  login: async (event) => {
    const { request } = event;
    const formData = await request.formData();

    // Validate CSRF token
    const csrfError = validateCSRFToken(event, formData);
    if (csrfError) return csrfError;
    const email = formData.get('email')?.toString().toLowerCase();
    const password = formData.get('password')?.toString();
    const redirectTo = safeRedirectPath(formData.get('redirectTo'), '/profile');
    
    try {
      // Validate form data with Zod
      const credentials = loginSchema.parse({ email, password });
      
      // Find the user by email
      const userData = await getUserByEmail(credentials.email);
        
      if (!userData) {
        console.log('Login failed: no such user');
        return fail(400, { 
          error: 'Invalid email or password',
          email
        });
      }
      
      // Verify password
      const { Argon2id } = await import('oslo/password');
      const hasher = new Argon2id();
      const validPassword = await hasher.verify(userData.passwordHash, credentials.password);
      
      if (!validPassword) {
        console.log(`Login failed: wrong password for user ${userData.id}`);
        return fail(400, { 
          error: 'Invalid email or password',
          email
        });
      }
      
      console.log(`Login successful for user ${userData.id}`);
      
      // Generate a session token and create a session
      const token = generateSessionToken();
      const session = await createSession(token, userData.id);
      
      // Set the session cookie
      setSessionTokenCookie(event, token, session.expiresAt);
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        const errors = error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] || 'Invalid input';
        
        return fail(400, { 
          error: firstError,
          email
        });
      }
      
      return fail(500, { 
        error: 'An unexpected error occurred. Please try again.',
        email
      });
    }
    
    // After successful authentication and session creation, redirect.
    // redirectTo is already a path on this site (safeRedirectPath)
    throw redirect(302, redirectTo);
  }
};
