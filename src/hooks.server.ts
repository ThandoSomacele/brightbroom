// src/hooks.server.ts
import { error, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { validateSessionToken } from '$lib/server/auth';
import type { User } from '$lib/server/db/schema';

/**
 * Authentication hook that validates session tokens and sets user data
 */
const handleAuth: Handle = async ({ event, resolve }) => {
  // Get session token from cookies
  const sessionToken = event.cookies.get('session');
  
  // Default to no user and no session
  event.locals.user = null;
  event.locals.session = null;
  
  if (sessionToken) {
    try {
      // Validate the session token
      const { user, session } = await validateSessionToken(sessionToken);
      
      if (session && user) {
        // Set user and session in locals
        event.locals.user = user as User;
        event.locals.session = session;
      }
    } catch (err) {
      console.error('Session validation error:', err);
      // Continue without user/session if validation fails
    }
  }
  
  return resolve(event);
};

/**
 * Error handling hook that captures and formats server errors
 */
const handleErrors: Handle = async ({ event, resolve }) => {
  try {
    return await resolve(event);
  } catch (e) {
    console.error('Server error:', e);
    
    // Convert Error to a standard format
    const err = e as Error;
    
    // Check if it's already a SvelteKit error with a status
    if (err instanceof Error && 'status' in err) {
      // Pass through SvelteKit errors
      throw err;
    } else {
      // Format non-SvelteKit errors
      const message = process.env.NODE_ENV === 'development' 
        ? err.message || 'Unknown server error'
        : 'An unexpected error occurred';
      
      throw error(500, message);
    }
  }
};

/**
 * Custom routing hook to handle specific error cases
 */
const handleRouting: Handle = async ({ event, resolve }) => {
  // Get the requested path
  const path = event.url.pathname;

 // IMPORTANT: Allow PayFast IPN webhook without authentication
// Add this to your handleRouting function 
if (path === '/api/payments/ipn') {
  console.log('PayFast IPN webhook accessed - request details:', {
    method: event.request.method,
    headers: Object.fromEntries([...event.request.headers.entries()]),
    path: event.url.pathname
  });
  return resolve(event);
}

// Handle any custom routing error cases
if (path.includes('//')) {
  // Double slashes in URL path - redirect to corrected URL
  throw error(404, "Invalid URL format");
}
  
  // Admin route protection
  if (path.startsWith('/admin')) {
    const user = event.locals.user;
    
    // Check if not authenticated
    if (!user) {
      throw error(401, "Authentication required");
    }
    
    // Check if not admin
    if (user.role !== 'ADMIN') {
      throw error(403, "You don't have permission to access this area");
    }
  }
  
  // Continue with normal request handling
  return resolve(event);
};

// Combine hooks in sequence (order matters!)
// 1. First authenticate the user
// 2. Then check route permissions
// 3. Finally handle any errors that occur
export const handle = sequence(handleAuth, handleRouting, handleErrors);
