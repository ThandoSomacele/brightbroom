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

    // Check if token is provided
    if (!token) {
      return fail(400, { error: "Missing reset token" });
    }

    try {
      // Validate passwords
      passwordSchema.parse({ password, confirmPassword });

      // Reset password
      const success = await resetPassword(token, password!);

      if (!success) {
        return fail(400, {
          error:
            "Failed to reset password. The link may be invalid or expired.",
        });
      }

      // CHANGE: Redirect to login page after successful reset instead of just returning success
      throw redirect(302, "/auth/login?reset=success");

      // Return success message
      return {
        success: true,
        message:
          "Password has been reset successfully. You can now log in with your new password.",
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] || "Invalid input";
        return fail(400, { error: firstError });
      }

      return fail(500, {
        error: "Something went wrong. Please try again.",
      });
    }
  },
};
