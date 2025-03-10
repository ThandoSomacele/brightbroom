// src/routes/auth/register/+page.server.ts
import { lucia } from '$lib/server/auth';
import { prisma } from '$lib/server/prisma';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { Argon2id } from 'oslo/password';
import type { Actions, PageServerLoad } from './$types';

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
    const existingUser = await prisma.user.findUnique({
      where: { email: email! }
    });
    
    if (existingUser) {
      return fail(400, { error: 'Email already in use' });
    }
    
    try {
      // Hash the password
      const hasher = new Argon2id();
      const hashedPassword = await hasher.hash(password!);
      
      // Create user in database
      const user = await prisma.user.create({
        data: {
          email: email!,
          firstName: firstName!.toString(),
          lastName: lastName!.toString(),
          passwordHash: hashedPassword,
          role: 'CUSTOMER',
          phone: phone?.toString() || null
        }
      });
      
      // Create key for the user (for email/password authentication)
      await prisma.key.create({
        data: {
          id: `email:${email}`,
          userId: user.id,
          hashedPassword: hashedPassword
        }
      });
      
      // Create session
      const session = await lucia.createSession(user.id, {});
      
      // Set session cookie
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies.set(sessionCookie.name, sessionCookie.value, {
        path: '.',
        ...sessionCookie.attributes
      });
      
      // Redirect to profile to complete account setup
      throw redirect(302, '/profile');
    } catch (error) {
      console.error('Registration error:', error);
      return fail(500, { error: 'Failed to create account. Please try again.' });
    }
  }
};
