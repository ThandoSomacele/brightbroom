// src/lib/server/legal.test.ts
import { describe, expect, it } from "vitest";
import { brand } from "$lib/config/brand";
import { fillPlaceholders, getLegalDocument, type LegalDocumentSlug } from "./legal";

const SLUGS: LegalDocumentSlug[] = ["terms", "privacy", "partner-agreement", "terms-single", "privacy-single", "paia"];

describe("legal documents", () => {
  it("fills brand placeholders and leaves unknown ones visible", () => {
    expect(fillPlaceholders("{{brand.name}} / {{ brand.legalName }} / {{brand.nope}}")).toBe(
      `${brand.name} / ${brand.legalName} / {{brand.nope}}`,
    );
  });

  it.each(SLUGS)("%s renders with every placeholder filled", (slug) => {
    const doc = getLegalDocument(slug);
    const text = [doc.title, doc.description, doc.introHtml, ...doc.sections.map((s) => s.title + s.html)].join("\n");
    expect(doc.sections.length).toBeGreaterThan(5);
    expect(text).not.toContain("{{");
    expect(text).toContain(brand.name);
  });
});
