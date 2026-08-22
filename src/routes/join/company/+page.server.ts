// src/routes/join/company/+page.server.ts
import {
  createSession,
  generateSessionToken,
  generateUserId,
  getUserByEmail,
  setSessionTokenCookie,
} from "$lib/server/auth";
import { db } from "$lib/server/db";
import { user } from "$lib/server/db/schema";
import { sendTenantWelcomeEmail } from "$lib/server/email-service";
import {
  logBotDetection,
  validateHoneypot,
} from "$lib/server/honeypot-validator";
import { checkRateLimit } from "$lib/server/rate-limiter";
import { tenantService } from "$lib/server/services/tenant.service";
import { fail, redirect } from "@sveltejs/kit";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";

// Commission every self-serve company starts on. Platform admins can change a
// tenant's rate afterwards from /admin/tenants.
const DEFAULT_COMMISSION_RATE = "15.00";

const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];

export const load: PageServerLoad = async ({ locals }) => {
  // An existing tenant admin already has a company — send them to their dashboard
  if (locals.user && locals.tenant) {
    throw redirect(302, "/admin/dashboard");
  }

  return { provinces: PROVINCES };
};

const signupSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  contactPhone: z.string().min(6, "A contact phone number is required"),
  province: z.string().min(1, "Please select a province"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  terms: z.literal("on", {
    errorMap: () => ({ message: "You must accept the Terms of Service" }),
  }),
});

export const actions: Actions = {
  default: async (event) => {
    const { request, getClientAddress } = event;
    const formData = await request.formData();

    const companyName = formData.get("companyName")?.toString().trim();
    const contactPhone = formData.get("contactPhone")?.toString().trim();
    const province = formData.get("province")?.toString().trim();
    const firstName = formData.get("firstName")?.toString().trim();
    const lastName = formData.get("lastName")?.toString().trim();
    const email = formData.get("email")?.toString().toLowerCase().trim();
    const password = formData.get("password")?.toString();
    const terms = formData.get("terms")?.toString();

    // Echoed back on failure so the form does not empty itself
    const values = {
      companyName,
      contactPhone,
      province,
      firstName,
      lastName,
      email,
    };

    try {
      signupSchema.parse({
        companyName,
        contactPhone,
        province,
        firstName,
        lastName,
        email,
        password,
        terms,
      });

      const honeypotResult = validateHoneypot(formData, "company");
      if (honeypotResult.isBot) {
        logBotDetection(honeypotResult, getClientAddress(), "company-signup", {
          email,
          companyName,
          reason: honeypotResult.reason,
        });

        // Generic message so we do not advertise the anti-spam measures
        return fail(400, {
          error:
            "There was a problem with your submission. Please check your information and try again.",
          ...values,
        });
      }

      // Self-serve tenant creation is cheap to abuse, so limit by IP and email
      const clientIP = getClientAddress();
      const ipRateLimit = checkRateLimit("companySignup", clientIP);
      if (!ipRateLimit.allowed) {
        return fail(429, {
          error:
            "Too many signups from this connection. Please try again tomorrow or contact us directly.",
          ...values,
        });
      }

      // checkRateLimit detects an email identifier itself and applies emailLimit
      const emailRateLimit = checkRateLimit("companySignup", email!);
      if (!emailRateLimit.allowed) {
        return fail(429, {
          error:
            "A signup for this email is already being processed. Please contact us if you need help.",
          ...values,
        });
      }

      const existingUser = await getUserByEmail(email!);
      if (existingUser) {
        return fail(400, {
          error:
            "An account with this email already exists. Log in first, then contact us to register your company.",
          ...values,
        });
      }

      const { Argon2id } = await import("oslo/password");
      const hasher = new Argon2id();
      const hashedPassword = await hasher.hash(password!);

      const slug = await tenantService.generateUniqueSlug(companyName!);

      const newTenant = await tenantService.create({
        id: crypto.randomUUID(),
        name: companyName!,
        slug,
        contactEmail: email!,
        contactPhone: contactPhone || null,
        province: province || null,
        commissionRate: DEFAULT_COMMISSION_RATE,
        isActive: true,
        isPlatformOwner: false,
      });

      const userId = generateUserId();
      await db.insert(user).values({
        id: userId,
        email: email!,
        firstName: firstName!,
        lastName: lastName!,
        passwordHash: hashedPassword,
        // TENANT_ADMIN plus the membership below is what unlocks /admin
        role: "TENANT_ADMIN",
        phone: contactPhone || null,
      });

      await tenantService.addMember(newTenant.id, userId, "OWNER");

      // Log them straight in — the whole point of self-serve is no waiting
      const token = generateSessionToken();
      const session = await createSession(token, userId);
      setSessionTokenCookie(event, token, session.expiresAt);

      // Never let a mail failure undo a successful signup
      try {
        await sendTenantWelcomeEmail(email!, {
          firstName: firstName!,
          companyName: companyName!,
          commissionRate: DEFAULT_COMMISSION_RATE,
        });
      } catch (emailError) {
        console.error("Tenant welcome email failed:", emailError);
      }

      console.log(`Company signup complete: ${companyName} (${slug})`);
    } catch (error) {
      console.error("Company signup error:", error);

      if (error instanceof z.ZodError) {
        const errors = error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] || "Invalid input";
        return fail(400, { error: firstError, ...values });
      }

      if (error && typeof error === "object" && "code" in error) {
        if (error.code === "23505") {
          return fail(400, {
            error:
              "That email or company is already registered. Try logging in instead.",
            ...values,
          });
        }
      }

      return fail(500, {
        error: "Failed to create your company account. Please try again.",
        ...values,
      });
    }

    throw redirect(302, "/admin/dashboard");
  },
};
