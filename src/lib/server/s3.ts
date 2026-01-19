// src/lib/server/s3.ts
import type { PutObjectCommandInput } from "@aws-sdk/client-s3";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialise S3 client - load credentials from environment variables
const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || "",
  },
});

// Use environment variable for bucket name
const BUCKET_NAME = process.env.S3_BUCKET_NAME || "brightbroom-upload";

export const s3 = {
  /**
   * Upload a file to S3 bucket
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
      // Removed ACL: "public-read" as bucket doesn't support ACLs
      // Access should be controlled via bucket policy instead
    };

    // Get region from config or environment
    const region = process.env.AWS_S3_REGION || "af-south-1";

    try {
      const command = new PutObjectCommand(params);
      await s3Client.send(command);

      // Return the public URL with region in the domain
      return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
    } catch (error) {
      console.error("S3 upload error:", error);
      throw new Error("Failed to upload file to S3");
    }
  },

  /**
   * Delete a file from S3 bucket
   */
  async deleteFile(key: string): Promise<void> {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    try {
      const command = new DeleteObjectCommand(params);
      await s3Client.send(command);
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
   * Extract the S3 key from a full URL
   */
  getKeyFromUrl(url: string): string | null {
    if (!url) return null;

    try {
      // Match the key pattern after the bucket name in the URL
      const match = url.match(
        new RegExp(`${BUCKET_NAME}.s3.[a-z0-9-]+.amazonaws.com/(.+)`),
      );
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  },
};
