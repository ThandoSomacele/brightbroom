// src/lib/server/csrf.ts
import { fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Validates CSRF token from form data
 * Call this at the beginning of any form action
 */
export function validateCSRFToken(event: RequestEvent, formData: FormData) {
  const token = event.cookies.get('csrf');
  const formToken = formData.get('csrf_token')?.toString();

  if (!token || token !== formToken) {
    console.error('CSRF token validation failed:', {
      path: event.url.pathname,
      hasToken: !!token,
      hasFormToken: !!formToken,
      tokensMatch: token === formToken
    });
    return fail(403, { error: 'Invalid security token. Please refresh the page and try again.' });
  }

  return null;
}