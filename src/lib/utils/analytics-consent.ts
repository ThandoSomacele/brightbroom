// src/lib/utils/analytics-consent.ts
import posthog from 'posthog-js';
import { browser } from '$app/environment';

/**
 * Enable PostHog tracking after user consent
 */
export function enableAnalytics() {
  if (browser && posthog) {
    posthog.opt_in_capturing();
    console.log('Analytics tracking enabled');
  }
}

/**
 * Disable PostHog tracking when user declines
 */
export function disableAnalytics() {
  if (browser && posthog) {
    posthog.opt_out_capturing();
    console.log('Analytics tracking disabled');
  }
}

/**
 * Get current PostHog opt-in status
 */
export function getAnalyticsStatus(): boolean {
  if (browser && posthog) {
    return posthog.has_opted_in_capturing();
  }
  return false;
}
