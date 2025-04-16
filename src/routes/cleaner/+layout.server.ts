// src/routes/cleaner/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals }) => {
  const { user } = locals;
  
  // Check if user is logged in
  if (!user) {
    throw redirect(302, '/auth/login?redirectTo=/cleaner/dashboard');
  }
  
  // Check if user has CLEANER role
  if (user.role !== 'CLEANER') {
    // Redirect customers to their profile, admins to admin dashboard
    const redirectPath = user.role === 'ADMIN' ? '/admin/dashboard' : '/profile';
    throw redirect(302, redirectPath);
  }
  
  // If authorized, pass user data to all cleaner pages
  return {
    user
  };
};
