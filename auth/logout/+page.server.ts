// src/routes/auth/logout/+page.server.ts
import {
  deleteSessionTokenCookie,
  invalidateSession
} from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

// Redirect if accessed directly
export const load: PageServerLoad = async () => {
  throw redirect(302, '/');
};

export const actions: Actions = {
  default: async (event) => {
    try {
      // Handle session invalidation
      if (event.locals.session) {
        await invalidateSession(event.locals.session.id);
      }
      
      // Clear the cookie
      deleteSessionTokenCookie(event);
      
      console.log('User logged out successfully');
      
    } catch (error) {
      console.error('Error during logout:', error);
    }
    
    // Always redirect home regardless of errors
    throw redirect(302, '/');
  }
};
