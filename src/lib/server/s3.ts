// src/lib/server/s3.ts
import type { PutObjectCommandInput } from "@aws-sdk/client-s3";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// One region, used both to reach the bucket and to build the URLs we store.
// These used to be two separate fallbacks: with AWS_S3_REGION unset we uploaded
// to Ireland and wrote a Cape Town URL, which meant broken document links and
// identity documents leaving the country without anyone deciding that they
// should. Cape Town is the default because that is where this data belongs.
export const REGION = process.env.AWS_S3_REGION || "af-south-1";

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "brightbroom-upload";

// The bucket is private. Identity documents, permits and bank letters are
// reached through /api/documents, which checks entitlement and mints a URL that
// expires. Profile photographs are the one exception: customers see them before
// they sign in and they are embedded in email, so a URL that expires would
// break both. They live under this prefix and are served by /api/images.
export const PUBLIC_IMAGE_PREFIX = "profile-images/";

// Optional S3-compatible storage (MinIO, Wasabi, Cloudflare R2, ...) for
// self-hosted deployments. Unset = AWS S3, exactly as before.
//   S3_ENDPOINT          e.g. https://minio.example.co.za
//   S3_FORCE_PATH_STYLE  "true" to address objects as endpoint/bucket/key
const ENDPOINT = normaliseEndpoint(process.env.S3_ENDPOINT);
const FORCE_PATH_STYLE = process.env.S3_FORCE_PATH_STYLE === "true";

/** Trimmed, without trailing slashes; undefined when unset or blank */
function normaliseEndpoint(value: string | undefined): string | undefined {
  const trimmed = value?.trim().replace(/\/+$/, "");
  return trimmed ? trimmed : undefined;
}

export type StorageConfig = {
  bucket: string;
  region: string;
  /** S3-compatible endpoint; undefined means AWS */
  endpoint?: string;
  forcePathStyle: boolean;
};

const config: StorageConfig = {
  bucket: BUCKET_NAME,
  region: REGION,
  endpoint: ENDPOINT,
  forcePathStyle: FORCE_PATH_STYLE,
};

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || "",
  },
  // Only passed when set, so the AWS client is built exactly as before.
  ...(ENDPOINT ? { endpoint: ENDPOINT, forcePathStyle: FORCE_PATH_STYLE } : {}),
});

/**
 * The URL we store as the record of where an object lives.
 *
 * AWS (no endpoint): https://<bucket>.s3.<region>.amazonaws.com/<key> — the
 * format every existing row uses, unchanged.
 * Custom endpoint, path-style: <endpoint>/<bucket>/<key>
 * Custom endpoint, virtual-hosted: <scheme>://<bucket>.<endpoint host>/<key>
 */
export function buildObjectUrl(cfg: StorageConfig, key: string): string {
  if (!cfg.endpoint) {
    return `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com/${key}`;
  }
  if (cfg.forcePathStyle) {
    return `${cfg.endpoint}/${cfg.bucket}/${key}`;
  }
  const endpoint = new URL(cfg.endpoint);
  const basePath = endpoint.pathname.replace(/\/+$/, "");
  return `${endpoint.protocol}//${cfg.bucket}.${endpoint.host}${basePath}/${key}`;
}

/**
 * Extract the object key from a stored URL, or null if the URL is not one of
 * ours.
 *
 * Parsed rather than pattern-matched: this decides which object we hand to a
 * signed URL, so a regex that happened to match the wrong part of a URL would
 * be a security bug rather than a broken link. Always understands AWS URLs —
 * virtual-hosted (bucket.s3.region.amazonaws.com/key) and path-style
 * (s3.region.amazonaws.com/bucket/key) — so rows written before a move to a
 * custom endpoint still resolve. With an endpoint configured it also
 * understands <endpoint>/<bucket>/<key> and <bucket>.<endpoint host>/<key>,
 * but only on the endpoint's own host.
 */
export function parseKeyFromUrl(cfg: StorageConfig, url: string): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const path = decodeURIComponent(parsed.pathname).replace(/^\/+/, "");

    if (parsed.hostname.endsWith(".amazonaws.com")) {
      if (!path) return null;
      if (parsed.hostname.startsWith(`${cfg.bucket}.`)) {
        return path;
      }
      if (path.startsWith(`${cfg.bucket}/`)) {
        return path.slice(cfg.bucket.length + 1) || null;
      }
      return null;
    }

    if (!cfg.endpoint) return null;
    const endpoint = new URL(cfg.endpoint);
    // The endpoint may itself sit under a path (e.g. a reverse proxy prefix)
    const basePath = decodeURIComponent(endpoint.pathname).replace(/^\/+|\/+$/g, "");
    let rest = path;
    if (basePath) {
      if (!rest.startsWith(`${basePath}/`)) return null;
      rest = rest.slice(basePath.length + 1);
    }

    if (parsed.host === endpoint.host) {
      // Path-style: <endpoint>/<bucket>/<key>
      if (!rest.startsWith(`${cfg.bucket}/`)) return null;
      return rest.slice(cfg.bucket.length + 1) || null;
    }
    if (parsed.host === `${cfg.bucket}.${endpoint.host}`) {
      // Virtual-hosted: <bucket>.<endpoint host>/<key>
      return rest || null;
    }
    return null;
  } catch {
    return null;
  }
}

export const s3 = {
  /**
   * Upload a file to the bucket and return the canonical object URL.
   *
   * The returned URL is a record of where the object lives, not a way to read
   * it — the bucket blocks public access. Read it back through /api/documents
   * or /api/images.
   */
  async uploadFile(
    file: Buffer,
    key: string,
    contentType: string,
  ): Promise<string> {
    const params: PutObjectCommandInput = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      // No ACL: the bucket has ACLs disabled and public access blocked.
    };

    try {
      await s3Client.send(new PutObjectCommand(params));
      return buildObjectUrl(config, key);
    } catch (error) {
      console.error("S3 upload error:", error);
      throw new Error("Failed to upload file to S3");
    }
  },

  /**
   * Delete a file from the bucket
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await s3Client.send(
        new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }),
      );
    } catch (error) {
      console.error("S3 delete error:", error);
      throw new Error("Failed to delete file from S3");
    }
  },

  /**
   * Get a pre-signed URL for downloading a private file
   */
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
  },

  /**
   * Read an object's bytes, for the routes that serve a file themselves rather
   * than redirecting to a signed URL. Returns null when the object is missing,
   * so callers can answer 404 rather than 500.
   */
  async getObject(
    key: string,
  ): Promise<{ body: Uint8Array; contentType: string } | null> {
    try {
      const result = await s3Client.send(
        new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }),
      );
      if (!result.Body) return null;

      return {
        body: await result.Body.transformToByteArray(),
        contentType: result.ContentType || "application/octet-stream",
      };
    } catch (error) {
      console.error(`S3 read error for ${key}:`, error);
      return null;
    }
  },

  /**
   * Extract the S3 key from a full stored URL; see parseKeyFromUrl.
   */
  getKeyFromUrl(url: string): string | null {
    return parseKeyFromUrl(config, url);
  },
};
