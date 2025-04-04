// src/routes/profile/addresses/new/+page.server.ts
import { db } from "$lib/server/db";
import { address } from "$lib/server/db/schema";
import {
  addressService,
  MAX_ADDRESSES,
} from "$lib/server/services/address.service";
import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  // Check if user is logged in
  if (!locals.user) {
    throw redirect(302, "/auth/login?redirectTo=/profile/addresses/new");
  }

  // Get redirect URL if it exists
  const redirectTo = url.searchParams.get("redirectTo") || "/profile/addresses";

  try {
    // Get current addresses and check limit
    const addresses = await db
      .select()
      .from(address)
      .where(eq(address.userId, locals.user.id));

    const hasReachedLimit = addresses.length >= MAX_ADDRESSES;

    // If limit is reached, redirect with error message
    if (hasReachedLimit) {
      throw redirect(302, "/profile/addresses?error=limit_reached");
    }

    return {
      redirectTo,
      addresses,
      maxAddresses: MAX_ADDRESSES,
      hasReachedLimit: addresses.length >= MAX_ADDRESSES,
      remainingAddresses: Math.max(0, MAX_ADDRESSES - addresses.length),
    };
  } catch (err) {
    // If this is already a redirect, just rethrow it
    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }

    console.error("Error loading address data:", err);
    return {
      redirectTo,
      addresses: [],
      maxAddresses: MAX_ADDRESSES,
      hasReachedLimit: false,
      remainingAddresses: MAX_ADDRESSES,
    };
  }
};

export const actions: Actions = {
  createAddress: async ({ request, locals, url }) => {
    // Check if user is logged in
    if (!locals.user) {
      throw redirect(302, "/auth/login");
    }

    // Check if user has reached address limit
    const hasReachedLimit = await addressService.hasReachedAddressLimit(
      locals.user.id,
    );
    if (hasReachedLimit) {
      return fail(400, {
        error: `You have reached the maximum limit of ${MAX_ADDRESSES} addresses. Please delete an existing address before adding a new one.`,
      });
    }

    // Process form data
    const formData = await request.formData();
    const street = formData.get("street")?.toString();
    const aptUnit = formData.get("aptUnit")?.toString() || null;
    const city = formData.get("city")?.toString();
    const state = formData.get("state")?.toString();
    const zipCode = formData.get("zipCode")?.toString();
    const instructions = formData.get("instructions")?.toString() || null;
    const isDefault = formData.get("isDefault") === "on";

    // Get redirect URL if provided
    const redirectTo =
      formData.get("redirectTo")?.toString() ||
      url.searchParams.get("redirectTo") ||
      "/profile/addresses";

    // Validate required fields
    if (!street || !city || !state || !zipCode) {
      return fail(400, {
        error: "Please fill in all required fields",
        values: {
          street,
          aptUnit,
          city,
          state,
          zipCode,
          instructions,
          isDefault,
          redirectTo,
        },
      });
    }

    try {
      // Create the address using our service
      await addressService.createAddress(locals.user.id, {
        street,
        aptUnit,
        city,
        state,
        zipCode,
        instructions,
        isDefault,
      });

      // Redirect to the appropriate page
      throw redirect(303, redirectTo);
    } catch (err) {
      console.error("Error creating address:", err);

      // Check if this is a limit error
      const errorMessage =
        err instanceof Error && err.message.includes("Maximum limit")
          ? err.message
          : "Failed to create address";

      return fail(400, {
        error: errorMessage,
        values: {
          street,
          aptUnit,
          city,
          state,
          zipCode,
          instructions,
          isDefault,
          redirectTo,
        },
      });
    }
  },
};
