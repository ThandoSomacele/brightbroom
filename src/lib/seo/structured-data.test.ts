// src/lib/seo/structured-data.test.ts
import { describe, expect, it } from "vitest";
import { compact, jsonLdScript, localBusinessJsonLd, organizationJsonLd } from "./structured-data";

describe("compact", () => {
  it("leaves out empty values instead of publishing placeholders", () => {
    expect(
      compact({ name: "Sparkle", telephone: "", logo: null, address: { "@type": "PostalAddress", streetAddress: "" } }),
    ).toEqual({ name: "Sparkle" });
  });

  it("keeps real nested values and drops empty arrays", () => {
    expect(compact({ address: { "@type": "PostalAddress", streetAddress: "1 Main Rd" }, sameAs: [] })).toEqual({
      address: { "@type": "PostalAddress", streetAddress: "1 Main Rd" },
    });
  });
});

describe("jsonLdScript", () => {
  it("cannot be broken out of with a closing script tag", () => {
    const html = jsonLdScript({ name: "</script><script>alert(1)</script>" });
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    expect(html).toContain("\\u003c/script>");
    expect(JSON.parse(html.replace(/^<script[^>]*>|<\/script>$/g, ""))).toEqual({
      name: "</script><script>alert(1)</script>",
    });
  });
});

describe("brand JSON-LD", () => {
  it("describes this deployment, with no invented details", () => {
    const business = localBusinessJsonLd();
    expect(business["@type"]).toBe("LocalBusiness");
    expect(JSON.stringify(business)).not.toMatch(/123 Main Street|11-123-4567/);
    expect(organizationJsonLd()["@type"]).toBe("Organization");
  });
});
