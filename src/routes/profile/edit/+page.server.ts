// src/routes/profile/edit/+page.server.ts
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

// Load user data for the form
export const load: PageServerLoad = async ({ locals }) => {
  // Check if the user is logged in
  if (!locals.user) {
    throw redirect(302, '/auth/login?redirectTo=/profile/edit');
  }
  
  return {
    user: locals.user
  };
};

// Form validation schema
const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional()
});

export const actions: Actions = {
  default: async ({ request, locals }) => {
    // Check if the user is logged in
    if (!locals.user) {
      return fail(401, { error: 'You must be logged in to update your profile' });
    }
    
    const formData = await request.formData();
    const firstName = formData.get('firstName')?.toString();
    const lastName = formData.get('lastName')?.toString();
    const phone = formData.get('phone')?.toString() || null;
    
    try {
      // Validate form data
      profileSchema.parse({ firstName, lastName, phone });
      
      // Update user in the database
      await db.update(user)
        .set({
          firstName,
          lastName,
          phone,
          updatedAt: new Date()
        })
        .where(eq(user.id, locals.user.id));
      
      // Return success message
      return {
        success: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error instanceof z.ZodError) {
        const errors = error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] || 'Invalid input';
        return fail(400, { error: firstError });
      }
      
      return fail(500, { error: 'Failed to update profile. Please try again.' });
    }
  }
};
