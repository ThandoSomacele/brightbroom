# SvelteKit + Netlify Deployment Guide

## Architecture Overview

```
┌────────────────────┐     ┌───────────────────┐     ┌────────────────────┐
│                    │     │                   │     │                    │
│  SvelteKit App     │────▶│  Netlify Adapter  │────▶│  Netlify Platform  │
│                    │     │                   │     │                    │
└────────────────────┘     └───────────────────┘     └────────────────────┘
                                     │                          ▲
                                     │                          │
                                     ▼                          │
                           ┌───────────────────┐                │
                           │                   │                │
                           │  Build Output     │────────────────┘
                           │                   │
                           └───────────────────┘
```

## Critical File Paths

| Path | Description |
|------|-------------|
| `/.netlify/functions-internal/sveltekit-render.mjs` | Server-side renderer created by adapter |
| `/netlify/functions/handler.js` | Entry point for handling SSR requests |
| `/netlify/functions/auth.js` | Entry point for auth requests |
| `/.svelte-kit/netlify` | Build output directory |
| `/_redirects` | Netlify redirect rules |

## Common Configuration Issues

### 1. Import Path Problems

✅ **CORRECT:**
```javascript
// Use absolute path with leading slash
const { render } = await import('/.netlify/functions-internal/sveltekit-render.mjs');
```

❌ **INCORRECT:**
```javascript
// Don't use relative path to .svelte-kit directory
const { render } = await import('../../.svelte-kit/netlify/server/index.js');
```

### 2. ES Modules vs CommonJS

All functions must use ES Module syntax when `"type": "module"` is in package.json:

✅ **CORRECT:**
```javascript
// ES Module syntax
export const handler = async (event, context) => { ... }
```

❌ **INCORRECT:**
```javascript
// CommonJS syntax
exports.handler = async function(event, context) { ... }
```

### 3. Adapter Configuration

✅ **CORRECT:**
```javascript
// svelte.config.js
import adapter from "@sveltejs/adapter-netlify";

export default {
  kit: {
    adapter: adapter({
      edge: false // Disables edge functions which can cause issues
    })
  }
};
```

## SvelteKit Adapter Output Structure

The adapter creates these files:

```
.netlify/
├── functions-internal/
│   ├── sveltekit-render.mjs  <-- SSR function
│   └── sveltekit-auth.mjs    <-- Auth handling
└── ...

netlify/
└── functions/
    ├── handler.js           <-- Your custom entry point
    ├── auth.js              <-- Your custom auth handler
    └── ...
```

## Debugging Checklist

- [ ] Confirm netlify.toml has correct publish directory (`.svelte-kit/netlify`)
- [ ] Ensure correct import paths in handler.js (use `/.netlify/functions-internal/...`)
- [ ] Check package.json for `"type": "module"` and use ES Module syntax
- [ ] Verify adapter config in svelte.config.js (`edge: false` recommended)
- [ ] Look for build command using `netlify:build` script
- [ ] Confirm _redirects file is being copied to the publish directory
- [ ] Check node_bundler is set to "esbuild" in netlify.toml

## Environment Variables

Netlify auto-injects build variables but runtime variables need to be:
1. Set in Netlify dashboard
2. Prefixed with `VITE_` for client-side use

## Example Deployment Files

### netlify.toml
```toml
[build]
  command = "npm run build"  # or netlify:build
  publish = ".svelte-kit/netlify"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "20"

[functions]
  node_bundler = "esbuild"
  external_node_modules = ["@node-rs/argon2", "oslo"]
```

### _redirects
```
# SPA fallback for client routes 
/app/*      /index.html    200

# API routes to serverless functions
/*          /.netlify/functions/handler    200
```

### handler.js
```javascript
export const handler = async (event, context) => {
  try {
    const { render } = await import('/.netlify/functions-internal/sveltekit-render.mjs');
    return await render(event, context);
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```
