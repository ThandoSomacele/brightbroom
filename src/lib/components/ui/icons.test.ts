// Every Phosphor icon name used in the app must exist in the duotone font,
// otherwise it renders as an empty box with no error anywhere.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "node_modules/@phosphor-icons/web/src/duotone/style.css"), "utf8");
const known = new Set([...css.matchAll(/\.ph-duotone\.ph-([a-z0-9-]+):before/g)].map((m) => m[1]));

function svelteFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return svelteFiles(path);
    return path.endsWith(".svelte") ? [path] : [];
  });
}

const used = new Map<string, string>();
for (const file of svelteFiles(join(process.cwd(), "src"))) {
  const source = readFileSync(file, "utf8");
  for (const m of source.matchAll(/<Icon[^>]*?\bname="([a-z0-9-]+)"/g)) used.set(m[1], file);
  for (const m of source.matchAll(/\bicon(?:\s*:\s*|=)"([a-z0-9-]+)"/g)) used.set(m[1], file);
}

describe("Phosphor icon names", () => {
  it("finds the font and the icons in use", () => {
    expect(known.size).toBeGreaterThan(1000);
    expect(used.size).toBeGreaterThan(30);
  });

  it.each([...used.entries()])("%s exists (used in %s)", (name) => {
    expect(known.has(name)).toBe(true);
  });
});
