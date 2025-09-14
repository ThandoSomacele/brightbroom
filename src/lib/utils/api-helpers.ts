// API Helper utilities for client-side API calls
import { get } from 'svelte/store';
import { page } from '$app/stores';

/**
 * Get headers for API requests including CSRF token
 */
export function getAPIHeaders(): HeadersInit {
  const pageData = get(page);
  const csrfToken = pageData?.data?.csrf;

  return {
    'Content-Type': 'application/json',
    ...(csrfToken && { 'x-csrf-token': csrfToken })
  };
}

/**
 * Make a secure API request with CSRF token
 */
export async function secureAPIFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = getAPIHeaders();

  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {})
    }
  });
}