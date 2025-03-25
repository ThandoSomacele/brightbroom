// src/routes/auth/forgot-password/+page.server.ts
import { error, fail, redirect } from "@sveltejs/kit";
import { createPasswordResetToken, sendPasswordResetEmail } from "$lib/server/password-reset";
import { checkRateLimit } from "$lib/server/rate-limiter";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";

// Redirect logged in users
export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    throw redirect(302, "/profile");
  }
  return {};
};

// Form validation schema
const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const actions: Actions = {
  default: async ({ request, getClientAddress }) => {
    const formData = await request.formData();
    const email = formData.get("email")?.toString().toLowerCase();
    
    try {
      // Validate email
      emailSchema.parse({ email });
      
      // Check IP-based rate limit
      const ipAddress = getClientAddress();
      const ipRateLimit = checkRateLimit('passwordReset', ipAddress);
      
      if (!ipRateLimit.allowed) {
        return fail(429, { 
          error: `Too many password reset attempts. Please try again after ${ipRateLimit.resetTime?.toLocaleTimeString()}.`,
          email
        });
      }
      
      // Check email-based rate limit
      const emailRateLimit = checkRateLimit('passwordReset', email!);
      
      if (!emailRateLimit.allowed) {
        return fail(429, { 
          error: `Too many reset attempts for this email. Please try again after ${emailRateLimit.resetTime?.toLocaleTimeString()}.`,
          email
        });
      }
      
      // Generate reset token (returns null if email doesn't exist)
      const resetToken = await createPasswordResetToken(email!);
      
      // We always return success to avoid email enumeration attacks
      // But only send an email if the user actually exists
      if (resetToken) {
        await sendPasswordResetEmail(email!, resetToken);
      }
      
      // Return success message
      return {
        success: true,
        message: "If an account exists with that email, you will receive password reset instructions."
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] || "Invalid email";
        return fail(400, { error: firstError, email });
      }
      
      return fail(500, { 
        error: "Something went wrong. Please try again.", 
        email 
      });
    }
  }
};
