import posthog from "posthog-js";
import { browser } from "$app/environment";
import { env } from "$env/dynamic/public";

export const load = async () => {
  // Read at runtime so one build can serve any deployment. A deployment without
  // its own PostHog project leaves PUBLIC_POSTHOG_KEY empty and gets no analytics.
  if (browser && env.PUBLIC_POSTHOG_KEY) {
    posthog.init(env.PUBLIC_POSTHOG_KEY, {
      api_host: "/relay-VjWm", // Hardcoded relative path - works with any staging/production domain
      ui_host: env.PUBLIC_POSTHOG_UI_HOST,
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
