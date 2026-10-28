// src/lib/server/legal.ts
//
// Legal documents (Terms, Privacy Policy, Partner Agreement) live as Markdown in
// src/content/legal so they can be reviewed and edited as plain text. Each
// top-level "## " heading becomes a collapsible section on the page.
//
// The documents name the business through placeholders such as
// {{brand.legalName}}, filled from src/lib/config/brand.ts before rendering, so
// each company's deployment shows its own details. "-single" variants are the
// versions for a single company's own site (PUBLIC_PLATFORM_MODE=single).
import { brand, brandDomain } from "$lib/config/brand";
import { Marked } from "marked";
import matter from "gray-matter";
import { error } from "@sveltejs/kit";

export type LegalDocumentSlug =
  | "terms"
  | "privacy"
  | "partner-agreement"
  | "terms-single"
  | "privacy-single"
  | "paia";

export type { LegalDocument, LegalSection } from "$lib/types/legal";
import type { LegalDocument } from "$lib/types/legal";

// A private instance so the magazine's global marked options (line breaks as
// <br>) don't leak into numbered legal paragraphs.
const markdown = new Marked({ gfm: true, breaks: false });

const files = import.meta.glob("/src/content/legal/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function slugify(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/^\d+\.\s*/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Placeholder → value. Values are the deployment's own, never user input. */
const placeholders: Record<string, string> = {
  "brand.name": brand.name,
  "brand.legalName": brand.legalName,
  "brand.registrationNumber": brand.registrationNumber,
  "brand.supportEmail": brand.supportEmail,
  "brand.helpEmail": brand.helpEmail,
  "brand.supportPhone": brand.supportPhone,
  "brand.address": brand.address,
  "brand.informationOfficer": brand.informationOfficer,
  "brand.domain": brandDomain,
};

// The body is rendered with {@html}, so values going into it stay plain text
const escapeText = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Fill {{brand.*}} placeholders; an unknown one is left visible so it gets
 * noticed. `forHtml` escapes the values for Markdown that becomes HTML; the
 * front-matter title and description are plain strings Svelte escapes itself.
 */
export function fillPlaceholders(source: string, forHtml = true): string {
  return source.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key: string) =>
    key in placeholders ? (forHtml ? escapeText(placeholders[key]) : placeholders[key]) : match,
  );
}

function render(source: string): string {
  return markdown.parse(source, { async: false });
}

export function getLegalDocument(slug: LegalDocumentSlug): LegalDocument {
  const raw = files[`/src/content/legal/${slug}.md`];
  if (!raw) throw error(404, "Document not found");

  // Front matter is parsed first, so a brand value with a colon cannot break the YAML
  const { data, content: template } = matter(raw);
  const content = fillPlaceholders(template);
  const parts = content.split(/^## /m);
  const intro = parts.shift() ?? "";

  const sections = parts.map((part) => {
    const newline = part.indexOf("\n");
    const title = (newline === -1 ? part : part.slice(0, newline)).trim();
    const body = newline === -1 ? "" : part.slice(newline + 1);
    return { id: slugify(title), title, html: render(body) };
  });

  return {
    title: fillPlaceholders(String(data.title ?? ""), false),
    lastUpdated: String(data.lastUpdated ?? ""),
    description: fillPlaceholders(String(data.description ?? ""), false),
    introHtml: render(intro),
    sections,
  };
}
