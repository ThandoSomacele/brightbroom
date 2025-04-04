// src/routes/profile/addresses/+page.server.ts
import { MAX_ADDRESSES } from "$lib/constants/address";
import { db } from "$lib/server/db";
import { address } from "$lib/server/db/schema";
import { addressService } from "$lib/server/services/address.service";
import { error, fail, redirect } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  // Check if user is logged in
  if (!locals.user) {
    throw redirect(302, "/auth/login?redirectTo=/profile/addresses");
  }

  try {
    // Get the user's active addresses (excludes soft-deleted addresses)
    const addresses = await addressService.getUserAddresses(locals.user.id);

    // Check if there's an error parameter in the URL
    const errorMessage = url.searchParams.get("error");
    let error = null;

    if (errorMessage === "limit_reached") {
      error = `You have reached the maximum limit of ${MAX_ADDRESSES} addresses. Please delete an existing address before adding a new one.`;
    }

    // Check if there's a success message
    const successMessage = url.searchParams.get("success");
    let success = null;
    
    if (successMessage === "deleted") {
      success = "Address was successfully deleted.";
    } else if (successMessage === "default_updated") {
      success = "Default address was updated successfully.";
    }

    return {
      addresses,
      error,
      success,
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
      // Use our improved deleteAddress method which handles soft deletion
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
