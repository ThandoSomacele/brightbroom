// src/lib/seo/sitemap.ts
//
// What each site lists in sitemap.xml. A company's site lists the pages its
// customers search for; brightbroom.com lists the pages for cleaning
// companies (its customer pages are a live demo and aren't listed).

type ChangeFreq = "daily" | "weekly" | "monthly" | "yearly";

export type SitemapEntry = { path: string; changefreq: ChangeFreq; priority: string };

const CLIENT_PAGES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/services", changefreq: "weekly", priority: "0.9" },
  { path: "/service-areas", changefreq: "monthly", priority: "0.8" },
  { path: "/join/cleaner", changefreq: "monthly", priority: "0.6" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
];

const BRIGHTBROOM_PAGES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/pricing", changefreq: "monthly", priority: "0.9" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/paia", changefreq: "yearly", priority: "0.3" },
  { path: "/partner-terms", changefreq: "yearly", priority: "0.3" },
];

/** The entries for this site */
export function buildSitemapEntries(single: boolean): SitemapEntry[] {
  return single ? CLIENT_PAGES : BRIGHTBROOM_PAGES;
}

const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function sitemapXml(siteUrl: string, entries: SitemapEntry[]): string {
  const urls = entries.map((e) =>
    [
      "  <url>",
      `    <loc>${xmlEscape(`${siteUrl}${e.path === "/" ? "" : e.path}`)}</loc>`,
      `    <changefreq>${e.changefreq}</changefreq>`,
      `    <priority>${e.priority}</priority>`,
      "  </url>",
    ].join("\n"),
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}
