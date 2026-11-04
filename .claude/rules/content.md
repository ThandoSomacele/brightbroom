---
paths:
  - "src/routes/magazine/**"
  - "src/routes/cleaning-services-*/**"
---
# Magazine and SEO pages

- Articles are Markdown in `src/routes/magazine/`, parsed with `marked` and `gray-matter`.
- Service-area landing pages (e.g. `/cleaning-services-bryanston`) are SEO pages; keep them in `src/lib/config/site-routes.ts` so client sites don't get them.
