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
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    
    const profileImagesDir = path.join(UPLOAD_DIR, 'profile-images');
    if (!fs.existsSync(profileImagesDir)) {
      fs.mkdirSync(profileImagesDir, { recursive: true });
    }
    
    return profileImagesDir;
  } catch (err) {
    console.error('Error creating upload directories:', err);
    throw new Error('Failed to create upload directories');
  }
};

/**
 * Handle profile image upload for applicants
 */
export const POST: RequestHandler = async ({ request, params }) => {
  const applicationId = params.id;
  let tempFile = null;
  
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
    
    // Ensure upload directory exists
    const uploadDir = ensureUploadDirExists();
    
    // Generate a unique filename
    const filename = `applicant-${applicationId}-${nanoid(8)}.jpg`;
    const filePath = path.join(uploadDir, filename);
    
    // Create a temporary file path for the original upload
    const tempPath = path.join(uploadDir, `temp-${filename}`);
    tempFile = tempPath;
    
    // First, save the uploaded file to a temporary location to avoid memory issues
    const arrayBuffer = await imageFile.arrayBuffer();
    await fs.promises.writeFile(tempPath, Buffer.from(arrayBuffer));
    
    // Process the image with sharp - reading directly from the temp file to avoid memory issues
    await sharp(tempPath)
      .resize(500, 500, { fit: 'cover' })
      .jpeg({ quality: 80, progressive: true })
      .toFile(filePath);
    
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
    
    // Clean up the temporary file
    if (fs.existsSync(tempPath)) {
      await fs.promises.unlink(tempPath);
    }
    
    return json({
      success: true,
      imageUrl: fileUrl
    });
  } catch (err) {
    // Clean up any temporary file if there was an error
    if (tempFile && fs.existsSync(tempFile)) {
      try {
        await fs.promises.unlink(tempFile);
      } catch (cleanupErr) {
        console.error('Error cleaning up temporary file:', cleanupErr);
      }
    }
    
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
