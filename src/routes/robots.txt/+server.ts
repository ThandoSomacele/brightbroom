// src/routes/robots.txt/+server.ts
//
// Built per site so the Sitemap line points at this site's own domain.
import { canonicalSiteUrl } from "$lib/config/brand";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = () => {
  const body = `User-agent: *
Allow: /

# Accounts, admin and the booking and payment steps are not for search engines
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Disallow: /cleaner/
Disallow: /profile/
Disallow: /book/
Disallow: /payment/

Sitemap: ${canonicalSiteUrl}/sitemap.xml
`;
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
};
