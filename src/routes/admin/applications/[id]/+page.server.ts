// src/routes/admin/applications/[id]/+page.server.ts
import { db } from "$lib/server/db";
import {
  applicationNote,
  cleanerApplication,
  cleanerProfile,
  user,
} from "$lib/server/db/schema";
import { sendWelcomeEmail } from "$lib/server/email-service";
import { hash } from "@node-rs/argon2";
import { error, fail } from "@sveltejs/kit";
import { desc, eq } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";

// Helper function to fetch application data
async function getApplicationData(applicationId: string) {
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
}

export const load: PageServerLoad = async ({ params }) => {
  const applicationId = params.id;

  if (!applicationId) {
    throw error(404, "Application not found");
  }

  return {
    applicationId,
    streamed: {
      applicationData: getApplicationData(applicationId),
    },
  };
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

      // Determine if this is a placeholder email
      const isPlaceholderEmail = application.email.includes("@internal.brightbroom.com");

      // Generate a temporary password
      const temporaryPassword = `BrightBroom${crypto.randomUUID().split("-")[0]}`;

      // Create user account
      const userId = crypto.randomUUID();
      const passwordHash = await hash(temporaryPassword);

      // Insert new user with CLEANER role
      // If placeholder email, set inactive so they can't log in until real credentials are set
      await db.insert(user).values({
        id: userId,
        email: application.email,
        passwordHash,
        firstName: application.firstName,
        lastName: application.lastName,
        phone: application.phone,
        role: "CLEANER",
        isActive: !isPlaceholderEmail,
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
          idType: application.idType || "SOUTH_AFRICAN_ID",
          idNumber: application.idNumber || "PENDING",
          workAddress: application.formattedAddress || application.city,
          workLocationLat: application.latitude || 0,
          workLocationLng: application.longitude || 0,
          workRadius: 10,
          bio: application.bio || "",
          petCompatibility: application.petCompatibility || "NONE",
          availableDays: availabilityArray,
          trainingCompleted: [],
          isAvailable: false,
          profileImageUrl: application.profileImageUrl,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

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

      // Send welcome email only if the cleaner has a real email
      if (!isPlaceholderEmail) {
        try {
          await sendWelcomeEmail(application.email, {
            firstName: application.firstName,
            lastName: application.lastName,
            role: "CLEANER",
            temporaryPassword,
          });
        } catch (emailError) {
          console.error("Error sending welcome email:", emailError);
        }
      }

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

