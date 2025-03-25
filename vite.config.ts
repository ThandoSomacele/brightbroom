import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { imagetools } from "vite-imagetools";

export default defineConfig({
  plugins: [sveltekit(), imagetools()],
  optimizeDeps: {
    exclude: ["oslo", "@node-rs/argon2", "@oslojs/crypto", "@oslojs/encoding"],
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: [".."],
    },
  },
});
