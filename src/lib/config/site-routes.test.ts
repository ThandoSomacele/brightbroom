// src/lib/config/site-routes.test.ts
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ADMIN_NAV,
  adminNavFor,
  footerLinks,
  isAvailableOnSite,
  isBrightBroomOnlyPath,
  isPlatformOnlyAdminPath,
  isRetiredPath,
  RETIRED_PATHS,
  siteNav,
} from "./site-routes";
import { buildSitemapEntries, sitemapXml } from "$lib/seo/sitemap";

describe("BrightBroom-only pages", () => {
  it("are off on a company's site and on at brightbroom.com", () => {
    for (const path of ["/pricing", "/demo", "/paia", "/partner-terms"]) {
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

describe("retired pages", () => {
  it("cover the old suburb pages and the magazine, articles included", () => {
    expect(isRetiredPath("/magazine")).toBe(true);
    expect(isRetiredPath("/magazine/some-article")).toBe(true);
    expect(isRetiredPath("/cleaning-services-fourways")).toBe(true);
    expect(isRetiredPath("/services")).toBe(false);
  });

  it("each have a route, so Netlify sends them to the hook that redirects them", () => {
    for (const path of RETIRED_PATHS) expect(existsSync(`src/routes${path}/+server.ts`), path).toBe(true);
    expect(existsSync("src/routes/magazine/[slug]/+server.ts"), "articles").toBe(true);
  });
});

describe("menus", () => {
  it("speak to customers on a company's site", () => {
    const nav = siteNav(true).map((l) => l.href);
    expect(nav).toEqual(["/", "/services", "/about", "/contact"]);
    expect(footerLinks(true).map((l) => l.label)).toContain("Join as a cleaner");
    for (const link of [...siteNav(true), ...footerLinks(true)]) {
      expect(isAvailableOnSite(link.href.split("#")[0] || "/", true), link.href).toBe(true);
    }
  });

  it("speak to cleaning companies on brightbroom.com", () => {
    const labels = siteNav(false).map((l) => l.label);
    expect(labels).toEqual(expect.arrayContaining(["Pricing", "Live demo"]));
    expect(footerLinks(false).map((l) => l.label)).not.toContain("Join as a cleaner");
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
  it("lists a company's customer pages", () => {
    const paths = buildSitemapEntries(true).map((e) => e.path);
    expect(paths).toContain("/services");
    expect(paths).not.toContain("/pricing");
  });

  it("lists brightbroom.com's pages for cleaning companies, not the demo", () => {
    const paths = buildSitemapEntries(false).map((e) => e.path);
    expect(paths).toContain("/pricing");
    expect(paths).not.toContain("/services");
    expect(paths).not.toContain("/demo");
    expect(paths.some((p) => p.startsWith("/magazine") || p.startsWith("/cleaning-services-"))).toBe(false);
  });

  it("uses the site's own domain", () => {
    const xml = sitemapXml("https://sparkle.co.za", buildSitemapEntries(true));
    expect(xml).toContain("<loc>https://sparkle.co.za</loc>");
    expect(xml).toContain("<loc>https://sparkle.co.za/services</loc>");
    expect(xml).not.toContain("brightbroom");
  });
});
