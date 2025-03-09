// src/routes/auth/register/+page.server.ts
import { auth } from '$lib/server/auth';
import { prisma } from '$lib/server/prisma';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { LuciaError } from 'lucia';

// Validate user isn't already logged in
export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();
  if (session) {
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
    const email = formData.get('email');
    const phone = formData.get('phone');
    const password = formData.get('password');
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
    const existingUser = await prisma.user.findUnique({
      where: { email: email!.toString().toLowerCase() }
    });
    
    if (existingUser) {
      return fail(400, { error: 'Email already in use' });
    }
    
    try {
      // Create user with Lucia (which handles password hashing)
      const user = await auth.createUser({
        key: {
          providerId: 'email',
          providerUserId: email!.toString().toLowerCase(),
          password: password!.toString()
        },
        attributes: {
          email: email!.toString().toLowerCase(),
          firstName: firstName!.toString(),
          lastName: lastName!.toString(),
          role: 'CUSTOMER'
        }
      });
      
      // Update user with phone if provided
      if (phone) {
        await prisma.user.update({
          where: { id: user.userId },
          data: { phone: phone.toString() }
        });
      }
      
      // Create session
      const session = await auth.createSession({
        userId: user.userId,
        attributes: {}
      });
      
      // Set session cookie
      const sessionCookie = auth.createSessionCookie(session);
      cookies.set(sessionCookie.name, sessionCookie.value, {
        path: '.',
        ...sessionCookie.attributes
      });
      
      // Redirect to profile to complete account setup
      throw redirect(302, '/profile');
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error instanceof LuciaError && error.message === 'AUTH_DUPLICATE_KEY_ID') {
        return fail(400, { error: 'Email already in use' });
      }
      
      return fail(500, { error: 'Failed to create account. Please try again.' });
    }
  }
};
