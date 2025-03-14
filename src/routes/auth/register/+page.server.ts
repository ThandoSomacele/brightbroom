// src/routes/auth/register/+page.server.ts
import {
  createSession,
  generateSessionToken,
  generateUserId,
  setSessionTokenCookie
} from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

// Validate user isn't already logged in
export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    throw redirect(302, '/profile');
  }
  
  return {};
};

// Form validation schema
const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  terms: z.literal('on', {
    errorMap: () => ({ message: 'You must accept the Terms of Service' })
  })
});

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const email = formData.get('email')?.toString().toLowerCase();
    const phone = formData.get('phone');
    const password = formData.get('password')?.toString();
    const terms = formData.get('terms');
    
    // Validate form data
    try {
      registerSchema.parse({ firstName, lastName, email, phone, password, terms });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.flatten().fieldErrors;
        return fail(400, { error: Object.values(errors)[0]?.[0] || 'Invalid input' });
      }
    }
    
    // Check if user already exists
    const existingUser = await db.select()
      .from(user)
      .where(eq(user.email, email!))
      .limit(1);
    
    if (existingUser.length > 0) {
      return fail(400, { error: 'Email already in use' });
    }
    
    try {
      // Hash the password
      const { Argon2id } = await import('oslo/password');
      const hasher = new Argon2id();
      const hashedPassword = await hasher.hash(password!);
      
      // Create user ID
      const userId = generateUserId();
      
      // Create user in database
      const [newUser] = await db.insert(user).values({
        id: userId,
        email: email!,
        firstName: firstName!.toString(),
        lastName: lastName!.toString(),
        passwordHash: hashedPassword,
        role: 'CUSTOMER',
        phone: phone?.toString() || null
      }).returning();
      
      // Create session
      const token = generateSessionToken();
      const session = await createSession(token, userId);
      
      // Set session cookie
      setSessionTokenCookie({ cookies, url, request }, token, session.expiresAt);
      
      // Redirect to profile to complete account setup
      throw redirect(302, '/profile');
    } catch (error) {
      console.error('Registration error:', error);
      return fail(500, { error: 'Failed to create account. Please try again.' });
    }
  }
};
