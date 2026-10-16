import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

// Deployment target. Unset (the default) builds for Netlify exactly as before:
// that is brightbroom.com, the sales demo. DEPLOY_TARGET=node builds a plain
// Node server into ./build for the self-hosted, one-per-company deployments
// (Docker on Coolify; see Dockerfile and docs/SELF_HOSTING.md).
const deployTarget = process.env.DEPLOY_TARGET;

// Imported dynamically so each build only loads the adapter it uses.
const adapter =
  deployTarget === "node"
    ? (await import("@sveltejs/adapter-node")).default({ out: "build" })
    : (await import("@sveltejs/adapter-netlify")).default({
        // Use standard Node-based functions (not edge functions)
        edge: false,
        // Split your app into multiple functions
        // This can help avoid the 50MB function size limit
        split: true,
      });

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
    adapter,
  },
};

export default config;
