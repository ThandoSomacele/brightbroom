// src/routes/api/admin/applications/[id]/profile-image/+server.ts
import { db } from "$lib/server/db";
import { cleanerApplication } from "$lib/server/db/schema";
import { s3 } from "$lib/server/s3"; // Import our S3 utility
import { error, json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { RequestHandler } from "./$types";
import sharp from "sharp";

/**
 * Handle profile image upload for applicants
 */
export const POST: RequestHandler = async ({ request, params }) => {
  const applicationId = params.id;

  if (!applicationId) {
    throw error(400, "Application ID is required");
  }

  try {
    // Parse the multipart form data
    const formData = await request.formData();
    const imageFile = formData.get("profileImage");

    if (!imageFile || !(imageFile instanceof File)) {
      throw error(400, "No image file provided");
    }

    // Check file type
    if (!imageFile.type.startsWith("image/")) {
      throw error(400, "File must be an image");
    }

    // Generate a unique filename
    const filename = `profile-images/applicant-${applicationId}-${nanoid(8)}.jpg`;
    
    // Get the image buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Process the image with sharp (in memory)
    const processedImageBuffer = await sharp(buffer)
      .resize(500, 500, { fit: "cover" })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();
    
    // Upload to S3 instead of local file system
    const fileUrl = await s3.uploadFile(
      processedImageBuffer,
      filename,
      "image/jpeg"
    );

    // Update the applicant profile in the database
    const [application] = await db
      .select()
      .from(cleanerApplication)
      .where(eq(cleanerApplication.id, applicationId))
      .limit(1);

    if (!application) {
      throw error(404, "Application not found");
    }

    // If there's an existing image, delete it from S3
    if (application.profileImageUrl) {
      const existingKey = s3.getKeyFromUrl(application.profileImageUrl);
      if (existingKey) {
        try {
          await s3.deleteFile(existingKey);
        } catch (deleteErr) {
          console.error("Error deleting previous image:", deleteErr);
          // Continue even if delete fails
        }
      }
    }

    // Update application with profile image URL
    await db
      .update(cleanerApplication)
      .set({
        profileImageUrl: fileUrl,
        updatedAt: new Date(),
      })
      .where(eq(cleanerApplication.id, applicationId));

    return json({
      success: true,
      imageUrl: fileUrl,
    });
  } catch (err) {
    console.error("Error uploading applicant profile image:", err);
    throw error(500, {
      message: err instanceof Error ? err.message : "Failed to upload image",
    });
  }
};

/**
 * Delete profile image for applicant
 */
export const DELETE: RequestHandler = async ({ params }) => {
  const applicationId = params.id;

  if (!applicationId) {
    throw error(400, "Application ID is required");
  }

  try {
    // Get the application to find the current image
    const [application] = await db
      .select()
      .from(cleanerApplication)
      .where(eq(cleanerApplication.id, applicationId))
      .limit(1);

    if (!application) {
      throw error(404, "Application not found");
    }

    const currentImageUrl = application.profileImageUrl;

    if (!currentImageUrl) {
      // No image to delete
      return json({ success: true });
    }

    // Extract key from URL and delete from S3
    const key = s3.getKeyFromUrl(currentImageUrl);
    if (key) {
      await s3.deleteFile(key);
    }

    // Update the database to remove the image URL
    await db
      .update(cleanerApplication)
      .set({
        profileImageUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(cleanerApplication.id, applicationId));

    return json({ success: true });
  } catch (err) {
    console.error("Error deleting applicant profile image:", err);
    throw error(500, {
      message: err instanceof Error ? err.message : "Failed to delete image",
    });
  }
};
