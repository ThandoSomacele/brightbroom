// src/routes/admin/cleaners/[id]/+page.server.ts
import { db } from "$lib/server/db";
import {
  booking,
  cleanerProfile,
  user,
} from "$lib/server/db/schema";
import { sendWelcomeEmail } from "$lib/server/email-service";
import { cleanerEarningsService } from "$lib/server/services/cleaner-earnings.service";
import { error, fail } from "@sveltejs/kit";
import { and, desc, eq } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";

// Helper function to fetch cleaner data
async function getCleanerData(cleanerId: string) {
  // Fetch the cleaner with profile data
  const userResults = await db
    .select()
    .from(user)
    .where(and(eq(user.id, cleanerId), eq(user.role, "CLEANER")))
    .limit(1);

  if (userResults.length === 0) {
    throw error(404, "Cleaner not found");
  }

  const cleanerData = userResults[0];

  // Fetch cleaner profile
  const profileResults = await db
    .select()
    .from(cleanerProfile)
    .where(eq(cleanerProfile.userId, cleanerId))
    .limit(1);

  const profile = profileResults.length > 0 ? profileResults[0] : null;

  // Fetch recent bookings
  const recentBookings = await db
    .select({
      id: booking.id,
      status: booking.status,
      scheduledDate: booking.scheduledDate,
      customer: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    })
    .from(booking)
    .innerJoin(user, eq(booking.userId, user.id))
    .where(eq(booking.cleanerId, cleanerId))
    .orderBy(desc(booking.scheduledDate))
    .limit(5);

  // Fetch earnings data
  const earningsData =
    await cleanerEarningsService.getCleanerEarningsSummary(cleanerId);

  // Fetch upcoming/potential earnings
  const upcomingEarningsData =
    await cleanerEarningsService.getUpcomingEarnings(cleanerId);

  // Combine data
  return {
    cleaner: {
      ...cleanerData,
      cleanerProfile: profile,
    },
    bookings: recentBookings,
    earnings: earningsData,
    upcomingEarnings: upcomingEarningsData,
  };
}

export const load: PageServerLoad = async ({ params }) => {
  const cleanerId = params.id;

  if (!cleanerId) {
    throw error(404, "Cleaner not found");
  }

  return {
    cleanerId,
    streamed: {
      cleanerData: getCleanerData(cleanerId),
    },
  };
};

export const actions: Actions = {
  // Update personal information
  updatePersonalInfo: async ({ params, request }) => {
    const cleanerId = params.id;

    if (!cleanerId) {
      return fail(400, { error: "Cleaner ID is required" });
    }

    const formData = await request.formData();
    const firstName = formData.get("firstName")?.toString();
    const lastName = formData.get("lastName")?.toString();
    const phone = formData.get("phone")?.toString() || null;

    if (!firstName || !lastName) {
      return fail(400, { error: "First name and last name are required" });
    }

    try {
      // Update user data
      await db
        .update(user)
        .set({
          firstName,
          lastName,
          phone,
          updatedAt: new Date(),
        })
        .where(eq(user.id, cleanerId));

      return {
        success: true,
        message: "Personal information updated successfully",
      };
    } catch (err) {
      console.error("Error updating personal info:", err);
      return fail(500, { error: "Failed to update personal information" });
    }
  },

  // Update training status action
  updateTraining: async ({ params, request }) => {
    const cleanerId = params.id;

    if (!cleanerId) {
      return fail(400, { error: "Cleaner ID is required" });
    }

    const formData = await request.formData();
    const homeTraining = formData.get("homeTraining") === "true";
    const officeTraining = formData.get("officeTraining") === "true";

    // Build training array
    const trainingCompleted: string[] = [];
    if (homeTraining) trainingCompleted.push("HOME");
    if (officeTraining) trainingCompleted.push("OFFICE");

    try {
      // Update cleaner profile with training status
      const result = await db
        .update(cleanerProfile)
        .set({
          trainingCompleted,
          updatedAt: new Date(),
        })
        .where(eq(cleanerProfile.userId, cleanerId));

      return {
        success: true,
        message: "Training status updated successfully",
      };
    } catch (err) {
      console.error("Error updating training status:", err);
      return fail(500, { error: "Failed to update training status" });
    }
  },

  // Update active status action
  updateActivation: async ({ params, request }) => {
    const cleanerId = params.id;

    if (!cleanerId) {
      return fail(400, { error: "Cleaner ID is required" });
    }

    const formData = await request.formData();
    const setActive = formData.get("setActive") === "true";

    try {
      // Update user record with isActive flag
      await db
        .update(user)
        .set({
          // Add an isActive flag to the user record
          isActive: setActive,
          updatedAt: new Date(),
        })
        .where(eq(user.id, cleanerId));

      // Update cleaner profile active status
      const profileResults = await db
        .select()
        .from(cleanerProfile)
        .where(eq(cleanerProfile.userId, cleanerId))
        .limit(1);

      if (profileResults.length > 0) {
        await db
          .update(cleanerProfile)
          .set({
            isAvailable: setActive,
            updatedAt: new Date(),
          })
          .where(eq(cleanerProfile.userId, cleanerId));
      }

      // If activating a cleaner for the first time, send them a welcome email
      if (setActive) {
        const userData = await db
          .select()
          .from(user)
          .where(eq(user.id, cleanerId))
          .limit(1);

        if (userData.length > 0) {
          // Send welcome email to cleaner with role specified
          await sendWelcomeEmail(userData[0].email, {
            firstName: userData[0].firstName,
            lastName: userData[0].lastName,
            role: "CLEANER", // Pass the role to use the correct template
          });
        }
      }

      return {
        success: true,
        message: setActive
          ? "Cleaner account activated successfully"
          : "Cleaner account deactivated successfully",
      };
    } catch (err) {
      console.error("Error updating cleaner active status:", err);
      return fail(500, { error: "Failed to update cleaner activation status" });
    }
  },

  // Update cleaner profile
  updateProfile: async ({ params, request }) => {
    const cleanerId = params.id;

    if (!cleanerId) {
      return fail(400, { error: "Cleaner ID is required" });
    }

    const formData = await request.formData();
    const workAddress = formData.get("workAddress")?.toString();
    const workRadius = formData.get("workRadius")
      ? parseFloat(formData.get("workRadius")?.toString() || "0")
      : 0;
    const bio = formData.get("bio")?.toString() || null;
    const petCompatibility =
      formData.get("petCompatibility")?.toString() || "NONE";
    const isAvailable = formData.has("isAvailable");
    const idType = formData.get("idType")?.toString() || "SOUTH_AFRICAN_ID";
    const idNumber = formData.get("idNumber")?.toString();
    const taxNumber = formData.get("taxNumber")?.toString() || null;

    // Get the JSON string for experience types and parse it
    const experienceTypesJson =
      formData.get("experienceTypesJson")?.toString() || "[]";
    let experienceTypes: string[] = [];
    try {
      experienceTypes = JSON.parse(experienceTypesJson);
    } catch (e) {
      console.error("Error parsing experience types:", e);
    }

    // Parse available days from JSON string
    let availableDays: string[] = [];
    try {
      const availableDaysJson = formData.get("availableDays")?.toString();
      if (availableDaysJson) {
        availableDays = JSON.parse(availableDaysJson);
      }
    } catch (e) {
      console.error("Error parsing available days:", e);
    }

    if (!workAddress || !idNumber) {
      return fail(400, { error: "Work address and ID number are required" });
    }

    try {
      // Check if cleaner profile exists
      const profileResults = await db
        .select()
        .from(cleanerProfile)
        .where(eq(cleanerProfile.userId, cleanerId))
        .limit(1);

      const profileExists = profileResults.length > 0;

      if (profileExists) {
        // Update existing profile with the new experienceTypes field
        await db
          .update(cleanerProfile)
          .set({
            workAddress,
            workRadius,
            bio,
            petCompatibility: petCompatibility as any, // Type assertion
            isAvailable,
            idType: idType as any, // Type assertion
            idNumber,
            taxNumber,
            availableDays,
            experienceTypes, // Add experience types to the update
            updatedAt: new Date(),
          })
          .where(eq(cleanerProfile.userId, cleanerId));
      } else {
        // Create new profile including experience types
        await db.insert(cleanerProfile).values({
          id: crypto.randomUUID(),
          userId: cleanerId,
          workAddress,
          workRadius,
          bio,
          petCompatibility: petCompatibility as any, // Type assertion
          isAvailable,
          idType: idType as any, // Type assertion
          idNumber,
          taxNumber,
          availableDays,
          experienceTypes, // Include experience types
          workLocationLat: 0, // Placeholder - would be set with actual geocoding
          workLocationLng: 0, // Placeholder - would be set with actual geocoding
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return {
        success: true,
        message: "Cleaner profile updated successfully",
      };
    } catch (err) {
      console.error("Error updating cleaner profile:", err);
      return fail(500, { error: "Failed to update cleaner profile" });
    }
  },

  // Update payout settings
  updatePayoutSettings: async ({ params, request }) => {
    const cleanerId = params.id;

    if (!cleanerId) {
      return fail(400, { error: "Cleaner ID is required" });
    }

    const formData = await request.formData();
    const payoutMethod = formData.get("payoutMethod")?.toString() as "EFT" | "INSTANT_MONEY";
    const bankName = formData.get("bankName")?.toString() || null;
    const bankAccountNumber = formData.get("bankAccountNumber")?.toString() || null;
    const bankBranchCode = formData.get("bankBranchCode")?.toString() || null;
    const bankAccountType = formData.get("bankAccountType")?.toString() as "SAVINGS" | "CHEQUE" | "TRANSMISSION" | null;
    const bankAccountHolder = formData.get("bankAccountHolder")?.toString() || null;

    // Validate EFT details if EFT is selected
    if (payoutMethod === "EFT") {
      if (!bankName || !bankAccountNumber || !bankBranchCode || !bankAccountType || !bankAccountHolder) {
        return fail(400, { error: "All bank details are required for EFT payout method" });
      }
    }

    try {
      // Check if cleaner profile exists
      const profileResults = await db
        .select()
        .from(cleanerProfile)
        .where(eq(cleanerProfile.userId, cleanerId))
        .limit(1);

      if (profileResults.length === 0) {
        return fail(400, { error: "Cleaner profile not found. Please save profile details first." });
      }

      // Update payout settings
      await db
        .update(cleanerProfile)
        .set({
          payoutMethod: payoutMethod as any,
          bankName,
          bankAccountNumber,
          bankBranchCode,
          bankAccountType: bankAccountType as any,
          bankAccountHolder,
          updatedAt: new Date(),
        })
        .where(eq(cleanerProfile.userId, cleanerId));

      return {
        success: true,
        message: "Payout settings updated successfully",
      };
    } catch (err) {
      console.error("Error updating payout settings:", err);
      return fail(500, { error: "Failed to update payout settings" });
    }
  },
};
