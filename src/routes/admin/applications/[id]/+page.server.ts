// src/routes/admin/applications/[id]/+page.server.ts
import { serviceAreaService } from "$lib/server/services/service-area.service";
import { db } from "$lib/server/db";
import {
  applicationNote,
  cleanerApplication,
  idTypeEnum,
  petCompatibilityEnum,
} from "$lib/server/db/schema";
import { error, fail } from "@sveltejs/kit";
import { and, desc, eq } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";
import { adminTenantScope, requireAdmin } from "$lib/server/route-guards";
import { getScopedApplication } from "$lib/server/admin-scope";

type IdType = (typeof idTypeEnum.enumValues)[number];
type PetCompatibility = (typeof petCompatibilityEnum.enumValues)[number];

// The application stores these as free text; the profile columns are enums.
function toIdType(value: string | null): IdType {
  return idTypeEnum.enumValues.find((v) => v === value) ?? "SOUTH_AFRICAN_ID";
}

function toPetCompatibility(value: string | null): PetCompatibility {
  return petCompatibilityEnum.enumValues.find((v) => v === value) ?? "NONE";
}

// Helper function to fetch application data
async function getApplicationData(applicationId: string, tenantId: string | null) {
  // Fetch the application details with tenant scoping
  const conditions = [eq(cleanerApplication.id, applicationId)];
  if (tenantId) {
    conditions.push(eq(cleanerApplication.tenantId, tenantId));
  }

  const [application] = await db
    .select()
    .from(cleanerApplication)
    .where(and(...conditions))
    .limit(1);

  if (!application) {
    throw error(404, "Application not found");
  }

  // Fetch notes for this application
  const notes = await db
    .select()
    .from(applicationNote)
    .where(eq(applicationNote.applicationId, applicationId))
    .orderBy(desc(applicationNote.createdAt)); // Most recent first

  return {
    application,
    notes,
  };
}

export const load: PageServerLoad = async ({ params, locals }) => {
  requireAdmin(locals);
  const applicationId = params.id;

  if (!applicationId) {
    throw error(404, "Application not found");
  }

  // Tenant scoping
  const tenantId = adminTenantScope(locals);

  return {
    applicationId,
    serviceAreas: await serviceAreaService.listActive(),
    streamed: {
      applicationData: getApplicationData(applicationId, tenantId),
    },
  };
};

export const actions: Actions = {
  // Add note to application
  addNote: async ({ request, params, locals }) => {
    requireAdmin(locals);
    const applicationId = params.id;
    await getScopedApplication(locals, applicationId);
    const adminUser = locals.user;

    if (!applicationId) {
      return fail(400, { error: "Application ID is required" });
    }

    if (!adminUser) {
      return fail(401, { error: "Not authorized" });
    }

    const formData = await request.formData();
    const noteText = formData.get("note")?.toString();

    if (!noteText) {
      return fail(400, { error: "Note text is required" });
    }

    try {
      // Save the note to the application_note table
      await db.insert(applicationNote).values({
        id: crypto.randomUUID(),
        applicationId,
        content: noteText,
        addedBy: `${adminUser.firstName} ${adminUser.lastName}`,
        createdAt: new Date(),
      });

      // Optionally update the lastUpdated timestamp on the application itself
      await db
        .update(cleanerApplication)
        .set({ updatedAt: new Date() })
        .where(eq(cleanerApplication.id, applicationId));

      return {
        success: true,
        message: "Note added successfully",
      };
    } catch (err) {
      console.error("Error adding note:", err);
      return fail(500, { error: "Failed to add note" });
    }
  },
};

