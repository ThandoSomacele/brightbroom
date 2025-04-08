// src/routes/api/admin/cleaners/[id]/profile-image/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { cleaner_profile } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import sharp from 'sharp';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';
import { PUBLIC_URL } from '$env/static/public';
import { UPLOAD_DIR } from '$lib/server/constants';

// Ensure upload directory exists
const ensureUploadDirExists = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  
  const profileImagesDir = path.join(UPLOAD_DIR, 'profile-images');
  if (!fs.existsSync(profileImagesDir)) {
    fs.mkdirSync(profileImagesDir, { recursive: true });
  }
  
  return profileImagesDir;
};

/**
 * Handle profile image upload for cleaners
 */
export const POST: RequestHandler = async ({ request, params }) => {
  const cleanerId = params.id;
  
  if (!cleanerId) {
    throw error(400, 'Cleaner ID is required');
  }
  
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    const imageFile = formData.get('profileImage');
    
    if (!imageFile || !(imageFile instanceof File)) {
      throw error(400, 'No image file provided');
    }
    
    // Check file type
    if (!imageFile.type.startsWith('image/')) {
      throw error(400, 'File must be an image');
    }
    
    // Read the file as buffer
    const fileBuffer = await imageFile.arrayBuffer();
    
    // Process the image with sharp for optimization
    const processedImageBuffer = await sharp(Buffer.from(fileBuffer))
      .resize(500, 500, { fit: 'cover' }) // Resize to standard dimensions
      .jpeg({ quality: 80, progressive: true }) // Convert to JPEG with 80% quality
      .toBuffer();
    
    // Generate a unique filename
    const filename = `${cleanerId}-${nanoid(8)}.jpg`;
    
    // Ensure upload directory exists
    const uploadDir = ensureUploadDirExists();
    const filePath = path.join(uploadDir, filename);
    
    // Save the file
    await fs.promises.writeFile(filePath, processedImageBuffer);
    
    // Calculate public URL for the image
    const fileUrl = `${PUBLIC_URL}/uploads/profile-images/${filename}`;
    
    // Update the cleaner profile in the database
    // First check if the cleaner profile exists
    const [cleanerProfile] = await db
      .select()
      .from(cleaner_profile)
      .where(eq(cleaner_profile.userId, cleanerId))
      .limit(1);
    
    if (cleanerProfile) {
      // Update existing profile
      await db
        .update(cleaner_profile)
        .set({
          profileImageUrl: fileUrl,
          updatedAt: new Date()
        })
        .where(eq(cleaner_profile.userId, cleanerId));
    } else {
      // Error if profile doesn't exist - should be created separately
      throw error(404, 'Cleaner profile not found');
    }
    
    return json({
      success: true,
      imageUrl: fileUrl
    });
  } catch (err) {
    console.error('Error uploading profile image:', err);
    throw error(500, {
      message: err instanceof Error ? err.message : 'Failed to upload image'
    });
  }
};

/**
 * Delete profile image for cleaner
 */
export const DELETE: RequestHandler = async ({ params }) => {
  const cleanerId = params.id;
  
  if (!cleanerId) {
    throw error(400, 'Cleaner ID is required');
  }
  
  try {
    // Get the cleaner profile to find the current image
    const [cleanerProfile] = await db
      .select()
      .from(cleaner_profile)
      .where(eq(cleaner_profile.userId, cleanerId))
      .limit(1);
    
    if (!cleanerProfile) {
      throw error(404, 'Cleaner profile not found');
    }
    
    const currentImageUrl = cleanerProfile.profileImageUrl;
    
    if (!currentImageUrl) {
      // No image to delete
      return json({ success: true });
    }
    
    // Extract filename from URL
    const filename = path.basename(currentImageUrl);
    const filePath = path.join(UPLOAD_DIR, 'profile-images', filename);
    
    // Check if file exists and delete it
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
    
    // Update the database to remove the image URL
    await db
      .update(cleaner_profile)
      .set({
        profileImageUrl: null,
        updatedAt: new Date()
      })
      .where(eq(cleaner_profile.userId, cleanerId));
    
    return json({ success: true });
  } catch (err) {
    console.error('Error deleting profile image:', err);
    throw error(500, {
      message: err instanceof Error ? err.message : 'Failed to delete image'
    });
  }
};
