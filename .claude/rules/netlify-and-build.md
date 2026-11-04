---
paths:
  - "netlify.toml"
  - "netlify/**"
  - "svelte.config.js"
  - "vite.config.ts"
  - "tailwind.config.ts"
  - "static/**"
  - "Dockerfile"
  - "scripts/docker/**"
---
# Netlify and build

- `adapter-netlify` with `edge: false` and `split: true` (avoids the 50 MB function limit). `DEPLOY_TARGET=node` builds the adapter-node image for self-hosted clients (`docs/SELF_HOSTING.md`).
- **Never create a `_redirects` file**: the adapter handles routing, and the file breaks the build ("The _redirects file should be placed in the project root").
- Custom 404: `static/404.html`, inline CSS only (no Tailwind CDN).
- Build runs `netlify/scripts/` pre-build diagnostics, then `deploy-db.sh` to apply migrations.
- `paths.relative = false` in `svelte.config.js` is required for PostHog session replay.
- Tailwind dark mode is class-based; `prettier-plugin-tailwindcss` sorts classes; images via `vite-imagetools`.
