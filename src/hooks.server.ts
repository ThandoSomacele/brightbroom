// src/hooks.server.ts
import { error, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { validateSessionToken } from '$lib/server/auth';
import type { User } from '$lib/server/db/schema';
import { randomBytes } from 'crypto';

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
 * CSRF Protection hook - generates and validates CSRF tokens
 */
const handleCSRF: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname;

  // Exempt PayFast IPN webhook and API endpoints that need external access
  const exemptPaths = [
    '/api/payments/ipn',
    '/api/payments/success',
    '/api/payments/cancel'
  ];

  if (exemptPaths.includes(path)) {
    return resolve(event);
  }

  // For state-changing requests, validate CSRF token
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(event.request.method)) {
    const token = event.cookies.get('csrf');
    const headerToken = event.request.headers.get('x-csrf-token');

    // For form submissions, we'll check the token in the form action
    // For API calls, check the header
    const isFormSubmission = event.request.headers.get('content-type')?.includes('application/x-www-form-urlencoded') ||
                             event.request.headers.get('content-type')?.includes('multipart/form-data');

    if (!isFormSubmission && !token) {
      console.error('CSRF token missing:', {
        path,
        method: event.request.method
      });
      throw error(403, 'CSRF token required');
    }

    // For API calls, validate header token
    if (!isFormSubmission && token !== headerToken) {
      console.error('CSRF token mismatch in header:', {
        path,
        method: event.request.method,
        hasToken: !!token,
        hasHeaderToken: !!headerToken
      });
      throw error(403, 'Invalid CSRF token');
    }
  }

  // Generate new CSRF token for all requests
  if (!event.cookies.get('csrf')) {
    const csrfToken = randomBytes(32).toString('hex');
    event.cookies.set('csrf', csrfToken, {
      path: '/',
      httpOnly: true,
      secure: event.url.protocol === 'https:',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });
    event.locals.csrf = csrfToken;
  } else {
    event.locals.csrf = event.cookies.get('csrf')!;
  }

  return resolve(event);
};

/**
 * Custom routing hook to handle specific error cases
 */
const handleRouting: Handle = async ({ event, resolve }) => {
  // Get the requested path
  const path = event.url.pathname;

// IMPORTANT: Completely exempt PayFast IPN webhook from all checks
if (path === '/api/payments/ipn') {
  console.log('PayFast IPN webhook accessed:', {
    method: event.request.method,
    path: event.url.pathname
  });
  // Bypass ALL checks and middleware
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
// 2. Then check CSRF tokens
// 3. Then check route permissions
// 4. Finally handle any errors that occur
export const handle = sequence(handleAuth, handleCSRF, handleRouting, handleErrors);
