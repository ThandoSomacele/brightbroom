import adapter from "@sveltejs/adapter-netlify";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // SvelteKit's built-in origin check rejects any form-encoded POST without
    // a matching Origin header - which includes every server-to-server
    // webhook, PayFast's ITNs among them, before hooks or handlers ever run.
    // The identical check lives in hooks.server.ts (handleCSRF) instead,
    // where webhook paths can be exempted. Do not turn this back on without
    // moving the webhook endpoints out of SvelteKit.
    csrf: {
      checkOrigin: false,
    },
    // Required for PostHog session replay to work correctly
    paths: {
      relative: false,
    },
    adapter: adapter({
      // Use standard Node-based functions (not edge functions)
      edge: false,
      // Split your app into multiple functions
      // This can help avoid the 50MB function size limit
      split: true,
    }),
  },
};

export default config;
