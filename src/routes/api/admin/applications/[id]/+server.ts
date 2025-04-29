// src/routes/api/admin/applications/[id]/+server.ts
import { db } from "$lib/server/db";
import { cleanerApplication } from "$lib/server/db/schema";
import { error, json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

/**
 * Update an application
 */
export const PATCH: RequestHandler = async ({ request, params, locals }) => {
  // Ensure admin access
  if (!locals.user || locals.user.role !== "ADMIN") {
    throw error(403, "Unauthorized access");
  }

  const applicationId = params.id;

  if (!applicationId) {
    throw error(400, "Application ID is required");
  }

  try {
    // Get application data from request
    const applicationData = await request.json();

    // Strip invalid fields to prevent security issues
    const allowedFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "city",
      "street",
      "formattedAddress",
      "latitude",
      "longitude",
      "workRadius",
      "experienceTypes",
      "availability",
      "ownTransport",
      "whatsApp",
      "idType",
      "idNumber",
      "bio",
      "petCompatibility",
      "notes",
      "taxNumber",
      "bankAccount",
    ];

    // Create update object with only allowed fields
    const updateData = {};
    for (const field of allowedFields) {
      if (field in applicationData) {
        updateData[field] = applicationData[field];
      }
    }

    // Add updatedAt timestamp
    updateData["updatedAt"] = new Date();

    // Update the application
    const [updatedApplication] = await db
      .update(cleanerApplication)
      .set(updateData)
      .where(eq(cleanerApplication.id, applicationId))
      .returning();

    return json({
      success: true,
      application: updatedApplication,
    });
  } catch (err) {
    console.error(`Error updating application ${applicationId}:`, err);
    throw error(500, {
      message:
        err instanceof Error ? err.message : "Failed to update application",
    });
  }
};
