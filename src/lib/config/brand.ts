// src/lib/config/brand.ts
//
// Everything that identifies the business running this site. BrightBroom is
// sold as one deployment per cleaning company, so each deployment sets these
// PUBLIC_* variables; the defaults below are BrightBroom's own, which keeps the
// demo at brightbroom.com unchanged when none are set.
//
// Public on purpose: names, contact details and the mode are shown in the page.
// Never put a secret here.
import { env } from "$env/dynamic/public";

/**
 * "marketplace" = the original BrightBroom: many cleaning companies on one site
 * (company sign-up, vetting, commission split, Cleaning Partner Agreement).
 * "single" = one cleaning company's own site; the marketplace parts are off.
 */
export type PlatformMode = "marketplace" | "single";

const value = (v: string | undefined, fallback: string) =>
  v && v.trim() ? v.trim() : fallback;

const mode: PlatformMode = env.PUBLIC_PLATFORM_MODE === "single" ? "single" : "marketplace";

/**
 * BrightBroom's own details are the defaults ONLY for BrightBroom's own
 * (marketplace) deployments. A company's deployment that forgets a setting
 * shows a blank rather than BrightBroom's name, phone number, address or
 * registration number on its pages and legal documents; the server logs what
 * is missing at startup (see missingBrandSettings).
 */
const own = (fallback: string) => (mode === "single" ? "" : fallback);

export const brand = {
  name: value(env.PUBLIC_BRAND_NAME, own("BrightBroom")),
  legalName: value(env.PUBLIC_BRAND_LEGAL_NAME, own("BrightBroom (Pty) Ltd")),
  registrationNumber: value(env.PUBLIC_BRAND_REG_NUMBER, own("2020/440020/07")),
  tagline: value(env.PUBLIC_BRAND_TAGLINE, own("Cleaner Bookings Made Simple")),
  supportEmail: value(env.PUBLIC_SUPPORT_EMAIL, own("info@brightbroom.com")),
  /**
   * Where customers send problems and complaints. BrightBroom keeps a separate
   * support@ inbox; a deployment that sets only PUBLIC_SUPPORT_EMAIL uses that
   * one address for both.
   */
  helpEmail: value(
    env.PUBLIC_HELP_EMAIL,
    value(env.PUBLIC_SUPPORT_EMAIL, own("support@brightbroom.com")),
  ),
  supportPhone: value(env.PUBLIC_SUPPORT_PHONE, own("072 225 1491")),
  /** When the support line is answered, shown on the contact page; optional */
  supportHours: value(env.PUBLIC_SUPPORT_HOURS, own("Monday–Friday: 8am – 6pm")),
  address: value(env.PUBLIC_BRAND_ADDRESS, own("0B Cedar Avenue West, Fourways, Randburg, 2191")),
  informationOfficer: value(env.PUBLIC_INFORMATION_OFFICER, own("Thando Somacele")),
  /** Absolute or site-relative URL of the logo image; empty = show the name as text */
  logoUrl: value(env.PUBLIC_BRAND_LOGO_URL, ""),
  /**
   * VAT registration number. Set it only when the business is VAT-registered:
   * prices are then described as including VAT and receipts show the VAT in
   * them. Empty (BrightBroom is not registered) means no VAT is mentioned.
   */
  vatNumber: value(env.PUBLIC_VAT_NUMBER, ""),
  /** Image shown when a page is shared (Open Graph); absolute or site-relative */
  ogImageUrl: value(env.PUBLIC_BRAND_OG_IMAGE, own("/images/brightbroom-og-image.jpg")),
  /** Public site URL without a trailing slash */
  siteUrl: value(env.PUBLIC_URL, own("https://brightbroom.com")).replace(/\/$/, ""),
  mode,
  /**
   * Google Tag Manager container. BrightBroom's own deploys keep its container;
   * a company's deployment (PUBLIC_BRAND_NAME set) loads none unless it sets
   * PUBLIC_GTM_ID, so its visitors are never tracked into BrightBroom's account.
   */
  gtmId: value(env.PUBLIC_GTM_ID, env.PUBLIC_BRAND_NAME?.trim() || mode === "single" ? "" : "GTM-WSXMSVZT"),
};

/** True on a single cleaning company's own deployment */
export const isSingleCompany = brand.mode === "single";

/**
 * brightbroom.com as a sales demo (PUBLIC_DEMO_MODE=true): the booking flow
 * works end to end on PayFast's sandbox, and every page says it is a demo.
 * Never on a company's own site.
 */
export const isDemoSite = env.PUBLIC_DEMO_MODE === "true" && !isSingleCompany;

/**
 * The address shown to people and search engines (canonical links, og:url,
 * the domain printed on pages and legal documents). BrightBroom's own deploys
 * always say brightbroom.com, even a preview whose PUBLIC_URL is a Netlify
 * address; a company's deployment (PUBLIC_BRAND_NAME set) uses its PUBLIC_URL.
 */
export const canonicalSiteUrl = env.PUBLIC_BRAND_NAME?.trim() || mode === "single"
  ? brand.siteUrl
  : "https://brightbroom.com";

/** The site's host name, e.g. "brightbroom.com" */
export const brandDomain = canonicalSiteUrl.replace(/^https?:\/\//, "");

/** An absolute URL on this site for a path ("/images/x.jpg"); absolute URLs pass through */
export function absoluteSiteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${canonicalSiteUrl}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/**
 * A wa.me link for a South African number written as people write it
 * ("072 225 1491" or "+27 72 225 1491"). Empty when there is no number.
 */
export function whatsappHref(phone: string = brand.supportPhone, text?: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  const international = digits.startsWith("0") ? `27${digits.slice(1)}` : digits;
  return `https://wa.me/${international}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/**
 * Settings a company's deployment must set (single mode). Empty in marketplace
 * mode, where BrightBroom's own details are the defaults.
 */
export function missingBrandSettings(): string[] {
  if (mode !== "single") return [];
  const required: Record<string, string> = {
    PUBLIC_BRAND_NAME: brand.name,
    PUBLIC_BRAND_LEGAL_NAME: brand.legalName,
    PUBLIC_SUPPORT_EMAIL: brand.supportEmail,
    PUBLIC_SUPPORT_PHONE: brand.supportPhone,
    PUBLIC_BRAND_ADDRESS: brand.address,
    PUBLIC_INFORMATION_OFFICER: brand.informationOfficer,
    PUBLIC_URL: brand.siteUrl,
  };
  return Object.entries(required)
    .filter(([, v]) => !v)
    .map(([k]) => k);
}

