// src/routes/admin/applications/[id]/+page.server.ts
import { db } from "$lib/server/db";
import {
  applicationNote,
  cleanerApplication,
  cleanerProfile,
  cleanerSpecialisation,
  service,
  user,
} from "$lib/server/db/schema";
import { sendWelcomeEmail } from "$lib/server/email-service";
import { error, fail } from "@sveltejs/kit";
import { desc, eq } from "drizzle-orm"; // Added desc import for sorting
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const applicationId = params.id;

  if (!applicationId) {
    throw error(404, "Application not found");
  }

  try {
    // Fetch the application details
    const [application] = await db
      .select()
      .from(cleanerApplication)
      .where(eq(cleanerApplication.id, applicationId))
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
  } catch (err) {
    console.error("Error loading application details:", err);
    throw error(500, "Error loading application details");
  }
};

export const actions: Actions = {
  // Add note to application
  addNote: async ({ request, params, locals }) => {
    const applicationId = params.id;
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

  // Approve application
  // Updated approve action in src/routes/admin/applications/[id]/+page.server.ts
  approve: async ({ params, locals }) => {
    const applicationId = params.id;
    const adminUser = locals.user;

    if (!applicationId) {
      return fail(400, { error: "Application ID is required" });
    }

    if (!adminUser) {
      return fail(401, { error: "Not authorized" });
    }

    try {
      // Fetch the application
      const [application] = await db
        .select()
        .from(cleanerApplication)
        .where(eq(cleanerApplication.id, applicationId))
        .limit(1);

      if (!application) {
        return fail(404, { error: "Application not found" });
      }

      if (application.status !== "PENDING") {
        return fail(400, { error: "Application has already been processed" });
      }

      // Update application status
      await db
        .update(cleanerApplication)
        .set({
          status: "APPROVED",
          updatedAt: new Date(),
        })
        .where(eq(cleanerApplication.id, applicationId));

      // Generate a temporary password (in a real application, use a secure method)
      const temporaryPassword = `BrightBroom${Math.random().toString(36).substring(2, 8)}`;

      // Create user account
      const userId = crypto.randomUUID();

      // Hash password (using a placeholder here - use your app's password hashing)
      const passwordHash = await hash(temporaryPassword);

      // Insert new user with CLEANER role
      await db.insert(user).values({
        id: userId,
        email: application.email,
        passwordHash,
        firstName: application.firstName,
        lastName: application.lastName,
        phone: application.phone,
        role: "CLEANER",
        isActive: true, // Set initial active status to true
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Parse availability array from application
      let availabilityArray = [];
      try {
        availabilityArray = JSON.parse(application.availability || "[]");
      } catch (error) {
        console.error("Error parsing availability:", error);
        // Default to weekdays if parsing fails
        availabilityArray = [
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
        ];
      }

      // Create cleaner profile with data from application
      const profileId = crypto.randomUUID();
      try {
        await db.insert(cleanerProfile).values({
          id: profileId,
          userId,
          idType: application.idType ? application.idType : "SOUTH_AFRICAN_ID",
          idNumber: application.idNumber || "0000000000000",
          workAddress: application.formattedAddress || application.city,
          // Use actual coordinates from application if available
          workLocationLat: application.latitude || -26.0274, // Default to Fourways
          workLocationLng: application.longitude || 28.0106, // Fixed: Correct longitude for Fourways
          workRadius: 10, // Default radius in km
          bio: "", // Empty bio initially
          petCompatibility: "NONE", // Default to no pet compatibility
          availableDays: availabilityArray, // Use availability days from application
          experienceTypes: application.experienceTypes || [], // Use experience types from application
          isAvailable: false, // Start as unavailable until fully onboarded
          profileImageUrl: application.profileImageUrl, // Transfer profile image if any
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Create specializations for all services
        try {
          // Fetch all active services
          const services = await db
            .select({ id: service.id })
            .from(service)
            .where(eq(service.isActive, true));

          // Create specializations for each service
          if (services.length > 0) {
            const specializations = services.map((svc) => ({
              id: crypto.randomUUID(),
              cleanerProfileId: profileId,
              serviceId: svc.id,
              experience: 0, // Default to 0 months experience
            }));

            // Insert all specializations in a single query
            await db.insert(cleanerSpecialisation).values(specializations);

            console.log(
              `Added ${specializations.length} default service specializations for cleaner ${userId}`,
            );
          }
        } catch (specializationError) {
          console.error(
            "Error adding default service specializations:",
            specializationError,
          );
          // Continue execution even if adding specializations fails - we can fix it later
          // Add note about the specialization error
          await db.insert(applicationNote).values({
            id: crypto.randomUUID(),
            applicationId,
            content: `WARNING: Error adding default service specializations: ${specializationError.message || "Unknown error"}. Please add them manually.`,
            addedBy: `System`,
            createdAt: new Date(),
          });
        }

        console.log(`Successfully created cleaner profile for user ${userId}`);
      } catch (profileError) {
        console.error("Error creating cleaner profile:", profileError);
        // Continue execution even if profile creation fails - we can fix it later
        // Add note about the profile creation error
        await db.insert(applicationNote).values({
          id: crypto.randomUUID(),
          applicationId,
          content: `WARNING: Error creating cleaner profile: ${profileError.message || "Unknown error"}. Please create the profile manually.`,
          addedBy: `System`,
          createdAt: new Date(),
        });
      }

      // Add a note about the approval
      await db.insert(applicationNote).values({
        id: crypto.randomUUID(),
        applicationId,
        content: `Application approved by ${adminUser.firstName} ${adminUser.lastName}. User account and cleaner profile created.`,
        addedBy: `${adminUser.firstName} ${adminUser.lastName}`,
        createdAt: new Date(),
      });

      // Send welcome email with temporary password
      await sendWelcomeEmail(application.email, {
        firstName: application.firstName,
        lastName: application.lastName,
        role: "CLEANER", // Specify the role
        temporaryPassword, // Include this in email for the cleaner to log in
      });

      return {
        success: true,
        message: "Application approved and cleaner account created",
        userId,
      };
    } catch (err) {
      console.error("Error approving application:", err);
      return fail(500, { error: "Failed to approve application" });
    }
  },

  // Reject application
  reject: async ({ params, locals }) => {
    const applicationId = params.id;
    const adminUser = locals.user;

    if (!applicationId) {
      return fail(400, { error: "Application ID is required" });
    }

    if (!adminUser) {
      return fail(401, { error: "Not authorized" });
    }

    try {
      // Update application status
      await db
        .update(cleanerApplication)
        .set({
          status: "REJECTED",
          updatedAt: new Date(),
        })
        .where(eq(cleanerApplication.id, applicationId));

      // Add a note about the rejection
      await db.insert(applicationNote).values({
        id: crypto.randomUUID(),
        applicationId,
        content: `Application rejected by ${adminUser.firstName} ${adminUser.lastName}.`,
        addedBy: `${adminUser.firstName} ${adminUser.lastName}`,
        createdAt: new Date(),
      });

      // In a real implementation, you might send a notification email

      return {
        success: true,
        message: "Application rejected",
      };
    } catch (err) {
      console.error("Error rejecting application:", err);
      return fail(500, { error: "Failed to reject application" });
    }
  },
};

// Helper function to hash passwords (placeholder)
async function hash(password: string): Promise<string> {
  // This is a placeholder - in your app, use the appropriate password hashing library
  // For example, with argon2:
  // return await argon2.hash(password);
  return `hashed_${password}`; // NEVER use this in production
}
