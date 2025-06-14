// src/routes/join/cleaner/+page.server.ts
import { db } from "$lib/server/db";
import { cleanerApplication } from "$lib/server/db/schema";
import { sendCleanerApplicationEmail } from "$lib/server/email-service";
import { checkRateLimit } from "$lib/server/rate-limiter";
import { validateHoneypot, logBotDetection } from "$lib/server/honeypot-validator";
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
  default: async ({ request, getClientAddress }) => {
    const formData = await request.formData();

    // Extract all form fields
    const firstName = formData.get("firstName")?.toString();
    const lastName = formData.get("lastName")?.toString();
    const email = formData.get("email")?.toString()?.toLowerCase();
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
        ? `${street ? street + ", " : ""}${city}${state ? ", " + state : ""}${
            zipCode ? " " + zipCode : ""
          }`
        : "";

    // Work radius with fallback
    const workRadius = formData.get("workRadius")
      ? parseFloat(formData.get("workRadius")?.toString() || "20")
      : 20;

    // Experience types - handle multiple selections
    const experienceTypes = formData.getAll("experienceTypes") as string[];

    // Availability - handle multiple days
    const availability = formData.getAll("availability") as string[];

    const ownTransport = formData.get("ownTransport") === "yes";
    const whatsApp = formData.get("whatsApp") === "yes";

    // Additional details
    const idType = formData.get("idType")?.toString();
    const idNumber = formData.get("idNumber")?.toString();
    const taxNumber = formData.get("taxNumber")?.toString() || null;
    const bankAccount = formData.get("bankAccount")?.toString() || null;
    const bio = formData.get("bio")?.toString() || null;
    const petCompatibility = formData.get("petCompatibility")?.toString() || "NONE";
    const hearAboutUs = formData.get("hearAboutUs")?.toString();
    const terms = formData.get("terms");

    // Helper function to create form data object for returns
    const createFormDataObject = () => ({
      firstName,
      lastName,
      email,
      phone,
      street,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      formattedAddress,
      workRadius,
      experienceTypes,
      availability,
      ownTransport: ownTransport ? "yes" : "no",
      whatsApp: whatsApp ? "yes" : "no",
      idType,
      idNumber,
      taxNumber,
      bankAccount,
      bio,
      petCompatibility,
      hearAboutUs,
      terms
    });

    try {
      // Validate form data first
      joinApplicationSchema.parse({
        firstName,
        lastName,
        email,
        phone,
        street,
        city,
        state,
        zipCode,
        latitude,
        longitude,
        formattedAddress,
        workRadius,
        experienceTypes,
        availability,
        ownTransport: ownTransport ? "yes" : undefined,
        whatsApp: whatsApp ? "yes" : undefined,
        idType,
        idNumber,
        taxNumber,
        bankAccount,
        bio,
        petCompatibility,
        hearAboutUs,
        terms,
      });

      // Honeypot validation - check for bot submissions
      const honeypotResult = validateHoneypot(formData, "cleaner");
      
      if (honeypotResult.isBot) {
        const clientIP = getClientAddress();
        logBotDetection(honeypotResult, clientIP, "cleaner_application", {
          email,
          name: `${firstName} ${lastName}`,
          city,
          reason: honeypotResult.reason
        });

        // Return a generic error to avoid revealing anti-spam measures
        return fail(400, {
          error: "Please try submitting the application again.",
          data: createFormDataObject()
        });
      }

      // Rate limiting checks AFTER validation and honeypot - cleaner applications are more sensitive
      const clientIP = getClientAddress();

      // Check IP-based rate limit (2 applications per hour per IP)
      const ipRateLimit = checkRateLimit('cleanerApplication', clientIP);
      
      if (!ipRateLimit.allowed) {
        console.log(`Cleaner application rate limit exceeded for IP: ${clientIP}`);
        return fail(429, {
          error: `Too many cleaner applications from this location. Please try again after ${ipRateLimit.resetTime?.toLocaleTimeString('en-ZA', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}.`,
          data: createFormDataObject()
        });
      }

      // Check email-based rate limit (1 application per 24 hours per email)
      const emailRateLimit = checkRateLimit('cleanerApplication', email!);
      
      if (!emailRateLimit.allowed) {
        console.log(`Cleaner application rate limit exceeded for email: ${email}`);
        return fail(429, {
          error: `An application has already been submitted with this email address. Please try again after ${emailRateLimit.resetTime?.toLocaleTimeString('en-ZA', { 
            hour: '2-digit', 
            minute: '2-digit',
            day: '2-digit',
            month: 'short'
          })}.`,
          data: createFormDataObject()
        });
      }

      // Check if this email has already applied (additional database check)
      const existingApplication = await db
        .select()
        .from(cleanerApplication)
        .where(eq(cleanerApplication.email, email!))
        .limit(1);

      if (existingApplication.length > 0) {
        console.log(`Duplicate cleaner application attempt for email: ${email}`);
        return fail(400, {
          error: "An application with this email address already exists. Please contact us if you need to update your application.",
          data: createFormDataObject()
        });
      }

      // Create the cleaner application record
      const applicationId = crypto.randomUUID();
      const applicationData = {
        id: applicationId,
        firstName: firstName!,
        lastName: lastName!,
        email: email!,
        phone: phone!,
        street,
        city: city!,
        state: state || "Gauteng", // Default for South Africa
        zipCode,
        latitude: latitude || 0,
        longitude: longitude || 0,
        formattedAddress,
        workRadius,
        experienceTypes: JSON.stringify(experienceTypes),
        availability: JSON.stringify(availability),
        ownTransport,
        whatsApp,
        idType: idType!,
        idNumber: idNumber!,
        taxNumber,
        bankAccount,
        bio,
        petCompatibility: petCompatibility as "LOW" | "MEDIUM" | "HIGH" | "NONE",
        hearAboutUs,
        status: "PENDING" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(cleanerApplication).values(applicationData);

      // Log the successful application
      console.log("Cleaner application submitted:", {
        id: applicationId,
        email,
        name: `${firstName} ${lastName}`,
        city,
        ip: clientIP,
        timestamp: new Date().toISOString()
      });

      // Send email notification to admin
      try {
        const emailSent = await sendCleanerApplicationEmail({
          ...applicationData,
          experience: experienceTypes.join(", "), // Convert array to string for email
        });

        if (!emailSent) {
          console.error("Failed to send cleaner application email notification");
          // Continue with success - don't fail the application submission
        }
      } catch (emailError) {
        console.error("Error sending cleaner application email:", emailError);
        // Continue with success - don't fail the application submission
      }

      // Return success
      return {
        success: true,
        message: "Your cleaner application has been submitted successfully! We'll review it and get back to you within 2-3 business days.",
        applicationId
      };

    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        const errors = error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] || "Invalid form data";
        console.log(`Cleaner application validation error: ${firstError}`);

        return fail(400, {
          error: firstError,
          data: createFormDataObject()
        });
      }

      // Handle database errors
      if (error instanceof Error && error.message.includes('duplicate key')) {
        console.log(`Cleaner application database duplicate error for email: ${email}`);
        return fail(400, {
          error: "An application with this email address already exists.",
          data: createFormDataObject()
        });
      }

      // Generic error
      console.error("Unexpected error in cleaner application:", error);
      return fail(500, {
        error: "Something went wrong. Please try again later.",
        data: createFormDataObject()
      });
    }
  },
};
