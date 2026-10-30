// src/lib/config/site-routes.test.ts
import { describe, expect, it } from "vitest";
import {
  ADMIN_NAV,
  FOOTER_LINKS,
  PUBLIC_NAV,
  adminNavFor,
  isAvailableOnSite,
  isBrightBroomOnlyPath,
  isPlatformOnlyAdminPath,
  linksForSite,
} from "./site-routes";
import { buildSitemapEntries, sitemapXml } from "$lib/seo/sitemap";

describe("BrightBroom-only pages", () => {
  it("are off on a company's site and on at brightbroom.com", () => {
    for (const path of ["/pricing", "/magazine", "/magazine/some-article", "/paia", "/cleaning-services-fourways"]) {
      expect(isAvailableOnSite(path, true), path).toBe(false);
      expect(isAvailableOnSite(path, false), path).toBe(true);
    }
  });

  it("match whole path segments only", () => {
    expect(isBrightBroomOnlyPath("/pricing")).toBe(true);
    expect(isBrightBroomOnlyPath("/pricingx")).toBe(false);
    expect(isAvailableOnSite("/services", true)).toBe(true);
    expect(isAvailableOnSite("/join/cleaner", true)).toBe(true);
  });
});

describe("menus", () => {
  it("never link a company's site to a page it doesn't serve", () => {
    for (const link of [...linksForSite(PUBLIC_NAV, true), ...linksForSite(FOOTER_LINKS, true)]) {
      expect(isAvailableOnSite(link.href, true), link.href).toBe(true);
    }
    expect(linksForSite(PUBLIC_NAV, true).map((l) => l.label)).not.toContain("Magazine");
    expect(linksForSite(FOOTER_LINKS, true).map((l) => l.label)).not.toContain("Pricing for companies");
    expect(linksForSite(PUBLIC_NAV, false)).toHaveLength(PUBLIC_NAV.length);
  });

  it("show platform-only admin areas to platform admins only", () => {
    const companyAdmin = adminNavFor(false, false).map((l) => l.href);
    expect(companyAdmin).not.toContain("/admin/coupons");
    expect(companyAdmin).not.toContain("/admin/service-areas");
    expect(companyAdmin).toContain("/admin/bookings");
    expect(adminNavFor(true, false)).toHaveLength(ADMIN_NAV.length);
    // A company's own site has no tenant management
    expect(adminNavFor(true, true).map((l) => l.href)).not.toContain("/admin/tenants");
  });

  it("agree with the guard on what is platform-only", () => {
    expect(isPlatformOnlyAdminPath("/admin/service-areas")).toBe(true);
    expect(isPlatformOnlyAdminPath("/admin/bookings/123")).toBe(false);
  });
});

describe("sitemap", () => {
  const articles = [{ slug: "tidy-kitchen", publishedAt: "2026-05-01" }];

  it("lists only a company's own pages, and no magazine", () => {
    const paths = buildSitemapEntries(true, articles).map((e) => e.path);
    expect(paths).toContain("/services");
    expect(paths).not.toContain("/pricing");
    expect(paths).not.toContain("/magazine");
    expect(paths).not.toContain("/magazine/tidy-kitchen");
    expect(paths.some((p) => p.startsWith("/cleaning-services-"))).toBe(false);
  });

  it("lists BrightBroom's pages and articles on brightbroom.com", () => {
    const entries = buildSitemapEntries(false, articles);
    expect(entries.map((e) => e.path)).toContain("/pricing");
    expect(entries.find((e) => e.path === "/magazine/tidy-kitchen")?.lastmod).toBe("2026-05-01");
  });

  it("uses the site's own domain", () => {
    const xml = sitemapXml("https://sparkle.co.za", buildSitemapEntries(true));
    expect(xml).toContain("<loc>https://sparkle.co.za</loc>");
    expect(xml).toContain("<loc>https://sparkle.co.za/services</loc>");
    expect(xml).not.toContain("brightbroom");
  });
});
