// src/routes/api/admin/applications/[id]/documents/[key]/+server.ts
import { db } from "$lib/server/db";
import { cleanerApplication } from "$lib/server/db/schema";
import { s3 } from "$lib/server/s3";
import { error, json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

/**
 * Handle document deletion
 */
export const DELETE: RequestHandler = async ({ params }) => {
  const { id: applicationId, key: documentKey } = params;

  if (!applicationId || !documentKey) {
    throw error(400, "Application ID and document key are required");
  }

  try {
    // Get the application
    const [application] = await db
      .select()
      .from(cleanerApplication)
      .where(eq(cleanerApplication.id, applicationId))
      .limit(1);

    if (!application) {
      throw error(404, "Application not found");
    }

    // Find the document URL
    const documentUrl = application.documents?.find(
      url => url.includes(documentKey)
    );

    if (!documentUrl) {
      throw error(404, "Document not found");
    }

    // Delete from S3
    const key = s3.getKeyFromUrl(documentUrl);
    if (key) {
      await s3.deleteFile(key);
    }

    // Update application documents list
    const updatedDocuments = application.documents?.filter(
      url => url !== documentUrl
    ) || [];

    await db
      .update(cleanerApplication)
      .set({
        documents: updatedDocuments,
        updatedAt: new Date(),
      })
      .where(eq(cleanerApplication.id, applicationId));

    return json({ success: true });
  } catch (err) {
    console.error("Error deleting document:", err);
    throw error(500, {
      message: err instanceof Error ? err.message : "Failed to delete document",
    });
  }
};
