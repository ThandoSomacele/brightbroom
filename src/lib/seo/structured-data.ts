// src/lib/seo/structured-data.ts
//
// schema.org JSON-LD for search engines, built from this deployment's brand
// settings. Only real details go in: anything not set is left out rather than
// filled with a placeholder (no invented street, phone number or social links).
import { absoluteSiteUrl, brand, canonicalSiteUrl } from "$lib/config/brand";

export type JsonLd = Record<string, unknown>;

/** Remove empty strings, null/undefined, and objects or arrays left empty */
export function compact(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value.map(compact).filter((v) => v !== undefined);
    return items.length ? items : undefined;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .map(([k, v]) => [k, compact(v)] as const)
      .filter(([, v]) => v !== undefined);
    // An object holding only its @type says nothing
    const meaningful = entries.filter(([k]) => k !== "@type");
    return meaningful.length ? Object.fromEntries(entries) : undefined;
  }
  if (value === null || value === undefined || value === "") return undefined;
  return value;
}

function postalAddress() {
  return { "@type": "PostalAddress", streetAddress: brand.address, addressCountry: brand.address ? "ZA" : "" };
}

/** The business itself, for the About page */
export function organizationJsonLd(): JsonLd {
  return compact({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    legalName: brand.legalName,
    url: canonicalSiteUrl,
    logo: brand.logoUrl ? absoluteSiteUrl(brand.logoUrl) : "",
    email: brand.supportEmail,
    telephone: brand.supportPhone,
    address: postalAddress(),
  }) as JsonLd;
}

/** The business as a local service, for the home and services pages */
export function localBusinessJsonLd(description?: string): JsonLd {
  return compact({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${canonicalSiteUrl}/#business`,
    name: brand.name,
    description: description ?? brand.tagline,
    url: canonicalSiteUrl,
    image: absoluteSiteUrl(brand.ogImageUrl),
    email: brand.supportEmail,
    telephone: brand.supportPhone,
    address: postalAddress(),
  }) as JsonLd;
}

/**
 * brightbroom.com's own product: booking software sold to cleaning companies,
 * with the plan prices as one offer range (ZAR a month).
 */
export function platformJsonLd(description: string): JsonLd {
  return compact({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: brand.name,
    description,
    url: canonicalSiteUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "ZAR",
      lowPrice: "1500",
      highPrice: "4000",
      offerCount: 3,
    },
    publisher: { "@type": "Organization", name: brand.legalName, url: canonicalSiteUrl },
  }) as JsonLd;
}

/** The cleaning service this business offers, for the services page */
export function serviceJsonLd(description: string): JsonLd {
  return compact({
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Professional Cleaning Services",
    serviceType: "Cleaning Service",
    description,
    provider: { "@type": "LocalBusiness", "@id": `${canonicalSiteUrl}/#business`, name: brand.name, url: canonicalSiteUrl },
  }) as JsonLd;
}

/**
 * The <script> element for JSON-LD, to put in the page with {@html}. "<" is
 * escaped so a value containing "</script>" can't end the element early.
 */
export function jsonLdScript(data: JsonLd): string {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}
