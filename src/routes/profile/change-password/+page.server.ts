// src/routes/profile/change-password/+page.server.ts
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

// Load function to ensure user is authenticated
export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, '/auth/login?redirectTo=/profile/change-password');
  }

  return {};
};

// Form validation schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

export const actions: Actions = {
  default: async ({ request, locals }) => {
    // Check if user is logged in
    if (!locals.user) {
      return fail(401, { error: 'You must be logged in to change your password' });
    }

    const formData = await request.formData();
    const currentPassword = formData.get('currentPassword')?.toString();
    const newPassword = formData.get('newPassword')?.toString();
    const confirmPassword = formData.get('confirmPassword')?.toString();

    try {
      // Validate form data
      passwordSchema.parse({ currentPassword, newPassword, confirmPassword });

      // Get user from database
      const userData = await db.select()
        .from(user)
        .where(eq(user.id, locals.user.id))
        .limit(1);

      if (!userData || userData.length === 0) {
        return fail(404, { error: 'User not found' });
      }

      // Verify current password
      const { Argon2id } = await import('oslo/password');
      const hasher = new Argon2id();
      const validPassword = await hasher.verify(userData[0].passwordHash, currentPassword!);

      if (!validPassword) {
        return fail(400, { error: 'Current password is incorrect' });
      }

      // Check that new password is different from current password
      const samePassword = await hasher.verify(userData[0].passwordHash, newPassword!);
      if (samePassword) {
        return fail(400, { error: 'New password must be different from current password' });
      }

      // Hash the new password
      const hashedPassword = await hasher.hash(newPassword!);

      // Update user's password in database
      await db.update(user)
        .set({
          passwordHash: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(user.id, locals.user.id));

      console.log('Password changed successfully for user:', locals.user.id);

      // Return success message
      return {
        success: 'Password changed successfully'
      };
    } catch (error) {
      console.error('Error changing password:', error);

      if (error instanceof z.ZodError) {
        const errors = error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] || 'Invalid input';
        return fail(400, { error: firstError });
      }

      return fail(500, { error: 'Failed to change password. Please try again.' });
    }
  }
};
