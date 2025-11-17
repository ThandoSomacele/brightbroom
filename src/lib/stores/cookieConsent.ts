// src/lib/stores/cookieConsent.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { enableAnalytics, disableAnalytics } from '$lib/utils/analytics-consent';

export type ConsentStatus = 'pending' | 'granted' | 'denied';

const CONSENT_KEY = 'cookie_consent_status';

// Get initial consent status from localStorage
function getInitialConsent(): ConsentStatus {
  if (!browser) return 'pending';

  const stored = localStorage.getItem(CONSENT_KEY);
  if (stored === 'granted' || stored === 'denied') {
    return stored as ConsentStatus;
  }

  return 'pending';
}

// Create the store
export const consentStatus = writable<ConsentStatus>(getInitialConsent());

// Accept cookies
export function acceptCookies() {
  if (browser) {
    localStorage.setItem(CONSENT_KEY, 'granted');
    consentStatus.set('granted');
    enableAnalytics(); // Enable PostHog tracking
  }
}

// Decline cookies
export function declineCookies() {
  if (browser) {
    localStorage.setItem(CONSENT_KEY, 'denied');
    consentStatus.set('denied');
    disableAnalytics(); // Disable PostHog tracking
  }
}

// Reset consent (for testing or user preference changes)
export function resetConsent() {
  if (browser) {
    localStorage.removeItem(CONSENT_KEY);
    consentStatus.set('pending');
  }
}
