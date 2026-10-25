// src/lib/utils/safe-redirect.ts

// Never fetched: only used to resolve a path the way a browser would
const BASE = "http://app.invalid";

/**
 * A redirect target from user input (?redirectTo=, a hidden form field),
 * reduced to a path on this site, or the fallback.
 *
 * A plain startsWith("/") check is not enough: browsers read "//host",
 * "/\host" and "/<tab>/host" as another site. Resolving against a dummy origin
 * catches those (the origin changes), and the resolved path is checked again
 * because dot segments can collapse into one: "/..//host" resolves to the path
 * "//host" on the same origin, which a browser would also follow off-site.
 */
export function safeRedirectPath(value: unknown, fallback = "/profile"): string {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;

  let url: URL;
  try {
    url = new URL(value, BASE);
  } catch {
    return fallback;
  }
  if (url.origin !== BASE || url.pathname.startsWith("//")) return fallback;

  return url.pathname + url.search + url.hash;
}
