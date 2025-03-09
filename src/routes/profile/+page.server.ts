// src/routes/profile/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Check for session (this is redundant with the hooks, but good for type safety)
  const session = await locals.auth.validate();
  
  if (!session) {
    throw redirect(302, '/auth/login');
  }
  
  // Return user data to the page
  return {
    user: session.user
  };
};
