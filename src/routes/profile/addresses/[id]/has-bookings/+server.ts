// src/routes/api/addresses/[id]/has-bookings/+server.ts
import { db } from "$lib/server/db";
import { booking } from "$lib/server/db/schema";
import { error, json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

/**
 * API endpoint to check if an address has associated bookings
 * Used for the address deletion confirmation dialog
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  // Check authentication
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }

  const addressId = params.id;

  try {
    // Count bookings for this address
    const result = await db
      .select({ count: db.fn.count() })
      .from(booking)
      .where(eq(booking.addressId, addressId));

    const count = Number(result[0].count) || 0;
    
    return json({
      addressId,
      hasBookings: count > 0,
      bookingCount: count
    });
  } catch (err) {
    console.error('Error checking bookings for address:', { addressId, error: err });
    throw error(500, "Failed to check bookings for address");
  }
};
