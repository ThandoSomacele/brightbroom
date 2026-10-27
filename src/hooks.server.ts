// src/hooks.server.ts
import { error, json, redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { env as publicEnv } from '$env/dynamic/public';
import { isSingleCompany, missingBrandSettings } from '$lib/config/brand';
import { validateSessionToken } from '$lib/server/auth';
import { isPlatformOnlyAdminPath, requireAdmin, routingPath } from '$lib/server/route-guards';
import type { User } from '$lib/server/db/schema';
import { tenantService } from '$lib/server/services/tenant.service';
import { randomBytes } from 'crypto';

/**
 * Authentication hook that validates session tokens and sets user data
 */
// A company's deployment must name itself; blanks would show on its pages and
// legal documents. Logged once at startup so a misconfigured deploy is obvious.
const missingBrand = missingBrandSettings();
if (missingBrand.length) {
  console.error(`[brand] Single-company mode is missing: ${missingBrand.join(', ')}. These show blank on the site until set.`);
}

const handleAuth: Handle = async ({ event, resolve }) => {
  // Get session token from cookies
  const sessionToken = event.cookies.get('session');
  
  // Default to no user and no session
  event.locals.user = null;
  event.locals.session = null;
  event.locals.tenant = null;
  event.locals.tenantMembership = null;

  if (sessionToken) {
    try {
      // Validate the session token
      const { user, session } = await validateSessionToken(sessionToken);

      if (session && user) {
        // Set user and session in locals
        event.locals.user = user as User;
        event.locals.session = session;

        // Load tenant membership for tenant admins and platform admins
        if (user.role === 'TENANT_ADMIN' || user.role === 'ADMIN') {
          const membership = await tenantService.getTenantForUser(user.id);
          if (membership) {
            event.locals.tenant = membership.tenant;
            event.locals.tenantMembership = membership;
          }
        }
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
  const path = routingPath(event.url.pathname);

  // Exempt PayFast IPN webhook and API endpoints that need external access
  const exemptPaths = [
    '/api/payments/ipn',
    '/api/payments/success',
    '/api/payments/cancel',
    '/api/payfast/subscription-webhook', // PayFast ITN; validates its own signature
    '/api/subscriptions/process-recurring' // Cron job endpoint
  ];

  if (exemptPaths.includes(path)) {
    return resolve(event);
  }

  // Cross-origin form submissions are refused here rather than by SvelteKit's
  // built-in check (disabled in svelte.config.js), because the built-in one
  // runs before hooks and cannot exempt webhook endpoints - PayFast's ITNs
  // are form-encoded posts with no Origin header, and were being 403'd before
  // any of our code ran. Same rule as SvelteKit's: a state-changing request
  // with a form content type must come from our own origin.
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(event.request.method)) {
    const contentType = event.request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
    const isFormPost = ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain']
      .includes(contentType ?? '');
    const origin = event.request.headers.get('origin');

    if (isFormPost && origin !== event.url.origin) {
      console.error('Cross-site form submission refused:', { path, origin });
      throw error(403, `Cross-site ${event.request.method} form submissions are forbidden`);
    }
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
 * PostHog reverse proxy hook - proxies requests to PostHog Cloud
 * This prevents ad blockers from blocking analytics requests
 */
const handlePostHogProxy: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;

  if (pathname.startsWith('/relay-VjWm')) {
    // Determine target hostname based on static or dynamic ingestion
    const hostname = pathname.startsWith('/relay-VjWm/static/')
      ? 'eu-assets.i.posthog.com'  // EU Cloud for static assets
      : 'eu.i.posthog.com';         // EU Cloud for API calls

    // Build external URL
    const url = new URL(event.request.url);
    url.protocol = 'https:';
    url.hostname = hostname;
    url.port = '443';
    url.pathname = pathname.replace('/relay-VjWm/', '');

    // Clone and adjust headers
    const headers = new Headers(event.request.headers);
    headers.set("Accept-Encoding", "");
    headers.set('host', hostname);

    // Proxy the request to PostHog
    const response = await fetch(url.toString(), {
      method: event.request.method,
      headers,
      body: event.request.body,
      duplex: "half"
    } as RequestInit);

    return response;
  }

  return resolve(event);
};

/** Routes that only make sense on the multi-company marketplace */
const MARKETPLACE_ONLY_PATHS = [
  '/join/company',
  '/partner-terms',
  '/admin/tenants',
  '/admin/verification',
  '/api/tenant',
];

/** True for one of those routes or anything below it (not merely a shared prefix) */
function isMarketplaceOnlyPath(path: string): boolean {
  return MARKETPLACE_ONLY_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * Custom routing hook to handle specific error cases
 */
const handleRouting: Handle = async ({ event, resolve }) => {
  // The path SvelteKit routes on, decoded. Checking the raw pathname let
  // "/%61dmin/..." past every guard below while still reaching /admin.
  const path = routingPath(event.url.pathname);

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

  // A single cleaning company's own site has no marketplace: no company
  // sign-up, no Cleaning Partner Agreement, no tenant management or company
  // vetting. Those routes answer 404 as if they did not exist.
  if (isSingleCompany && isMarketplaceOnlyPath(path)) {
    throw error(404, 'Not found');
  }

  // Bookings pause. Set PUBLIC_BOOKINGS_PAUSED=true (production context only)
  // while there are no trained cleaners to fulfil bookings: the funnel
  // redirects to an explanation page and the two payment-initiating endpoints
  // refuse, so no direct URL or scripted POST can take a customer's money.
  // Everything else - marketing, SEO pages, /join/cleaner, admin, cleaner
  // portal - stays up. The development branch deploy leaves this unset and
  // keeps the full sandbox flow for showcasing.
  if (publicEnv.PUBLIC_BOOKINGS_PAUSED === 'true') {
    if (path === '/book' || path.startsWith('/book/')) {
      throw redirect(302, '/bookings-paused');
    }
    if (path === '/api/payments/process' || path === '/api/subscription/create') {
      return json(
        { error: 'Bookings are paused while we onboard cleaners. Please check back soon.' },
        { status: 503 },
      );
    }
  }
  
  // Admin route protection.
  //
  // /api/admin is covered too. It was previously unguarded here and only half
  // its endpoints checked the caller themselves, so anyone unauthenticated
  // could upload or delete documents on a cleaner application.
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    // Platform admins, and tenant admins with a company outside the
    // platform-only areas. Each admin load, action and handler checks again
    // with requireAdmin, so a path this guard misses is still refused.
    requireAdmin(event.locals, { platformOnly: isPlatformOnlyAdminPath(path) });
  }
  
  // Continue with normal request handling
  return resolve(event);
};

// Combine hooks in sequence (order matters!)
// 1. First handle PostHog proxy (bypass auth/CSRF for analytics)
// 2. Then authenticate the user
// 3. Then check CSRF tokens
// 4. Then check route permissions
// 5. Finally handle any errors that occur
export const handle = sequence(handlePostHogProxy, handleAuth, handleCSRF, handleRouting, handleErrors);
