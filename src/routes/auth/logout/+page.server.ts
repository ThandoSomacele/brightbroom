// src/routes/auth/logout/+page.server.ts
import { lucia } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

// Redirect if accessed directly
export const load: PageServerLoad = async () => {
  throw redirect(302, '/');
};

export const actions: Actions = {
  default: async ({ locals, cookies }) => {
    if (!locals.session) {
      throw redirect(302, '/');
    }
    
    // Invalidate session
    await lucia.invalidateSession(locals.session.id);
    
    // Remove session cookie
    const sessionCookie = lucia.createBlankSessionCookie();
    cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes
    });
    
    // Redirect to home
    throw redirect(302, '/');
  }
};
