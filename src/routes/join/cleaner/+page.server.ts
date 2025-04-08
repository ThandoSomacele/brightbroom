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
  city: z.string().min(1, "City/Area is required"),

  // Step 2: Work Experience
  // Replace the single experience field with an array of experience types
  experienceTypes: z.array(z.string()).min(1, "Please select at least one type of experience"),
  
  availability: z
    .array(z.string())
    .min(1, "Please select at least one day of availability"),
  ownTransport: z.string().optional(),
  whatsApp: z.string().optional(),

  // Step 3: Additional Details
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  hearAboutUs: z.string().optional(),
  terms: z.literal("on", {
    errorMap: () => ({ message: "You must accept the Terms of Service" }),
  }),
});

export const actions: Actions = {
  default: async ({ request }) => {
    const formData = await request.formData();

    // Extract basic form fields
    const firstName = formData.get("firstName")?.toString();
    const lastName = formData.get("lastName")?.toString();
    const email = formData.get("email")?.toString();
    const phone = formData.get("phone")?.toString();
    const city = formData.get("city")?.toString();
    
    // Get all selected experience types (could be multiple values)
    const experienceTypes = formData
      .getAll("experienceTypes")
      .map(item => item.toString());
      
    const availability = formData
      .getAll("availability")
      .map((item) => item.toString());
    const ownTransport = formData.get("ownTransport")?.toString();
    const whatsApp = formData.get("whatsApp")?.toString();
    const idType = formData.get("idType")?.toString();
    const idNumber = formData.get("idNumber")?.toString();
    const hearAboutUs = formData.get("hearAboutUs")?.toString();
    const terms = formData.get("terms")?.toString();

    // Log received data for debugging
    console.log("Received cleaner application data:", {
      firstName,
      lastName,
      email,
      phone,
      city,
      experienceTypes,
      availability,
      ownTransport,
      whatsApp,
      idType,
      idNumber,
    });

    // Handle file uploads
    const documents = formData.getAll("documents");
    const documentFiles = documents.filter(
      (item) => item instanceof File,
    ) as File[];

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
        ownTransport,
        whatsApp,
        idType,
        idNumber,
        hearAboutUs,
        terms,
      });

      // Generate a unique ID for the application
      const applicationId = crypto.randomUUID();

      // Process any uploaded documents
      // In a real implementation, you would upload these to cloud storage
      // and store the URLs in the database
      let documentUrls: string[] = [];
      if (documentFiles.length > 0) {
        // Placeholder: in a real app, upload files and get URLs
        documentUrls = documentFiles.map((file) => `${file.name}`);
      }

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
          // Change from experience (string) to experienceTypes (array)
          experienceTypes: experienceTypes,
          availability: JSON.stringify(availability),
          ownTransport: ownTransport === "yes",
          whatsApp: whatsApp === "yes",
          idType: idType || null,
          idNumber: idNumber || null,
          referralSource: hearAboutUs,
          documents: documentUrls,
          status: "PENDING", // Mark as pending by default
          isActive: false, // Inactive until admin review
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
          city,
          // Include the new experienceTypes in the email
          experienceTypes: experienceTypes,
          availability: JSON.stringify(availability),
          ownTransport: ownTransport === "yes",
          whatsApp: whatsApp === "yes",
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
            ownTransport,
            whatsApp,
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
            ownTransport,
            whatsApp,
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
          ownTransport,
          whatsApp,
          idType,
          idNumber,
          hearAboutUs,
        },
      });
    }
  },
};
