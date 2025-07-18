// src/routes/book/payment/+page.server.ts
import { error, redirect, fail } from '@sveltejs/kit';
import { getGuestBookingData } from '$lib/server/guest-booking';
import {
  createSession,
  generateSessionToken,
  getUserByEmail,
  setSessionTokenCookie
} from '$lib/server/auth';
import { z } from 'zod';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, url, ...event }) => {
  // Get booking ID from query parameters
  const bookingId = url.searchParams.get('bookingId');
  
  // If user is already authenticated, redirect to payment processing
  if (locals.user) {
    const redirectUrl = bookingId ? `/payment/process?bookingId=${bookingId}` : '/payment/process';
    throw redirect(302, redirectUrl);
  }
  
  // Get guest booking data
  const guestBookingData = getGuestBookingData(event);
  
  // Check if we have valid booking data
  if (!guestBookingData.serviceId || !guestBookingData.scheduledDate) {
    throw error(400, 'No booking data found. Please start a new booking.');
  }
  
  return {
    bookingData: guestBookingData,
    bookingId,
    isGuest: true
  };
};

// Form validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const actions: Actions = {
  login: async (event) => {
    const { request } = event;
    const formData = await request.formData();
    const email = formData.get('email')?.toString().toLowerCase();
    const password = formData.get('password')?.toString();
    const redirectTo = formData.get('redirectTo')?.toString() || '/payment/process';
    
    console.log('Login attempt:', { email, redirectTo });
    
    try {
      // Validate form data with Zod
      loginSchema.parse({ email, password });
      
      // Find the user by email
      const userData = await getUserByEmail(email);
        
      if (!userData) {
        console.log('User not found:', email);
        return fail(400, { 
          error: 'Invalid email or password',
          email
        });
      }
      
      // Verify password
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
    
    // After successful authentication and session creation, redirect
    throw redirect(302, redirectTo);
  }
};