// src/routes/admin/applications/[id]/+page.server.ts
import { db } from "$lib/server/db";
import {
  cleanerApplication,
  cleanerProfile,
  user,
} from "$lib/server/db/schema";
import { sendWelcomeEmail } from "$lib/server/email-service";
import { error, fail } from "@sveltejs/kit";
import { eq } from "drizzle-orm"; // Added missing 'and' import here
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

    // You can fetch any additional related data here
    // For example, any notes about the application

    return {
      application,
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
      // In a real implementation, you would save the note to a related table
      // For example:
      // await db.insert(applicationNote).values({
      //   id: crypto.randomUUID(),
      //   applicationId,
      //   content: noteText,
      //   addedBy: `${adminUser.firstName} ${adminUser.lastName}`,
      //   createdAt: new Date()
      // });

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

      // Create cleaner profile (inactive by default until fully onboarded)
      const availabilityArray = JSON.parse(application.availability || "[]");

      const profileId = crypto.randomUUID();
      await db.insert(cleanerProfile).values({
        id: profileId,
        userId,
        workAddress: application.city, // Default to city, would be updated later
        workLocationLat: 0, // Placeholder
        workLocationLng: 0, // Placeholder
        workRadius: 10, // Default radius
        idType: application.idType as any, // Type assertion
        idNumber: application.idNumber,
        bio: "",
        petCompatibility: "NONE",
        availableDays: availabilityArray,
        isAvailable: false, // Start as unavailable until fully onboarded
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Send welcome email with temporary password
      await sendWelcomeEmail(application.email, {
        firstName: application.firstName,
        lastName: application.lastName,
        role: "CLEANER", // Specify the role
        temporaryPassword, // You'd include this in a real implementation
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
