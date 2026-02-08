// src/routes/admin/applications/new/+page.server.ts
import { db } from "$lib/server/db";
import {
  applicationNote,
  cleanerApplication,
  cleanerProfile,
  user,
} from "$lib/server/db/schema";
import { sendWelcomeEmail } from "$lib/server/email-service";
import { hash } from "@node-rs/argon2";
import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user || locals.user.role !== "ADMIN") {
    throw redirect(302, "/auth/login?redirectTo=/admin/applications/new");
  }

  return {};
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== "ADMIN") {
      return fail(403, { error: "Unauthorized" });
    }

    const formData = await request.formData();

    // Required fields
    const firstName = formData.get("firstName")?.toString()?.trim();
    const lastName = formData.get("lastName")?.toString()?.trim();
    const phone = formData.get("phone")?.toString()?.trim() || null;
    const city = formData.get("city")?.toString()?.trim();

    // Optional fields
    const emailInput = formData.get("email")?.toString()?.trim() || "";
    const idType = formData.get("idType")?.toString() || "";
    const idNumber = formData.get("idNumber")?.toString()?.trim() || "";
    const workAddress = formData.get("workAddress")?.toString()?.trim() || "";
    const bio = formData.get("bio")?.toString()?.trim() || "";
    const petCompatibility =
      formData.get("petCompatibility")?.toString() || "NONE";
    const ownTransport = formData.has("ownTransport");
    const whatsApp = formData.has("whatsApp");
    const taxNumber = formData.get("taxNumber")?.toString()?.trim() || "";

    // Bank details
    const bankName = formData.get("bankName")?.toString()?.trim() || "";
    const bankAccountNumber =
      formData.get("bankAccountNumber")?.toString()?.trim() || "";
    const bankBranchCode =
      formData.get("bankBranchCode")?.toString()?.trim() || "";
    const bankAccountType =
      formData.get("bankAccountType")?.toString() || "";
    const bankAccountHolder =
      formData.get("bankAccountHolder")?.toString()?.trim() || "";

    // Parse available days
    const availableDays: string[] = [];
    const daysOfWeek = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ];
    for (const day of daysOfWeek) {
      if (formData.has(`day-${day}`)) {
        availableDays.push(day);
      }
    }

    // Auto-approve toggle
    const autoApprove = formData.has("autoApprove");

    // Validate required fields
    if (!firstName || !lastName || !city) {
      return fail(400, {
        error: "First name, last name, and city are required",
        data: {
          firstName,
          lastName,
          phone,
          city,
          email: emailInput,
          idType,
          idNumber,
          workAddress,
          bio,
          petCompatibility,
          ownTransport,
          whatsApp,
          taxNumber,
          bankName,
          bankAccountNumber,
          bankBranchCode,
          bankAccountType,
          bankAccountHolder,
          availableDays,
          autoApprove,
        },
      });
    }

    // Generate placeholder email if none provided
    const shortId = crypto.randomUUID().split("-")[0];
    const email = emailInput || `pending-${shortId}@internal.brightbroom.com`;
    const isPlaceholderEmail = !emailInput;

    try {
      // Check if a non-placeholder email already exists
      if (!isPlaceholderEmail) {
        const existingUser = await db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.email, email))
          .limit(1);

        if (existingUser.length > 0) {
          return fail(400, {
            error: "A user with this email already exists",
            data: {
              firstName,
              lastName,
              phone,
              city,
              email: emailInput,
              idType,
              idNumber,
              workAddress,
              bio,
              petCompatibility,
              ownTransport,
              whatsApp,
              taxNumber,
              bankName,
              bankAccountNumber,
              bankBranchCode,
              bankAccountType,
              bankAccountHolder,
              availableDays,
              autoApprove,
            },
          });
        }
      }

      // Create the application record
      const applicationId = crypto.randomUUID();
      await db.insert(cleanerApplication).values({
        id: applicationId,
        firstName,
        lastName,
        email,
        phone,
        city,
        formattedAddress: workAddress || null,
        idType: idType || null,
        idNumber: idNumber || null,
        bio: bio || null,
        taxNumber: taxNumber || null,
        petCompatibility: petCompatibility || "NONE",
        ownTransport,
        whatsApp,
        availability: availableDays.length > 0 ? JSON.stringify(availableDays) : "[]",
        documentsPending: true,
        bankName: bankName || null,
        bankAccountNumber: bankAccountNumber || null,
        bankBranchCode: bankBranchCode || null,
        bankAccountType: bankAccountType || null,
        bankAccountHolder: bankAccountHolder || null,
        status: autoApprove ? "APPROVED" : "PENDING",
        notes: `Created by admin: ${locals.user.firstName} ${locals.user.lastName}`,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Add a creation note
      await db.insert(applicationNote).values({
        id: crypto.randomUUID(),
        applicationId,
        content: `Application created by admin ${locals.user.firstName} ${locals.user.lastName} on behalf of applicant.${isPlaceholderEmail ? " Placeholder email used — real email needed before cleaner can log in." : ""}`,
        addedBy: `${locals.user.firstName} ${locals.user.lastName}`,
        createdAt: new Date(),
      });

      // If auto-approve, run the approval flow
      if (autoApprove) {
        const temporaryPassword = `BrightBroom${crypto.randomUUID().split("-")[0]}`;
        const passwordHash = await hash(temporaryPassword);
        const userId = crypto.randomUUID();

        // Create user account
        await db.insert(user).values({
          id: userId,
          email,
          passwordHash,
          firstName,
          lastName,
          phone,
          role: "CLEANER",
          isActive: !isPlaceholderEmail, // Only active if they have a real email
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Parse availability for profile
        let availabilityArray: string[] = [];
        try {
          availabilityArray = availableDays.length > 0 ? availableDays : [];
        } catch {
          availabilityArray = [];
        }

        // Create cleaner profile
        const profileId = crypto.randomUUID();
        await db.insert(cleanerProfile).values({
          id: profileId,
          userId,
          idType: idType || "SOUTH_AFRICAN_ID",
          idNumber: idNumber || "PENDING",
          workAddress: workAddress || city,
          workLocationLat: 0,
          workLocationLng: 0,
          workRadius: 10,
          bio: bio || "",
          petCompatibility: petCompatibility || "NONE",
          availableDays: availabilityArray,
          trainingCompleted: [],
          isAvailable: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Add approval note
        await db.insert(applicationNote).values({
          id: crypto.randomUUID(),
          applicationId,
          content: `Auto-approved by admin. User account and cleaner profile created.${isPlaceholderEmail ? " Cleaner has placeholder email — credentials need to be set up on the cleaner detail page." : ""}`,
          addedBy: `${locals.user.firstName} ${locals.user.lastName}`,
          createdAt: new Date(),
        });

        // Send welcome email only if real email
        if (!isPlaceholderEmail) {
          try {
            await sendWelcomeEmail(email, {
              firstName,
              lastName,
              role: "CLEANER",
              temporaryPassword,
            });
          } catch (emailError) {
            console.error("Error sending welcome email:", emailError);
          }
        }

        throw redirect(302, `/admin/cleaners/${userId}`);
      }

      throw redirect(302, `/admin/applications/${applicationId}`);
    } catch (err) {
      // Re-throw redirects
      if (err && typeof err === "object" && "status" in err && (err as any).status === 302) {
        throw err;
      }

      console.error("Error creating application:", err);
      return fail(500, {
        error: "Failed to create application. Please try again.",
        data: {
          firstName,
          lastName,
          phone,
          city,
          email: emailInput,
          idType,
          idNumber,
          workAddress,
          bio,
          petCompatibility,
          ownTransport,
          whatsApp,
          taxNumber,
          bankName,
          bankAccountNumber,
          bankBranchCode,
          bankAccountType,
          bankAccountHolder,
          availableDays,
          autoApprove,
        },
      });
    }
  },
};
