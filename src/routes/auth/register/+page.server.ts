// src/routes/auth/register/+page.server.ts
import {
  createSession,
  generateSessionToken,
  generateUserId,
  getUserByEmail,
  setSessionTokenCookie,
} from "$lib/server/auth";
import { db } from "$lib/server/db";
import { user } from "$lib/server/db/schema";
import { sendWelcomeEmail } from "$lib/server/email-service";
import { fail, redirect } from "@sveltejs/kit";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";

// Validate user isn't already logged in
export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    throw redirect(302, "/profile");
  }

  return {};
};

// Form validation schema
const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  terms: z.literal("on", {
    errorMap: () => ({ message: "You must accept the Terms of Service" }),
  }),
});

export const actions: Actions = {
  default: async (event) => {
    const { request } = event;
    const formData = await request.formData();

    const firstName = formData.get("firstName")?.toString();
    const lastName = formData.get("lastName")?.toString();
    const email = formData.get("email")?.toString().toLowerCase();
    const phone = formData.get("phone")?.toString();
    const password = formData.get("password")?.toString();
    const terms = formData.get("terms")?.toString();

    console.log("Registration attempt:", { firstName, lastName, email });

    try {
      // Validate form data
      registerSchema.parse({
        firstName,
        lastName,
        email,
        phone,
        password,
        terms,
      });

      // Check if user already exists
      const existingUser = await getUserByEmail(email!);

      if (existingUser) {
        console.log("User already exists:", email);
        return fail(400, {
          error: "Email already in use",
          firstName,
          lastName,
          email,
          phone,
        });
      }

      // Hash the password
      const { Argon2id } = await import("oslo/password");
      const hasher = new Argon2id();
      const hashedPassword = await hasher.hash(password!);

      // Create user ID
      const userId = generateUserId();

      // Create user in database
      const [newUser] = await db
        .insert(user)
        .values({
          id: userId,
          email: email!,
          firstName: firstName!,
          lastName: lastName!,
          passwordHash: hashedPassword,
          role: "CUSTOMER",
          phone: phone || null,
        })
        .returning();

      console.log("User created successfully:", email);

      // Create session
      const token = generateSessionToken();
      const session = await createSession(token, userId);

      // Set session cookie
      setSessionTokenCookie(event, token, session.expiresAt);

      // After successful registration and session creation
      // Send welcome email
      await sendWelcomeEmail(email!, {
        firstName: firstName!,
        lastName: lastName!,
      });

      console.log('Registration and welcome email successful, redirecting to profile');
      
    } catch (error) {
      console.error("Registration error:", error);

      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        const errors = error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] || "Invalid input";
        return fail(400, {
          error: firstError,
          firstName,
          lastName,
          email,
          phone,
        });
      }

      return fail(500, {
        error: "Failed to create account. Please try again.",
        firstName,
        lastName,
        email,
        phone,
      });
    }
    
    // After successful registration and session creation, redirect
    // This matches the pattern in login.server.ts
    throw redirect(302, "/profile");
  },
};
