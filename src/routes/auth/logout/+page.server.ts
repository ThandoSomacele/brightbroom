// src/routes/auth/logout/+page.server.ts
import { auth } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

// Redirect if accessed directly
export const load: PageServerLoad = async () => {
  throw redirect(302, '/');
};

export const actions: Actions = {
  default: async ({ locals, cookies }) => {
    const session = await locals.auth.validate();
    
    if (!session) {
      throw redirect(302, '/');
    }
    
    // Invalidate session
    await auth.invalidateSession(session.sessionId);
    
    // Remove session cookie
    const sessionCookie = auth.createSessionCookie(null);
    cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes
    });
    
    // Redirect to home
    throw redirect(302, '/');
  }
};
