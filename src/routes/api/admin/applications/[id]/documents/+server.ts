// src/routes/api/admin/applications/[id]/documents/+server.ts
import { db } from "$lib/server/db";
import { cleanerApplication } from "$lib/server/db/schema";
import { s3 } from "$lib/server/s3";
import { error, json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { RequestHandler } from "./$types";
import mime from "mime-types";

/**
 * Handle document upload for cleaner applications
 */
export const POST: RequestHandler = async ({ request, params }) => {
  const applicationId = params.id;

  if (!applicationId) {
    throw error(400, "Application ID is required");
  }

  try {
    // Parse the multipart form data
    const formData = await request.formData();
    const documentFile = formData.get("document");

    if (!documentFile || !(documentFile instanceof File)) {
      throw error(400, "No document file provided");
    }

    // Determine content type
    const contentType = documentFile.type || 
      mime.lookup(documentFile.name) || 
      'application/octet-stream';

    // Get file extension
    const extension = mime.extension(contentType) || 
      documentFile.name.split('.').pop() || 
      'bin';
    
    // Generate a unique filename
    const filename = `documents/application-${applicationId}-${nanoid(8)}.${extension}`;
    
    // Get the file buffer
    const arrayBuffer = await documentFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload to S3
    const documentUrl = await s3.uploadFile(
      buffer,
      filename,
      contentType
    );

    // Get the current application
    const [application] = await db
      .select()
      .from(cleanerApplication)
      .where(eq(cleanerApplication.id, applicationId))
      .limit(1);

    if (!application) {
      throw error(404, "Application not found");
    }

    // Update application with new document
    const currentDocuments = application.documents || [];
    
    await db
      .update(cleanerApplication)
      .set({
        documents: [...currentDocuments, documentUrl],
        updatedAt: new Date(),
      })
      .where(eq(cleanerApplication.id, applicationId));

    return json({
      success: true,
      documentUrl,
    });
  } catch (err) {
    console.error("Error uploading document:", err);
    throw error(500, {
      message: err instanceof Error ? err.message : "Failed to upload document",
    });
  }
};
