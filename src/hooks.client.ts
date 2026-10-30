// src/hooks.client.ts
import posthog from "posthog-js";
import { env } from "$env/dynamic/public";
import type { ClientInit } from "@sveltejs/kit";

/**
 * Start PostHog once, when the app starts in the browser. (This used to live
 * in the root +layout.ts load, whose empty return also threw away the root
 * layout's server data during server rendering.)
 *
 * Read at runtime so one build can serve any deployment. A deployment without
 * its own PostHog project leaves PUBLIC_POSTHOG_KEY empty and gets no analytics.
 */
export const init: ClientInit = () => {
  if (!env.PUBLIC_POSTHOG_KEY) return;

  posthog.init(env.PUBLIC_POSTHOG_KEY, {
    api_host: "/relay-VjWm", // Relative: works on any domain (proxied in hooks.server.ts)
    ui_host: env.PUBLIC_POSTHOG_UI_HOST,
    capture_pageview: false,
    capture_pageleave: false,
    capture_exceptions: true,
    persistence: "localStorage+cookie",
    opt_out_capturing_by_default: true, // Nothing is captured until the visitor consents
  });

  // Apply a consent choice made on an earlier visit
  const consentStatus = localStorage.getItem("cookie_consent_status");
  if (consentStatus === "granted") {
    posthog.opt_in_capturing();
  } else if (consentStatus === "denied") {
    posthog.opt_out_capturing();
  }
};
