// src/routes/api/admin/applications/[id]/+server.ts
import { db } from "$lib/server/db";
import { cleanerApplication } from "$lib/server/db/schema";
import { error, json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";
import { requireAdmin } from "$lib/server/route-guards";

type ApplicationUpdate = Partial<typeof cleanerApplication.$inferInsert>;

/**
 * Update an application
 */
export const PATCH: RequestHandler = async ({ request, params, locals }) => {
  requireAdmin(locals, { platformOnly: true });
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
      "formattedAddress",
      "latitude",
      "longitude",
      "workRadius",
      "availability",
      "ownTransport",
      "whatsApp",
      "idType",
      "idNumber",
      "bio",
      "petCompatibility",
      "notes",
      "taxNumber",
    ] as const satisfies readonly (keyof ApplicationUpdate)[];

    // Create update object with only allowed fields
    const updateData: ApplicationUpdate = Object.fromEntries(
      allowedFields
        .filter((field) => field in applicationData)
        .map((field) => [field, applicationData[field]]),
    );

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

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
    console.error('Error updating application:', { applicationId, error: err });
    throw error(500, {
      message:
        err instanceof Error ? err.message : "Failed to update application",
    });
  }
};
