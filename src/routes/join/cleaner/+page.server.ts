// src/routes/join/+page.server.ts
import { fail } from "@sveltejs/kit";
import { z } from "zod";
import type { Actions } from "./$types";

// Form validation schema
const joinApplicationSchema = z.object({
  // Step 1: Personal Information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(1, "Phone number is required"),
  city: z.string().min(1, "City/Area is required"),
  
  // Step 2: Work Experience
  experience: z.string().min(1, "Experience selection is required"),
  availability: z.array(z.string()).min(1, "Please select at least one day of availability"),
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
    const experience = formData.get("experience")?.toString();
    const availability = formData.getAll("availability").map(item => item.toString());
    const ownTransport = formData.get("ownTransport")?.toString();
    const whatsApp = formData.get("whatsApp")?.toString();
    const idType = formData.get("idType")?.toString();
    const idNumber = formData.get("idNumber")?.toString();
    const hearAboutUs = formData.get("hearAboutUs")?.toString();
    const terms = formData.get("terms")?.toString();
    
    // Handle file uploads
    const documents = formData.getAll("documents");
    const documentFiles = documents.filter(item => item instanceof File) as File[];
    
    try {
      // Validate form data
      joinApplicationSchema.parse({
        firstName,
        lastName,
        email,
        phone,
        city,
        experience,
        availability,
        ownTransport,
        whatsApp,
        idType,
        idNumber,
        hearAboutUs,
        terms
      });
      
      // In a real application, you would:
      // 1. Store the application in your database
      // 2. Upload the files to a storage service
      // 3. Send email notifications to admin and applicant
      // 4. Add them to your CRM/applicant tracking system
      
      // For this example, we'll just log the data
      console.log("Cleaner application submission:", {
        firstName,
        lastName,
        email,
        phone,
        city,
        experience,
        availability,
        ownTransport,
        whatsApp,
        idType,
        idNumber,
        hearAboutUs,
        documents: documentFiles.map(file => file.name)
      });
      
      // Return success
      return {
        success: true,
        message: "Your application has been submitted successfully!"
      };
      
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        const errors = error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] || "Invalid form data";
        
        return fail(400, {
          error: firstError,
          data: {
            firstName,
            lastName,
            email,
            phone,
            city,
            experience,
            availability,
            ownTransport,
            whatsApp,
            idType,
            idNumber,
            hearAboutUs
          }
        });
      }
      
      // Generic error
      return fail(500, {
        error: "Something went wrong. Please try again later.",
        data: {
          firstName,
          lastName,
          email,
          phone,
          city,
          experience,
          availability,
          ownTransport,
          whatsApp,
          idType,
          idNumber,
          hearAboutUs
        }
      });
    }
  }
};
