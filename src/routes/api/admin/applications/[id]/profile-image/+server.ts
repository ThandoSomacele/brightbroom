// src/routes/api/admin/applications/[id]/profile-image/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { cleanerApplication } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
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
 * Handle profile image upload for applicants
 */
export const POST: RequestHandler = async ({ request, params }) => {
  const applicationId = params.id;
  
  if (!applicationId) {
    throw error(400, 'Application ID is required');
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
    const filename = `applicant-${applicationId}-${nanoid(8)}.jpg`;
    
    // Ensure upload directory exists
    const uploadDir = ensureUploadDirExists();
    const filePath = path.join(uploadDir, filename);
    
    // Save the file
    await fs.promises.writeFile(filePath, processedImageBuffer);
    
    // Calculate public URL for the image
    const fileUrl = `${PUBLIC_URL}/uploads/profile-images/${filename}`;
    
    // Update the applicant profile in the database
    const [application] = await db
      .select()
      .from(cleanerApplication)
      .where(eq(cleanerApplication.id, applicationId))
      .limit(1);
    
    if (!application) {
      throw error(404, 'Application not found');
    }
    
    // Update application with profile image URL
    await db
      .update(cleanerApplication)
      .set({
        profileImageUrl: fileUrl,
        updatedAt: new Date()
      })
      .where(eq(cleanerApplication.id, applicationId));
    
    return json({
      success: true,
      imageUrl: fileUrl
    });
  } catch (err) {
    console.error('Error uploading applicant profile image:', err);
    throw error(500, {
      message: err instanceof Error ? err.message : 'Failed to upload image'
    });
  }
};

/**
 * Delete profile image for applicant
 */
export const DELETE: RequestHandler = async ({ params }) => {
  const applicationId = params.id;
  
  if (!applicationId) {
    throw error(400, 'Application ID is required');
  }
  
  try {
    // Get the application to find the current image
    const [application] = await db
      .select()
      .from(cleanerApplication)
      .where(eq(cleanerApplication.id, applicationId))
      .limit(1);
    
    if (!application) {
      throw error(404, 'Application not found');
    }
    
    const currentImageUrl = application.profileImageUrl;
    
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
      .update(cleanerApplication)
      .set({
        profileImageUrl: null,
        updatedAt: new Date()
      })
      .where(eq(cleanerApplication.id, applicationId));
    
    return json({ success: true });
  } catch (err) {
    console.error('Error deleting applicant profile image:', err);
    throw error(500, {
      message: err instanceof Error ? err.message : 'Failed to delete image'
    });
  }
};
