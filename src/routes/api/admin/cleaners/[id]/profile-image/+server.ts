// src/routes/api/admin/cleaners/[id]/profile-image/+server.ts
import { db } from "$lib/server/db";
import { cleanerProfile } from "$lib/server/db/schema";
import { s3 } from "$lib/server/s3"; // Import our S3 utility
import { error, json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { RequestHandler } from "./$types";
import sharp from "sharp";

/**
 * Handle profile image upload for cleaners
 */
export const POST: RequestHandler = async ({ request, params }) => {
  const cleanerId = params.id;

  if (!cleanerId) {
    throw error(400, "Cleaner ID is required");
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
    const filename = `profile-images/cleaner-${cleanerId}-${nanoid(8)}.jpg`;
    
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

    // Check if the cleaner profile exists
    const cleanerProfiles = await db
      .select()
      .from(cleanerProfile)
      .where(eq(cleanerProfile.userId, cleanerId));

    if (cleanerProfiles.length > 0) {
      // If there's an existing image, delete it from S3
      const existingImageUrl = cleanerProfiles[0].profileImageUrl;
      if (existingImageUrl) {
        const existingKey = s3.getKeyFromUrl(existingImageUrl);
        if (existingKey) {
          try {
            await s3.deleteFile(existingKey);
          } catch (deleteErr) {
            console.error("Error deleting previous image:", deleteErr);
            // Continue even if delete fails
          }
        }
      }

      // Update existing profile
      await db
        .update(cleanerProfile)
        .set({
          profileImageUrl: fileUrl,
          updatedAt: new Date(),
        })
        .where(eq(cleanerProfile.userId, cleanerId));
    } else {
      // Error if profile doesn't exist - should be created separately
      throw error(404, "Cleaner profile not found");
    }

    return json({
      success: true,
      imageUrl: fileUrl,
    });
  } catch (err) {
    console.error("Error uploading profile image:", err);
    throw error(500, {
      message: err instanceof Error ? err.message : "Failed to upload image",
    });
  }
};

/**
 * Delete profile image for cleaner
 */
export const DELETE: RequestHandler = async ({ params }) => {
  const cleanerId = params.id;

  if (!cleanerId) {
    throw error(400, "Cleaner ID is required");
  }

  try {
    // Get the cleaner profile to find the current image
    const [cleanerProfileData] = await db
      .select()
      .from(cleanerProfile)
      .where(eq(cleanerProfile.userId, cleanerId))
      .limit(1);

    if (!cleanerProfileData) {
      throw error(404, "Cleaner profile not found");
    }

    const currentImageUrl = cleanerProfileData.profileImageUrl;

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
      .update(cleanerProfile)
      .set({
        profileImageUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(cleanerProfile.userId, cleanerId));

    return json({ success: true });
  } catch (err) {
    console.error("Error deleting profile image:", err);
    throw error(500, {
      message: err instanceof Error ? err.message : "Failed to delete image",
    });
  }
};
