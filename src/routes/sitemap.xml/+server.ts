// src/routes/sitemap.xml/+server.ts
//
// Built per site, on the site's own domain (see src/lib/seo/sitemap.ts).
import { canonicalSiteUrl, isSingleCompany } from "$lib/config/brand";
import { buildSitemapEntries, sitemapXml } from "$lib/seo/sitemap";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = () => {
  const body = sitemapXml(canonicalSiteUrl, buildSitemapEntries(isSingleCompany));
  return new Response(body, {
    headers: { "content-type": "application/xml", "cache-control": "public, max-age=3600" },
  });
};
