// src/routes/auth/login/+page.server.ts
import {
  createSession,
  generateSessionToken,
  getUserByEmail,
  setSessionTokenCookie
} from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

// Validate user exists before showing login page
export const load: PageServerLoad = async ({ locals }) => {
  // If user is already logged in, redirect to profile
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
  default: async (event) => {
    const { request, cookies, url } = event;
    const formData = await request.formData();
    const email = formData.get('email')?.toString().toLowerCase();
    const password = formData.get('password')?.toString();
    const redirectTo = url.searchParams.get('redirectTo') || '/profile';
    
    console.log('Login attempt:', { email, redirectTo });
    
    try {
      // Validate form data
      if (!email || !password) {
        return fail(400, { error: 'Email and password are required' });
      }
      
      // Find the user by email
      const userData = await getUserByEmail(email);
        
      if (!userData) {
        console.log('User not found:', email);
        return fail(400, { 
          error: 'Invalid email or password',
          email
        });
      }
      
      // Verify password (using Argon2id from oslo)
      const { Argon2id } = await import('oslo/password');
      const hasher = new Argon2id();
      const validPassword = await hasher.verify(userData.passwordHash, password);
      
      if (!validPassword) {
        console.log('Invalid password for user:', email);
        return fail(400, { 
          error: 'Invalid email or password',
          email
        });
      }
      
      console.log('Login successful for user:', email);
      
      // Generate a session token and create a session
      const token = generateSessionToken();
      const session = await createSession(token, userData.id);
      
      // Set the session cookie
      setSessionTokenCookie(event, token, session.expiresAt);
      
      // Redirect to the requested page or profile
      throw redirect(302, redirectTo);
    } catch (error) {
      console.error('Login error:', error);
      return fail(500, { 
        error: 'An unexpected error occurred. Please try again.',
        email
      });
    }
  }
};
