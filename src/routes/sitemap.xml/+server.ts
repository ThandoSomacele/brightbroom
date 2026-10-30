// src/routes/sitemap.xml/+server.ts
//
// Built per site, on the site's own domain: a company's site lists only its
// own pages. (This replaces a static file that listed brightbroom.com pages
// on every deployment.)
import { canonicalSiteUrl, isSingleCompany } from "$lib/config/brand";
import { isAvailableOnSite } from "$lib/config/site-routes";
import { buildSitemapEntries, sitemapXml } from "$lib/seo/sitemap";
import { ArticleService } from "$lib/services/article.service";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  const articles = isAvailableOnSite("/magazine") ? await ArticleService.getAllArticles() : [];
  const body = sitemapXml(canonicalSiteUrl, buildSitemapEntries(isSingleCompany, articles));
  return new Response(body, {
    headers: { "content-type": "application/xml", "cache-control": "public, max-age=3600" },
  });
};
