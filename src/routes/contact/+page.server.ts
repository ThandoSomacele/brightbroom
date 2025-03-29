// src/routes/contact/+page.server.ts
import { fail } from "@sveltejs/kit";
import { z } from "zod";
import type { Actions } from "./$types";

// Form validation schema
const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters long"),
  referral: z.string().optional(),
  joinAsCleaner: z.boolean().optional()
});

export const actions: Actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    
    const firstName = formData.get("firstName")?.toString();
    const lastName = formData.get("lastName")?.toString();
    const email = formData.get("email")?.toString();
    const phone = formData.get("phone")?.toString() || undefined;
    const subject = formData.get("subject")?.toString();
    const message = formData.get("message")?.toString();
    const referral = formData.get("referral")?.toString() || undefined;
    const joinAsCleaner = formData.has("joinAsCleaner");
    
    try {
      // Validate form data
      contactSchema.parse({
        firstName,
        lastName,
        email,
        phone,
        subject,
        message,
        referral,
        joinAsCleaner
      });
      
      // In a real application, you would:
      // 1. Store the message in your database
      // 2. Send an email notification
      // 3. Possibly set up an auto-responder
      // For this example, we'll just log the data
      console.log("Contact form submission:", {
        firstName,
        lastName,
        email,
        phone,
        subject,
        message,
        referral,
        joinAsCleaner
      });
      
      if (joinAsCleaner) {
        // If they're interested in joining as a cleaner,
        // you might want to add them to a special list or tag them in your CRM
        console.log("Potential cleaner application flagged!");
      }
      
      // Return success
      return {
        success: true,
        message: "Your message has been sent successfully!"
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
            subject,
            message,
            referral,
            joinAsCleaner
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
          subject,
          message,
          referral,
          joinAsCleaner
        }
      });
    }
  }
};
