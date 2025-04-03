// src/routes/profile/addresses/new/+page.server.ts
import { db } from "$lib/server/db";
import { address } from "$lib/server/db/schema";
import { fail, redirect } from "@sveltejs/kit";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";

// Validate user is authenticated
export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, "/auth/login?redirectTo=/profile/addresses/new");
  }

  return {};
};

// Define schema for validation
const addressSchema = z.object({
  street: z.string().min(3, "Street address is too short"),
  aptUnit: z.string().optional(),
  city: z.string().min(2, "City name is too short"),
  state: z.string().min(2, "Province is required"),
  zipCode: z.string().regex(/^\d{4,5}$/, "Postal code must be 4-5 digits"),
  instructions: z.string().optional(),
  isDefault: z.union([z.literal("on"), z.boolean()]).optional(),
  redirectTo: z.string().optional(),
});

export const actions: Actions = {
  createAddress: async ({ request, locals }) => {
    // Check if user is authenticated
    if (!locals.user) {
      return fail(401, { error: "You must be logged in to add an address" });
    }

    const formData = await request.formData();
    const rawData = Object.fromEntries(formData.entries());

    // Transform 'on' from checkbox to boolean
    const isDefault = rawData.isDefault === "on" || rawData.isDefault === true;
    const redirectTo = rawData.redirectTo?.toString() || "/profile/addresses";

    try {
      // Validate input
      const validatedData = addressSchema.parse({
        ...rawData,
        isDefault,
      });

      // If making this the default address, unset existing defaults
      if (isDefault) {
        await db
          .update(address)
          .set({ isDefault: false })
          .where((eb) => eb.eq(address.userId, locals.user.id));
      }

      // Create new address
      await db.insert(address).values({
        id: crypto.randomUUID(),
        userId: locals.user.id,
        street: validatedData.street,
        aptUnit: validatedData.aptUnit || null,
        city: validatedData.city,
        state: validatedData.state,
        zipCode: validatedData.zipCode,
        instructions: validatedData.instructions || null,
        isDefault: isDefault,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`Address created successfully for user: ${locals.user.id}`);

      // Return a success result with redirect info instead of throwing
      return {
        success: true,
        redirect: redirectTo,
      };
    } catch (error) {
      console.error("Error creating address:", error);

      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        const firstError =
          Object.values(fieldErrors)[0]?.[0] || "Validation error";

        return fail(400, {
          error: firstError,
          ...rawData,
        });
      }

      // Handle other errors
      return fail(500, {
        error: "Failed to create address. Please try again.",
        ...rawData,
      });
    }
  },
};
