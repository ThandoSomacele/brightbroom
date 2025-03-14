// src/hooks.server.ts
import {
  deleteSessionTokenCookie,
  setSessionTokenCookie,
  validateSessionToken
} from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  try {
    // Get session token from cookie
    const token = event.cookies.get('session') || null;
    
    if (token === null) {
      event.locals.user = null;
      event.locals.session = null;
      return await resolve(event);
    }
    
    // Validate the session
    const { session, user } = await validateSessionToken(token);
    
    if (session !== null) {
      // If session is valid, refresh the cookie
      setSessionTokenCookie(event, token, session.expiresAt);
      
      // Set locals for use in routes
      event.locals.session = session;
      event.locals.user = user;
    } else {
      // If session is invalid, delete the cookie
      deleteSessionTokenCookie(event);
      
      // Clear locals
      event.locals.session = null;
      event.locals.user = null;
    }
  } catch (error) {
    console.error('Error in hooks.server.ts:', error);
    
    // Ensure locals are cleared in case of error
    event.locals.session = null;
    event.locals.user = null;
  }
  
  // Resolve the request
  return await resolve(event);
};
