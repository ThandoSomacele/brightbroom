// src/lib/server/legal.ts
//
// Legal documents (Terms, Privacy Policy, Partner Agreement) live as Markdown in
// src/content/legal so they can be reviewed and edited as plain text. Each
// top-level "## " heading becomes a collapsible section on the page.
import { Marked } from "marked";
import matter from "gray-matter";
import { error } from "@sveltejs/kit";

export type LegalDocumentSlug = "terms" | "privacy" | "partner-agreement";

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

function render(source: string): string {
  return markdown.parse(source, { async: false });
}

export function getLegalDocument(slug: LegalDocumentSlug): LegalDocument {
  const raw = files[`/src/content/legal/${slug}.md`];
  if (!raw) throw error(404, "Document not found");

  const { data, content } = matter(raw);
  const parts = content.split(/^## /m);
  const intro = parts.shift() ?? "";

  const sections = parts.map((part) => {
    const newline = part.indexOf("\n");
    const title = (newline === -1 ? part : part.slice(0, newline)).trim();
    const body = newline === -1 ? "" : part.slice(newline + 1);
    return { id: slugify(title), title, html: render(body) };
  });

  return {
    title: String(data.title ?? ""),
    lastUpdated: String(data.lastUpdated ?? ""),
    description: String(data.description ?? ""),
    introHtml: render(intro),
    sections,
  };
}
