import posthog from "posthog-js";
import { browser } from "$app/environment";
import { PUBLIC_POSTHOG_KEY, PUBLIC_POSTHOG_UI_HOST } from "$env/static/public";

export const load = async () => {
  if (browser) {
    posthog.init(PUBLIC_POSTHOG_KEY, {
      api_host: "/relay-VjWm", // Hardcoded relative path - works with any staging/production domain
      ui_host: PUBLIC_POSTHOG_UI_HOST,
      capture_pageview: false,
      capture_pageleave: false,
      capture_exceptions: true, // This enables capturing exceptions using Error Tracking
      persistence: "localStorage+cookie", // Use both localStorage and cookies
      opt_out_capturing_by_default: true, // Don't capture until user gives consent
    });

    // Check for existing consent and apply it
    const consentStatus = localStorage.getItem('cookie_consent_status');
    if (consentStatus === 'granted') {
      posthog.opt_in_capturing();
    } else if (consentStatus === 'denied') {
      posthog.opt_out_capturing();
    }
  }

  return;
};
