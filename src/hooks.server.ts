// src/hooks.server.ts
import {
  deleteSessionTokenCookie,
  setSessionTokenCookie,
  validateSessionToken
} from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Get session token from cookie
  const token = event.cookies.get('session') || null;
  
  if (token === null) {
    event.locals.user = null;
    event.locals.session = null;
    return resolve(event);
  }
  
  // Validate the session
  const { session, user } = await validateSessionToken(token);
  
  if (session !== null) {
    // If session is valid, refresh the cookie
    setSessionTokenCookie(event, token, session.expiresAt);
  } else {
    // If session is invalid, delete the cookie
    deleteSessionTokenCookie(event);
  }
  
  // Set locals for use in routes
  event.locals.session = session;
  event.locals.user = user;
  
  return resolve(event);
};
