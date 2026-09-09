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

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || "",
  },
});

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
      return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
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
   * Extract the S3 key from a full URL.
   *
   * Parsed rather than pattern-matched: this decides which object we hand to a
   * signed URL, so a regex that happened to match the wrong part of a URL would
   * be a security bug rather than a broken link. Handles both virtual-hosted
   * (bucket.s3.region.amazonaws.com/key) and path-style
   * (s3.region.amazonaws.com/bucket/key) URLs.
   */
  getKeyFromUrl(url: string): string | null {
    if (!url) return null;

    try {
      const parsed = new URL(url);
      if (!parsed.hostname.endsWith(".amazonaws.com")) return null;

      const path = decodeURIComponent(parsed.pathname).replace(/^\/+/, "");
      if (!path) return null;

      if (parsed.hostname.startsWith(`${BUCKET_NAME}.`)) {
        return path;
      }
      if (path.startsWith(`${BUCKET_NAME}/`)) {
        return path.slice(BUCKET_NAME.length + 1) || null;
      }
      return null;
    } catch {
      return null;
    }
  },
};
