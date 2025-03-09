// src/hooks.server.ts
import { auth } from '$lib/server/auth';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Attach auth to locals so it's available in all routes
  event.locals.auth = auth.handleRequest(event);
  
  // Get session and user
  const session = await event.locals.auth.validate();
  event.locals.session = session;
  event.locals.user = session?.user ?? null;
  
  // Protection for routes that require authentication
  if (event.url.pathname.startsWith('/profile') || 
      event.url.pathname.startsWith('/book')) {
    if (!session) {
      // Save the original URL to redirect back after login
      const redirectTo = encodeURIComponent(event.url.pathname);
      throw redirect(302, `/auth/login?redirectTo=${redirectTo}`);
    }
  }
  
  // Admin routes protection
  if (event.url.pathname.startsWith('/admin')) {
    if (!session || session.user.role !== 'ADMIN') {
      throw redirect(302, '/');
    }
  }
  
  // Cleaner routes protection
  if (event.url.pathname.startsWith('/cleaner')) {
    if (!session || session.user.role !== 'CLEANER') {
      throw redirect(302, '/');
    }
  }
  
  return resolve(event);
};
