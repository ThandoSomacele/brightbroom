// src/lib/config/site-routes.ts
//
// Which pages exist on which site. The same code serves brightbroom.com
// (BrightBroom's own site and sales demo) and each cleaning company's own
// site (PUBLIC_PLATFORM_MODE=single). These lists drive the route guard in
// hooks.server.ts, the site and admin menus, and sitemap.xml/robots.txt, so a
// page that is off on a company's site is also unlinked and unlisted there.
//
// Client-safe on purpose (layouts import it): paths only, nothing secret.
import { isSingleCompany } from "$lib/config/brand";

/**
 * BrightBroom's own pages: its sales pricing, the live demo of a company's
 * home page, legal documents for the old marketplace and its PAIA manual. A
 * company's site answers 404 for them.
 */
export const BRIGHTBROOM_ONLY_PATHS = [
  "/pricing",
  "/demo",
  "/join/company",
  "/partner-terms",
  "/paia",
  "/admin/tenants",
] as const;

/**
 * Pages brightbroom.com no longer has: its customer-facing suburb pages and
 * home-cleaning magazine, retired when it became the site for cleaning
 * companies. Old links and search results are redirected to the home page.
 */
export const RETIRED_PATHS = [
  "/magazine",
  "/cleaning-services-bryanston",
  "/cleaning-services-cosmo-city",
  "/cleaning-services-fourways",
  "/cleaning-services-midrand",
  "/cleaning-services-north-riding",
  "/cleaning-services-randburg",
] as const;

/** Admin areas for platform admins only; a company admin gets a 403 */
export const PLATFORM_ONLY_ADMIN_PATHS = [
  "/admin/tenants",
  "/admin/pricing",
  "/admin/users",
  "/admin/services",
  "/admin/service-areas",
  "/admin/coupons",
  "/admin/test-emails",
  "/admin/applications/new",
] as const;

/** `path` is one of `paths` or below it, not merely sharing a prefix ("/pricingx") */
function isUnder(path: string, paths: readonly string[]): boolean {
  return paths.some((p) => path === p || path.startsWith(`${p}/`));
}

/** A retired page (any site): answered with a redirect to the home page */
export function isRetiredPath(path: string): boolean {
  return isUnder(path, RETIRED_PATHS);
}

/** One of BrightBroom's own pages. Pass the decoded routing path */
export function isBrightBroomOnlyPath(path: string): boolean {
  return isUnder(path, BRIGHTBROOM_ONLY_PATHS);
}

/**
 * A platform-only admin area. Deliberately a plain prefix match: over-matching
 * a deny list only refuses more. Pass the decoded routing path.
 */
export function isPlatformOnlyAdminPath(path: string): boolean {
  return PLATFORM_ONLY_ADMIN_PATHS.some((p) => path.startsWith(p));
}

/** Whether this site serves `path`: everything, except BrightBroom's own pages on a company's site */
export function isAvailableOnSite(path: string, single: boolean = isSingleCompany): boolean {
  return !(single && isBrightBroomOnlyPath(path));
}

export type NavLink = { label: string; href: string };

/**
 * The menus. A company's site speaks to its customers; brightbroom.com speaks
 * to cleaning companies, with the customer pages kept as a live demo.
 */
const CLIENT_NAV: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const BRIGHTBROOM_NAV: NavLink[] = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Live demo", href: "/demo" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const CLIENT_FOOTER: NavLink[] = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Cookie Preferences", href: "/cookie-preferences" },
  { label: "Join as a cleaner", href: "/join/cleaner" },
  { label: "Contact", href: "/contact" },
];

const BRIGHTBROOM_FOOTER: NavLink[] = [
  { label: "Pricing", href: "/pricing" },
  { label: "Live demo", href: "/demo" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "PAIA Manual", href: "/paia" },
  { label: "Cookie Preferences", href: "/cookie-preferences" },
  { label: "Contact", href: "/contact" },
];

/** The main menu (desktop and mobile) for this site */
export function siteNav(single: boolean = isSingleCompany): NavLink[] {
  return single ? CLIENT_NAV : BRIGHTBROOM_NAV;
}

/** The footer links for this site */
export function footerLinks(single: boolean = isSingleCompany): NavLink[] {
  return single ? CLIENT_FOOTER : BRIGHTBROOM_FOOTER;
}

export const ADMIN_NAV: (NavLink & { icon: string })[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "house" },
  { label: "Bookings", href: "/admin/bookings", icon: "calendar-blank" },
  { label: "Applications", href: "/admin/applications", icon: "file-text" },
  { label: "Cleaners", href: "/admin/cleaners", icon: "broom" },
  { label: "Users", href: "/admin/users", icon: "user" },
  { label: "Tenants", href: "/admin/tenants", icon: "buildings" },
  { label: "Pricing", href: "/admin/pricing", icon: "money" },
  { label: "Service areas", href: "/admin/service-areas", icon: "map-pin" },
  { label: "Coupons", href: "/admin/coupons", icon: "tag" },
  { label: "Payouts", href: "/admin/payouts", icon: "bank" },
  { label: "Services", href: "/admin/services", icon: "gear" },
  { label: "Reports", href: "/admin/reports", icon: "chart-bar" },
];

/** The links this site shows: none to pages it doesn't serve */
function linksForSite<T extends NavLink>(links: T[], single: boolean): T[] {
  return links.filter((link) => isAvailableOnSite(link.href, single));
}

/** The admin menu for this admin on this site */
export function adminNavFor(isPlatformAdmin: boolean, single: boolean = isSingleCompany) {
  return linksForSite(ADMIN_NAV, single).filter(
    (link) => isPlatformAdmin || !isPlatformOnlyAdminPath(link.href),
  );
}
