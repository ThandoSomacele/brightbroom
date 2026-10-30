// src/lib/seo/sitemap.ts
//
// What this site lists in sitemap.xml: its public pages (only the ones it
// serves; see src/lib/config/site-routes.ts) and, where the magazine is on,
// its published articles.
import { isAvailableOnSite } from "$lib/config/site-routes";

type ChangeFreq = "daily" | "weekly" | "monthly" | "yearly";

export type SitemapEntry = { path: string; changefreq: ChangeFreq; priority: string; lastmod?: string };

/** Public pages worth indexing. Booking steps, accounts and admin are left out on purpose */
export const SITEMAP_PAGES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/services", changefreq: "weekly", priority: "0.9" },
  { path: "/service-areas", changefreq: "monthly", priority: "0.8" },
  { path: "/cleaning-services-fourways", changefreq: "monthly", priority: "0.8" },
  { path: "/cleaning-services-bryanston", changefreq: "monthly", priority: "0.8" },
  { path: "/cleaning-services-randburg", changefreq: "monthly", priority: "0.8" },
  { path: "/cleaning-services-midrand", changefreq: "monthly", priority: "0.8" },
  { path: "/cleaning-services-north-riding", changefreq: "monthly", priority: "0.8" },
  { path: "/cleaning-services-cosmo-city", changefreq: "monthly", priority: "0.8" },
  { path: "/pricing", changefreq: "monthly", priority: "0.7" },
  { path: "/magazine", changefreq: "weekly", priority: "0.7" },
  { path: "/join/cleaner", changefreq: "monthly", priority: "0.6" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/paia", changefreq: "yearly", priority: "0.3" },
  { path: "/partner-terms", changefreq: "yearly", priority: "0.3" },
];

/** The entries for this site; articles are { slug, publishedAt } from the magazine */
export function buildSitemapEntries(
  single: boolean,
  articles: { slug: string; publishedAt?: string | Date | null }[] = [],
): SitemapEntry[] {
  const pages = SITEMAP_PAGES.filter((p) => isAvailableOnSite(p.path, single));
  if (!isAvailableOnSite("/magazine", single)) return pages;

  const articleEntries = articles.map((a) => ({
    path: `/magazine/${a.slug}`,
    changefreq: "monthly" as const,
    priority: "0.6",
    lastmod: a.publishedAt ? new Date(a.publishedAt).toISOString().slice(0, 10) : undefined,
  }));
  return [...pages, ...articleEntries];
}

const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function sitemapXml(siteUrl: string, entries: SitemapEntry[]): string {
  const urls = entries.map((e) =>
    [
      "  <url>",
      `    <loc>${xmlEscape(`${siteUrl}${e.path === "/" ? "" : e.path}`)}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : "",
      `    <changefreq>${e.changefreq}</changefreq>`,
      `    <priority>${e.priority}</priority>`,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}
