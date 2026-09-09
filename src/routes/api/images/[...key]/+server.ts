// src/routes/api/images/[...key]/+server.ts
import { PUBLIC_IMAGE_PREFIX, s3 } from "$lib/server/s3";
import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

/**
 * Serve a cleaner's profile photograph.
 *
 * Everything else in the bucket is reached through /api/documents, which checks
 * who is asking and hands back a URL that expires. Photographs cannot work that
 * way: customers see them before they sign in, and they are embedded in email,
 * where a five-minute URL would be dead on arrival. So they are served here,
 * unauthenticated, and the bucket itself stays private.
 *
 * The caller names a file, never a key. The profile image prefix is added here
 * and cannot be escaped, so this route cannot be turned into a reader for
 * identity documents even if a URL is guessed or tampered with.
 *
 * If we ever decide photographs are biometric information and should not be
 * public, this is the one place that has to change — the stored data does not.
 */

// Upload keys carry a nanoid, so a given key's bytes never change.
const CACHE_CONTROL = "public, max-age=604800, immutable";

export const GET: RequestHandler = async ({ params }) => {
  const name = params.key;

  if (!name || name.includes("..") || name.includes("\\") || name.startsWith("/")) {
    throw error(400, "Bad image reference");
  }

  const object = await s3.getObject(`${PUBLIC_IMAGE_PREFIX}${name}`);
  if (!object) {
    throw error(404, "Image not found");
  }

  // Only ever images live under this prefix, but the content type comes from
  // whatever was uploaded, so pin it to an image type rather than letting the
  // bucket decide what the browser renders.
  const contentType = object.contentType.startsWith("image/")
    ? object.contentType
    : "application/octet-stream";

  return new Response(object.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(object.body.byteLength),
      "Cache-Control": CACHE_CONTROL,
      "X-Content-Type-Options": "nosniff",
    },
  });
};
