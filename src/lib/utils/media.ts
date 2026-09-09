// src/lib/utils/media.ts

// Kept in step with PUBLIC_IMAGE_PREFIX in $lib/server/s3.ts. Duplicated rather
// than imported because this runs in the browser too, and importing from
// $lib/server would pull the S3 client into the client bundle.
const PUBLIC_IMAGE_PREFIX = "profile-images/";

/**
 * Turn a stored profile image URL into one that still works once the bucket is
 * private.
 *
 * Uploads record where the object lives — an S3 URL — but the bucket blocks
 * public access, so that URL is a reference, not something a browser can load.
 * This rewrites it to /api/images, which serves the bytes.
 *
 * Anything that is not one of our profile images is returned untouched, so
 * local paths like /images/default-avatar.svg and any already-rewritten URL
 * pass straight through and this is safe to apply more than once.
 */
export function imageUrl(stored: string | null | undefined): string | null {
  if (!stored) return null;

  // Local paths and already-rewritten URLs
  if (!/^https?:\/\//i.test(stored)) return stored;

  try {
    const path = decodeURIComponent(new URL(stored).pathname);
    const at = path.indexOf(PUBLIC_IMAGE_PREFIX);
    if (at === -1) return stored;

    // Hand on only the filename. /api/images puts the prefix back itself, so a
    // caller can never name an object outside the public image prefix.
    return `/api/images/${path.slice(at + PUBLIC_IMAGE_PREFIX.length)}`;
  } catch {
    return stored;
  }
}

/**
 * The same thing, absolute, for email — where a relative URL has nothing to
 * resolve against.
 */
export function absoluteImageUrl(
  stored: string | null | undefined,
  baseUrl: string,
): string | null {
  const relative = imageUrl(stored);
  if (!relative) return null;
  if (/^https?:\/\//i.test(relative)) return relative;

  return `${baseUrl.replace(/\/+$/, "")}${relative}`;
}
