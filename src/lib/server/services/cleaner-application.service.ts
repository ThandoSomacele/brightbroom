// src/lib/server/services/cleaner-application.service.ts
import { db } from "$lib/server/db";
import {
  cleanerApplication,
  cleanerProfile,
  idTypeEnum,
  petCompatibilityEnum,
  user,
} from "$lib/server/db/schema";
import { sendWelcomeEmail } from "$lib/server/email-service";
import { tenantService } from "$lib/server/services/tenant.service";
import { generateStrongPassword } from "$lib/utils/auth-utils";
import { and, desc, eq, like, or } from "drizzle-orm";

/**
 * Service for managing cleaner applications
 */
export const cleanerApplicationService = {
  /**
   * Get all cleaner applications
   */
  async getAllApplications(status?: "PENDING" | "APPROVED" | "REJECTED") {
    try {
      // Filter by status if provided, newest first
      return await db
        .select()
        .from(cleanerApplication)
        .where(status ? eq(cleanerApplication.status, status) : undefined)
        .orderBy(desc(cleanerApplication.createdAt));
    } catch (error) {
      console.error("Error fetching cleaner applications:", error);
      throw error;
    }
  },

  /**
   * Get application by ID
   */
  async getApplicationById(id: string) {
    try {
      const [application] = await db
        .select()
        .from(cleanerApplication)
        .where(eq(cleanerApplication.id, id))
        .limit(1);

      return application || null;
    } catch (error) {
      console.error('Error fetching cleaner application:', { id, error });
      throw error;
    }
  },

  /**
   * Search applications by name, email, etc.
   */
  async searchApplications(
    searchTerm: string,
    status?: "PENDING" | "APPROVED" | "REJECTED",
  ) {
    try {
      // Search term match, plus the status filter if provided, newest first
      return await db
        .select()
        .from(cleanerApplication)
        .where(
          and(
            or(
              like(cleanerApplication.firstName, `%${searchTerm}%`),
              like(cleanerApplication.lastName, `%${searchTerm}%`),
              like(cleanerApplication.email, `%${searchTerm}%`),
            ),
            status ? eq(cleanerApplication.status, status) : undefined,
          ),
        )
        .orderBy(desc(cleanerApplication.createdAt));
    } catch (error) {
      console.error("Error searching cleaner applications:", error);
      throw error;
    }
  },

  /**
   * Approve a cleaner application and create user account
   * This function handles:
   * 1. Creating a user account
   * 2. Creating a cleaner profile with all application data
   * 3. Updating the application status
   * 4. Sending a welcome email
   */
  async approveApplication(
    applicationId: string,
  ): Promise<{
    success: boolean;
    message: string;
    userId?: string;
    details?: { email: string; role: string };
  }> {
    try {
      // Get the application
      const [application] = await db
        .select()
        .from(cleanerApplication)
        .where(eq(cleanerApplication.id, applicationId))
        .limit(1);

      if (!application) {
        return { success: false, message: "Application not found" };
      }

      if (application.status === "APPROVED") {
        return { success: false, message: "Application is already approved" };
      }

      // Enhanced check for existing user with detailed error message
      const existingUserCheck = await db
        .select({
          id: user.id,
          email: user.email,
          role: user.role,
        })
        .from(user)
        .where(eq(user.email, application.email))
        .limit(1);

      if (existingUserCheck.length > 0) {
        const existingUser = existingUserCheck[0];
        return {
          success: false,
          message: 'A user with this email already exists. Please update the application email.',
          details: { email: existingUser.email, role: existingUser.role }
        };
      }

      // The profile columns below are NOT NULL / enums while the application
      // stores free text, so check them before creating any account.
      const idType = idTypeEnum.enumValues.find(
        (v) => v === application.idType,
      );
      const petCompatibility = petCompatibilityEnum.enumValues.find(
        (v) => v === (application.petCompatibility || "NONE"),
      );
      const { idNumber, latitude, longitude } = application;
      if (!idType || !idNumber || !latitude || !longitude || !petCompatibility) {
        return {
          success: false,
          message:
            "Application is missing a valid ID type, ID number, location or pet compatibility. Please update the application first.",
        };
      }

      // 1. Create user account
      // Generate random password that will require reset
      const tempPassword = generateStrongPassword();

      // Hash password
      const { Argon2id } = await import("oslo/password");
      const hasher = new Argon2id();
      const hashedPassword = await hasher.hash(tempPassword);

      // Create user with CLEANER role
      const userId = crypto.randomUUID();
      const [newUser] = await db
        .insert(user)
        .values({
          id: userId,
          firstName: application.firstName,
          lastName: application.lastName,
          email: application.email,
          passwordHash: hashedPassword,
          phone: application.phone,
          role: "CLEANER",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // 2. Create cleaner profile
      const profileId = crypto.randomUUID();

      // Parse availability days from JSON string
      let availableDays: string[] = [];
      try {
        availableDays = JSON.parse(application.availability);
      } catch (e) {
        console.error('Error parsing availability days:', { error: e, availabilityString: application.availability });
        // Default to weekdays if parsing fails
        availableDays = [
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
        ];
      }

      // Create the profile with application data and defaults
      const resolvedTenantId = application.tenantId || (await tenantService.getPlatformOwner())?.id || null;
      const [newProfile] = await db
        .insert(cleanerProfile)
        .values({
          id: profileId,
          userId: userId,
          tenantId: resolvedTenantId,
          idType,
          idNumber,
          // Use application location as work location
          workLocationLat: latitude,
          workLocationLng: longitude,
          workAddress: application.formattedAddress || application.city,
          workRadius: application.workRadius || "20", // Default 20km radius
          bio: application.bio || "",
          taxNumber: application.taxNumber || null,
          petCompatibility,
          availableDays: availableDays,
          trainingCompleted: [], // No training completed yet - admin will update after onboarding
          rating: null, // No ratings yet
          isAvailable: false, // Start as unavailable until fully onboarded
          profileImageUrl: application.profileImageUrl,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // 3. Update application status to APPROVED
      await db
        .update(cleanerApplication)
        .set({
          status: "APPROVED",
          updatedAt: new Date(),
        })
        .where(eq(cleanerApplication.id, applicationId));

      // 5. Send welcome email
      try {
        await sendWelcomeEmail(application.email, {
          firstName: application.firstName,
          lastName: application.lastName,
          role: "CLEANER",
        });
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
        // Continue even if email fails - we don't want to roll back the approval
      }

      return {
        success: true,
        message: "Application approved successfully and account created",
        userId,
      };
    } catch (error) {
      console.error("Error approving cleaner application:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },

  /**
   * Reject a cleaner application
   */
  async rejectApplication(
    applicationId: string,
    reason?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const [application] = await db
        .select()
        .from(cleanerApplication)
        .where(eq(cleanerApplication.id, applicationId))
        .limit(1);

      if (!application) {
        return { success: false, message: "Application not found" };
      }

      if (application.status === "REJECTED") {
        return { success: false, message: "Application is already rejected" };
      }

      // Update application status to REJECTED
      await db
        .update(cleanerApplication)
        .set({
          status: "REJECTED",
          notes: reason || "Application rejected by admin",
          updatedAt: new Date(),
        })
        .where(eq(cleanerApplication.id, applicationId));

      // TODO: Send rejection email if desired

      return {
        success: true,
        message: "Application rejected successfully",
      };
    } catch (error) {
      console.error("Error rejecting cleaner application:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },

  /**
   * Add notes to an application
   */
  async addNotes(
    applicationId: string,
    notes: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await db
        .update(cleanerApplication)
        .set({
          notes,
          updatedAt: new Date(),
        })
        .where(eq(cleanerApplication.id, applicationId));

      return {
        success: true,
        message: "Notes added successfully",
      };
    } catch (error) {
      console.error("Error adding notes to cleaner application:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
};
