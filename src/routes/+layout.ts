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
    });
  }

  return;
};
