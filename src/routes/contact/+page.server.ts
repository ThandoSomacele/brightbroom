// src/routes/contact/+page.server.ts
import { sendContactFormEmail } from "$lib/server/email-service";
import { checkRateLimit } from "$lib/server/rate-limiter";
import { validateHoneypot, logBotDetection } from "$lib/server/honeypot-validator";
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
  joinAsCleaner: z.boolean().optional(),
});

export const actions: Actions = {
  default: async ({ request, getClientAddress }) => {
    const formData = await request.formData();

    const firstName = formData.get("firstName")?.toString();
    const lastName = formData.get("lastName")?.toString();
    const email = formData.get("email")?.toString()?.toLowerCase();
    const phone = formData.get("phone")?.toString() || undefined;
    const subject = formData.get("subject")?.toString();
    const message = formData.get("message")?.toString();
    const referral = formData.get("referral")?.toString() || undefined;
    const joinAsCleaner = formData.has("joinAsCleaner");

    try {
      // Validate form data first
      contactSchema.parse({
        firstName,
        lastName,
        email,
        phone,
        subject,
        message,
        referral,
        joinAsCleaner,
      });

      // Honeypot validation - check for bot submissions
      const honeypotResult = validateHoneypot(formData, "contact");
      
      if (honeypotResult.isBot) {
        const clientIP = getClientAddress();
        logBotDetection(honeypotResult, clientIP, "contact", {
          email,
          subject,
          reason: honeypotResult.reason
        });

        // Return a generic error to avoid revealing anti-spam measures
        return fail(400, {
          error: "Please try submitting the form again.",
          firstName,
          lastName,
          email,
          phone,
          subject,
          message,
          referral,
          joinAsCleaner
        });
      }

      // Rate limiting checks AFTER validation and honeypot to prevent abuse
      const clientIP = getClientAddress();
      
      // Check IP-based rate limit
      const ipRateLimit = checkRateLimit('contactForm', clientIP);
      
      if (!ipRateLimit.allowed) {
        console.log(`Contact form rate limit exceeded for IP: ${clientIP}`);
        return fail(429, {
          error: `Too many contact form submissions. Please try again after ${ipRateLimit.resetTime?.toLocaleTimeString('en-ZA', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}.`,
          firstName,
          lastName,
          email,
          phone,
          subject,
          message,
          referral,
          joinAsCleaner
        });
      }

      // Check email-based rate limit
      const emailRateLimit = checkRateLimit('contactForm', email!);
      
      if (!emailRateLimit.allowed) {
        console.log(`Contact form rate limit exceeded for email: ${email}`);
        return fail(429, {
          error: `Too many submissions from this email address. Please try again after ${emailRateLimit.resetTime?.toLocaleTimeString('en-ZA', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}.`,
          firstName,
          lastName,
          email,
          phone,
          subject,
          message,
          referral,
          joinAsCleaner
        });
      }

      // Create form data object
      const contactFormData = {
        firstName,
        lastName,
        email,
        phone,
        subject,
        message,
        referral,
        joinAsCleaner,
      };

      // Log the submission for monitoring
      console.log("Contact form submission:", {
        email,
        subject,
        joinAsCleaner,
        ip: clientIP,
        timestamp: new Date().toISOString()
      });

      // Send email notification
      const emailSent = await sendContactFormEmail(contactFormData);

      if (!emailSent) {
        console.error("Failed to send contact form email notification");
        // We'll still return success to the user, but log the error
      }

      if (joinAsCleaner) {
        // If they're interested in joining as a cleaner,
        // you might want to add them to a special list or tag them in your CRM
        console.log("Potential cleaner application flagged!", { email, name: `${firstName} ${lastName}` });
      }

      // Return success
      return {
        success: true,
        message: "Your message has been sent successfully! We'll get back to you soon.",
      };
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        const errors = error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] || "Please check your input";
        
        console.log(`Contact form validation error: ${firstError}`);
        
        return fail(400, {
          error: firstError,
          firstName,
          lastName,
          email,
          phone,
          subject,
          message,
          referral,
          joinAsCleaner
        });
      }

      // Handle unexpected errors
      console.error("Contact form submission error:", error);
      return fail(500, {
        error: "Something went wrong. Please try again later.",
        firstName,
        lastName,
        email,
        phone,
        subject,
        message,
        referral,
        joinAsCleaner
      });
    }
  }
};
