import adapter from "@sveltejs/adapter-netlify";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
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
