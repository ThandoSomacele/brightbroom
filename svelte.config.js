import adapter from "@sveltejs/adapter-netlify";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    // Configure the adapter with the proper options
    adapter: adapter({
      // Edge functions are optional - not using for now to ensure compatibility
      edge: false,

      // Split builds are recommended for most SvelteKit apps
      split: true,

      // This is crucial for ESM compatibility
      external: ["@node-rs/argon2", "oslo", "@oslojs/crypto", "@oslojs/encoding"]
    }),
  },
};

export default config;
