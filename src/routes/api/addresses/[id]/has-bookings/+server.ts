// src/routes/api/addresses/[id]/has-bookings/+server.ts
import { db } from "$lib/server/db";
import { address, booking } from "$lib/server/db/schema";
import { json } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

/**
 * Check if an address has any associated bookings
 * This is used to warn users before deleting an address
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  // Check authentication
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: addressId } = params;

  if (!addressId) {
    return json({ error: "Address ID is required" }, { status: 400 });
  }

  try {
    // First verify the address belongs to the current user
    const [userAddress] = await db
      .select({ id: address.id })
      .from(address)
      .where(and(eq(address.id, addressId), eq(address.userId, locals.user.id)))
      .limit(1);

    if (!userAddress) {
      return json({ error: "Address not found" }, { status: 404 });
    }

    // Check if there are any bookings associated with this address
    const [bookingCount] = await db
      .select({ count: booking.id })
      .from(booking)
      .where(eq(booking.addressId, addressId))
      .limit(1);

    const hasBookings = !!bookingCount;

    return json({ hasBookings });
  } catch (error) {
    console.error("Error checking address bookings:", error);
    return json({ error: "Failed to check address bookings" }, { status: 500 });
  }
};
