// src/routes/api/admin/cleaners/[id]/profile-image/+server.ts
import { UPLOAD_DIR } from "$lib/server/constants";
import { db } from "$lib/server/db";
import { cleanerProfile } from "$lib/server/db/schema";
import { error, json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import fs from "fs";
import { nanoid } from "nanoid";
import path from "path";
import sharp from "sharp";
import type { RequestHandler } from "./$types";

// Ensure upload directory exists
const ensureUploadDirExists = () => {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const profileImagesDir = path.join(UPLOAD_DIR, "profile-images");
    if (!fs.existsSync(profileImagesDir)) {
      fs.mkdirSync(profileImagesDir, { recursive: true });
    }

    return profileImagesDir;
  } catch (err) {
    console.error("Error creating upload directories:", err);
    throw new Error("Failed to create upload directories");
  }
};

/**
 * Handle profile image upload for cleaners
 */
export const POST: RequestHandler = async ({ request, params }) => {
  const cleanerId = params.id;
  let tempFile = null;

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

    // Ensure upload directory exists
    const uploadDir = ensureUploadDirExists();

    // Generate a unique filename
    const filename = `cleaner-${cleanerId}-${nanoid(8)}.jpg`;
    const filePath = path.join(uploadDir, filename);

    // Create a temporary file path for the original upload
    const tempPath = path.join(uploadDir, `temp-${filename}`);
    tempFile = tempPath;

    // First, save the uploaded file to a temporary location to avoid memory issues
    const arrayBuffer = await imageFile.arrayBuffer();
    await fs.promises.writeFile(tempPath, Buffer.from(arrayBuffer));

    // Process the image with sharp - reading directly from the temp file to avoid memory issues
    await sharp(tempPath)
      .resize(500, 500, { fit: "cover" })
      .jpeg({ quality: 80, progressive: true })
      .toFile(filePath);

    // Calculate public URL for the image
    const fileUrl = `/uploads/profile-images/${filename}`;

    // Debug to see if the cleaner ID is correct
    console.log(`Looking for cleaner profile for user ID: ${cleanerId}`);

    // Check if the cleaner profile exists - FIXED QUERY SYNTAX
    const cleanerProfiles = await db
      .select()
      .from(cleanerProfile)
      .where(eq(cleanerProfile.userId, cleanerId));

    console.log(`Found ${cleanerProfiles.length} matching cleaner profiles`);

    if (cleanerProfiles.length > 0) {
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

    // Clean up the temporary file
    if (fs.existsSync(tempPath)) {
      await fs.promises.unlink(tempPath);
    }

    return json({
      success: true,
      imageUrl: fileUrl,
    });
  } catch (err) {
    // Clean up any temporary file if there was an error
    if (tempFile && fs.existsSync(tempFile)) {
      try {
        await fs.promises.unlink(tempFile);
      } catch (cleanupErr) {
        console.error("Error cleaning up temporary file:", cleanupErr);
      }
    }

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

    // Extract filename from URL
    const filename = path.basename(currentImageUrl);
    const filePath = path.join(UPLOAD_DIR, "profile-images", filename);

    // Check if file exists and delete it
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
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
