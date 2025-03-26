import adapter from "@sveltejs/adapter-netlify";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    // Configure the adapter with the proper options
    adapter: adapter({
      // Edge functions are optional but recommended for API routes
      edge: false,

      // Split builds are recommended for most SvelteKit apps
      split: true,
    }),
  },
};

export default config;
