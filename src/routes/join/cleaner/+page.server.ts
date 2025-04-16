// src/routes/join/cleaner/+page.server.ts
import { db } from "$lib/server/db";
import { cleanerApplication } from "$lib/server/db/schema";
import { sendCleanerApplicationEmail } from "$lib/server/email-service";
import { fail } from "@sveltejs/kit";
import { z } from "zod";
import type { Actions } from "./$types";

// Update form validation schema to include experienceTypes
const joinApplicationSchema = z.object({
  // Step 1: Personal Information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(1, "Phone number is required"),
  
  // Address Information - enhanced to store for work location
  street: z.string().optional(),
  city: z.string().min(1, "City/Area is required"),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  formattedAddress: z.string().optional(),
  
  // Work radius can be set with default later
  workRadius: z.number().default(20), // Default 20km work radius
  
  // Step 2: Work Experience
  experienceTypes: z
    .array(z.string())
    .min(1, "Please select at least one type of experience"),

  availability: z
    .array(z.string())
    .min(1, "Please select at least one day of availability"),
  ownTransport: z.string().optional(),
  whatsApp: z.string().optional(),
  
  // Step 3: Additional Details
  idType: z.string().min(1, "ID type is required"),
  idNumber: z.string().min(1, "ID number is required"),
  taxNumber: z.string().optional(),
  bankAccount: z.string().optional(),
  bio: z.string().optional(),
  petCompatibility: z.string().default("NONE"),
  hearAboutUs: z.string().optional(),
  terms: z.literal("on", {
    errorMap: () => ({ message: "You must accept the Terms of Service" }),
  }),
});

export const actions: Actions = {
  default: async ({ request }) => {
    const formData = await request.formData();

    // Extract all form fields
    const firstName = formData.get("firstName")?.toString();
    const lastName = formData.get("lastName")?.toString();
    const email = formData.get("email")?.toString();
    const phone = formData.get("phone")?.toString();

    // Get detailed address information from Google Places
    const street = formData.get("street")?.toString() || "";
    const city = formData.get("city")?.toString() || "";
    const state = formData.get("state")?.toString() || "";
    const zipCode = formData.get("zipCode")?.toString() || "";
    const latitude = formData.get("latitude")
      ? parseFloat(formData.get("latitude")?.toString() || "0")
      : null;
    const longitude = formData.get("longitude")
      ? parseFloat(formData.get("longitude")?.toString() || "0")
      : null;
    const formattedAddress =
      street || city || state
        ? `${street}, ${city}, ${state} ${zipCode}`.trim()
        : "";

    // Get all selected experience types
    const experienceTypes = formData
      .getAll("experienceTypes")
      .map((item) => item.toString());

    const availability = formData
      .getAll("availability")
      .map((item) => item.toString());
    const ownTransport = formData.get("ownTransport")?.toString() === "yes";
    const whatsApp = formData.get("whatsApp")?.toString() === "yes";
    const idType = formData.get("idType")?.toString();
    const idNumber = formData.get("idNumber")?.toString();
    const hearAboutUs = formData.get("hearAboutUs")?.toString();
    const terms = formData.get("terms")?.toString();
    
    // Optional fields that can enhance the profile later
    const bio = formData.get("bio")?.toString() || "";
    const taxNumber = formData.get("taxNumber")?.toString() || "";
    const bankAccount = formData.get("bankAccount")?.toString() || "";
    const petCompatibility = formData.get("petCompatibility")?.toString() || "NONE";

    // Default work radius (20km)
    const workRadius = 20;

    try {
      // Validate form data with Zod
      joinApplicationSchema.parse({
        firstName,
        lastName,
        email,
        phone,
        city,
        experienceTypes,
        availability,
        ownTransport: ownTransport ? "yes" : "no",
        whatsApp: whatsApp ? "yes" : "no",
        idType,
        idNumber,
        hearAboutUs,
        terms,
      });

      // Generate a unique ID for the application
      const applicationId = crypto.randomUUID();

      // Store the application in the database with inactive status
      try {
        console.log(
          "Inserting application into database with ID:",
          applicationId,
        );

        await db.insert(cleanerApplication).values({
          id: applicationId,
          firstName,
          lastName,
          email,
          phone,
          city,
          formattedAddress,
          latitude,
          longitude,
          experienceTypes,
          availability: JSON.stringify(availability),
          ownTransport,
          whatsApp,
          idType: idType || null,
          idNumber: idNumber || null,
          referralSource: hearAboutUs,
          // Additional fields for easier profile creation later
          bio,
          taxNumber,
          bankAccount,
          petCompatibility,
          workRadius, // Default 20km work radius
          documents: [],
          status: "PENDING",
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log("Successfully inserted application into database");

        // Send email notification to recruitment team
        const emailResult = await sendCleanerApplicationEmail({
          id: applicationId,
          firstName,
          lastName,
          email,
          phone,
          city: formattedAddress || city,
          experienceTypes,
          availability: JSON.stringify(availability),
          ownTransport,
          whatsApp,
          createdAt: new Date(),
        });

        console.log("Email notification result:", emailResult);

        // Return success
        return {
          success: true,
          message:
            "Your application has been submitted successfully! Our team will review it and get back to you soon.",
        };
      } catch (error) {
        console.error("Database error:", error);
        return fail(500, {
          error:
            "There was a problem submitting your application. Please try again later.",
          data: {
            firstName,
            lastName,
            email,
            phone,
            city,
            experienceTypes,
            availability,
            ownTransport: ownTransport ? "yes" : "no",
            whatsApp: whatsApp ? "yes" : "no",
            idType,
            idNumber,
            hearAboutUs,
          },
        });
      }
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        const errors = error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] || "Invalid form data";
        console.error("Validation error:", firstError);

        return fail(400, {
          error: firstError,
          data: {
            firstName,
            lastName,
            email,
            phone,
            city,
            experienceTypes,
            availability,
            ownTransport: ownTransport ? "yes" : "no",
            whatsApp: whatsApp ? "yes" : "no",
            idType,
            idNumber,
            hearAboutUs,
          },
        });
      }

      // Generic error
      console.error("Unexpected error in cleaner application:", error);
      return fail(500, {
        error: "Something went wrong. Please try again later.",
        data: {
          firstName,
          lastName,
          email,
          phone,
          city,
          experienceTypes,
          availability,
          ownTransport: ownTransport ? "yes" : "no",
          whatsApp: whatsApp ? "yes" : "no",
          idType,
          idNumber,
          hearAboutUs,
        },
      });
    }
  },
};
