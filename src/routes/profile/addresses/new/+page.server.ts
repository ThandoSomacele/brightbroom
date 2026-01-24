// src/routes/profile/addresses/new/+page.server.ts
import {
  addressService,
  MAX_ADDRESSES,
} from "$lib/server/services/address.service";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  // Check if user is logged in
  if (!locals.user) {
    throw redirect(302, "/auth/login?redirectTo=/profile/addresses/new");
  }

  // Get redirect URL if it exists
  const redirectTo = url.searchParams.get("redirectTo") || "/profile/addresses";

  try {
    // Get current ACTIVE addresses using the address service
    const addresses = await addressService.getUserAddresses(locals.user.id);
    const hasReachedLimit = await addressService.hasReachedAddressLimit(locals.user.id);

    // If limit is reached, redirect with error message
    if (hasReachedLimit) {
      throw redirect(302, "/profile/addresses?error=limit_reached");
    }

    return {
      redirectTo,
      addresses,
      maxAddresses: MAX_ADDRESSES,
      hasReachedLimit,
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
    const formattedAddress = formData.get("formattedAddress")?.toString() || "";
    let street = formData.get("street")?.toString() || "";
    const aptUnit = formData.get("aptUnit")?.toString() || null;
    let city = formData.get("city")?.toString() || "";
    let state = formData.get("state")?.toString() || "";
    let zipCode = formData.get("zipCode")?.toString() || "";
    const instructions = formData.get("instructions")?.toString() || null;
    const isDefault = formData.get("isDefault") === "on";
    // Get latitude and longitude if provided
    const lat = formData.get("lat")
      ? parseFloat(formData.get("lat")?.toString() || "0")
      : null;
    const lng = formData.get("lng")
      ? parseFloat(formData.get("lng")?.toString() || "0")
      : null;

    // Get redirect URL if provided
    const redirectTo =
      formData.get("redirectTo")?.toString() ||
      url.searchParams.get("redirectTo") ||
      "/profile/addresses";

    // Use formatted address as fallback for missing fields (Uber-like experience)
    if (!street && formattedAddress) {
      // Extract first part of formatted address as street
      const addressParts = formattedAddress.split(",");
      street = addressParts[0]?.trim() || formattedAddress;
    }

    // For South African addresses, extract city/state from formatted address if missing
    if (formattedAddress) {
      const parts = formattedAddress.split(",").map(p => p.trim());
      if (!city && parts.length > 1) {
        city = parts[1] || "Unknown";
      }
      if (!state) {
        state = parts.find(p => p.includes("Gauteng") || p.includes("Province")) || "Gauteng";
      }
      if (!zipCode) {
        // Find numeric part that looks like a postal code
        const postalMatch = formattedAddress.match(/\b\d{4}\b/);
        zipCode = postalMatch ? postalMatch[0] : "0000";
      }
    }

    // Validate - only require that we have coordinates (proves Google selection)
    if (!lat || !lng) {
      return fail(400, {
        error: "Please select an address from the Google Maps suggestions",
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
        lat,
        lng
      });
    
      // Redirect to the appropriate page
      throw redirect(303, redirectTo);
    } catch (err) {
      // Check if this is a redirect
      if (err && typeof err === 'object' && 'status' in err) {
        // This is a redirect, not an error - rethrow it
        throw err;
      }
      
      console.error("Error creating address:", err);
      
      // Check if this is a limit error
      const errorMessage = err instanceof Error && err.message.includes("Maximum limit")
        ? err.message
        : "Failed to create address";
        
      return fail(400, { 
        error: errorMessage,
        values: { 
          street, aptUnit, city, state, zipCode, 
          instructions, isDefault, redirectTo 
        }
      });
    }
  },
};
