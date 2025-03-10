// src/routes/profile/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Check if the user is logged in (this is redundant with the hooks, but good for type safety)
  if (!locals.user) {
    throw redirect(302, '/auth/login');
  }
  
  // Return user data to the page
  return {
    user: locals.user
  };
};
