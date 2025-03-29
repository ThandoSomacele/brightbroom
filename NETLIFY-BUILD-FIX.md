# Netlify Build Fix

This document describes the changes made to fix the Netlify build process.

## Issues Fixed

1. Missing dependencies:
   - `@sveltejs/adapter-netlify`
   - `@sveltejs/vite-plugin-svelte`

2. Outdated build commands:
   - The SvelteKit CLI has changed, requiring updates to build commands

## Changes Made

1. Updated `netlify/scripts/pre-build.sh`:
   - Added explicit installation of required dependencies:
     ```bash
     npm i @sveltejs/adapter-netlify @sveltejs/kit @sveltejs/vite-plugin-svelte vite
     ```
   - Added diagnostic output to verify adapter installation

2. Updated `package.json`:
   - Updated build script to use Vite directly:
     ```json
     "build": "svelte-kit sync && vite build"
     ```
   - Updated debug scripts similarly
   - Removed duplicate dependency entry for `@sveltejs/vite-plugin-svelte` (was in both dependencies and devDependencies)

3. Updated `netlify.toml`:
   - Changed build commands to use npm scripts instead of direct calls:
     ```
     npm run build  # instead of npx svelte-kit build
     ```

## Testing

The fixes were tested locally to confirm the build succeeds, with the following command:
```bash
npm ci && ./netlify/scripts/pre-build.sh && npx svelte-kit sync && npm run build
```

## Notes

There are some TypeScript errors and accessibility warnings in the code, but these don't prevent the build from completing. These could be addressed in a future update.