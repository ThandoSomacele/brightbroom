// src/routes/auth/reset-password/+page.server.ts
import { resetPassword, validateResetToken } from "$lib/server/password-reset";
import { error, fail, redirect } from "@sveltejs/kit";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";

// Load function to validate token
export const load: PageServerLoad = async ({ url, locals }) => {
  // Redirect logged in users
  if (locals.user) {
    throw redirect(302, "/profile");
  }

  const token = url.searchParams.get("token");

  // Skip token validation if we're coming back after successful submission
  const justReset = url.searchParams.get("just_reset") === "true";
  if (justReset) {
    return {
      token,
      justReset: true,
    };
  }

  // Check if token is provided
  if (!token) {
    throw redirect(302, "/auth/forgot-password");
  }

  // Validate token
  const { valid } = await validateResetToken(token);

  if (!valid) {
    throw error(400, "Invalid or expired password reset link");
  }

  return {
    token,
  };
};

// Password validation schema
const passwordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const actions: Actions = {
  default: async ({ request, url }) => {
    const formData = await request.formData();
    const token = formData.get("token")?.toString();
    const password = formData.get("password")?.toString();
    const confirmPassword = formData.get("confirmPassword")?.toString();

    console.log("Processing password reset request:", {
      tokenExists: !!token,
      tokenLength: token?.length,
    });

    // Check if token is provided
    if (!token) {
      console.log("Missing reset token");
      return fail(400, { error: "Missing reset token" });
    }

    try {
      // Validate passwords
      passwordSchema.parse({ password, confirmPassword });
      console.log("Password validation passed");

      // Reset password
      console.log("Attempting to reset password with token");
      const success = await resetPassword(token, password!);

      console.log("Password reset result:", { success });

      if (!success) {
        console.log("Password reset failed");
        return fail(400, {
          error:
            "Failed to reset password. The link may be invalid or expired.",
        });
      }

      // Log before redirect
      console.log("Password reset successful, redirecting to login");

      // IMPORTANT: Use a simple path without query parameters first
      throw redirect(302, "/auth/login");
    } catch (error) {
      console.error("Error in password reset:", error);

      if (error instanceof z.ZodError) {
        const errors = error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] || "Invalid input";
        console.log("Validation error:", firstError);
        return fail(400, { error: firstError });
      }

      // Important: Check if it's a redirect error, and if so, re-throw it
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        "location" in error
      ) {
        console.log("Re-throwing redirect");
        throw error;
      }

      console.log("Returning generic error");
      return fail(500, {
        error: "Something went wrong. Please try again.",
      });
    }
  },
};
