// src/routes/profile/addresses/+page.server.ts
import { MAX_ADDRESSES } from "$lib/constants/address";
import { db } from "$lib/server/db";
import { address } from "$lib/server/db/schema";
import { addressService } from "$lib/server/services/address.service"; // Add this import
import { error, fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  // Check if user is logged in
  if (!locals.user) {
    throw redirect(302, "/auth/login?redirectTo=/profile/addresses");
  }

  try {
    // Get the user's addresses
    const addresses = await db
      .select()
      .from(address)
      .where(eq(address.userId, locals.user.id))
      .orderBy(address.isDefault, { direction: "desc" }); // Default addresses first

    // Check if there's an error parameter in the URL
    const errorMessage = url.searchParams.get("error");
    let error = null;

    if (errorMessage === "limit_reached") {
      error = `You have reached the maximum limit of ${MAX_ADDRESSES} addresses. Please delete an existing address before adding a new one.`;
    }

    return {
      addresses,
      error,
      maxAddresses: MAX_ADDRESSES,
      hasReachedLimit: addresses.length >= MAX_ADDRESSES,
    };
  } catch (err) {
    console.error("Error loading addresses:", err);
    throw error(500, "Failed to load addresses");
  }
};

export const actions: Actions = {
  setDefault: async ({ request, locals }) => {
    // Check if user is logged in
    if (!locals.user) {
      return fail(401, {
        error: "You must be logged in to perform this action",
      });
    }

    const formData = await request.formData();
    const addressId = formData.get("addressId")?.toString();

    if (!addressId) {
      return fail(400, { error: "Address ID is required" });
    }

    try {
      const updatedAddress = await addressService.setDefaultAddress(
        locals.user.id,
        addressId,
      );

      if (!updatedAddress) {
        return fail(404, { error: "Address not found" });
      }

      return {
        success: "Default address updated successfully",
      };
    } catch (err) {
      console.error("Error setting default address:", err);
      return fail(500, { error: "Failed to update default address" });
    }
  },

  deleteAddress: async ({ request, locals }) => {
    // Check if user is logged in
    if (!locals.user) {
      return fail(401, {
        error: "You must be logged in to perform this action",
      });
    }

    const formData = await request.formData();
    const addressId = formData.get("addressId")?.toString();

    if (!addressId) {
      return fail(400, { error: "Address ID is required" });
    }

    try {
      const result = await addressService.deleteAddress(
        locals.user.id,
        addressId,
      );

      if (!result.success) {
        return fail(400, { error: result.error });
      }

      return {
        success: "Address deleted successfully",
      };
    } catch (err) {
      console.error("Error deleting address:", err);
      return fail(500, { error: "Failed to delete address" });
    }
  },
};
