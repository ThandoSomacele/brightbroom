// src/routes/auth/login/+page.server.ts
import {
  createSession,
  generateSessionToken,
  authenticate,
  setSessionTokenCookie
} from '$lib/server/auth';
import { validateCSRFToken } from '$lib/server/csrf';
import { safeRedirectPath } from '$lib/utils/safe-redirect';
import { fail, redirect } from '@sveltejs/kit';
import { checkRateLimit } from '$lib/server/rate-limiter';
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
      
      // Slow down password guessing, per IP and per account
      const ipLimit = await checkRateLimit('login', event.getClientAddress());
      const emailLimit = await checkRateLimit('login', credentials.email);
      if (!ipLimit.allowed || !emailLimit.allowed) {
        return fail(429, {
          error: 'Too many sign-in attempts. Please wait 15 minutes and try again.',
          email
        });
      }

      const result = await authenticate(credentials.email, credentials.password);
      if (!result.ok) {
        console.log(`Login failed: ${result.reason}`);
        return fail(400, {
          error: result.reason === 'inactive'
            ? 'This account has been deactivated. Please contact us.'
            : 'Invalid email or password',
          email
        });
      }

      console.log(`Login successful for user ${result.user.id}`);

      // Generate a session token and create a session
      const token = generateSessionToken();
      const session = await createSession(token, result.user.id);
      
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
