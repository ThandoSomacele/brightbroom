// src/routes/profile/bookings/[id]/+page.server.ts
import { db } from "$lib/server/db";
import {
  address,
  booking,
  bookingAddon,
  addon,
  payment,
  user,
} from "$lib/server/db/schema";
import { error, redirect } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
  // Check if the user is logged in
  if (!locals.user) {
    throw redirect(
      302,
      `/auth/login?redirectTo=/profile/bookings/${params.id}`,
    );
  }

  const bookingId = params.id;

  try {
    // Get the booking details
    const results = await db
      .select({
        id: booking.id,
        status: booking.status,
        scheduledDate: booking.scheduledDate,
        duration: booking.duration,
        price: booking.price,
        notes: booking.notes,
        createdAt: booking.createdAt,
        guestAddress: booking.guestAddress,
        bedroomCount: booking.bedroomCount,
        bathroomCount: booking.bathroomCount,
        address: {
          id: address.id,
          street: address.street,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
        },
        payment: {
          id: payment.id,
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          createdAt: payment.createdAt,
        },
        cleaner: booking.cleanerId
          ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
            }
          : null,
      })
      .from(booking)
      .leftJoin(address, eq(booking.addressId, address.id)) // Changed to leftJoin for guest bookings
      .leftJoin(payment, eq(booking.id, payment.bookingId))
      .leftJoin(
        user,
        booking.cleanerId ? eq(booking.cleanerId, user.id) : undefined,
      )
      .where(and(eq(booking.id, bookingId), eq(booking.userId, locals.user.id)))
      .limit(1);

    if (results.length === 0) {
      throw error(404, "Booking not found");
    }

    const bookingDetail = results[0];

    // Get booking addons
    const addons = await db
      .select({
        id: bookingAddon.id,
        priceAtBooking: bookingAddon.priceAtBooking,
        durationAtBooking: bookingAddon.durationAtBooking,
        addon: {
          id: addon.id,
          name: addon.name,
          description: addon.description,
        },
      })
      .from(bookingAddon)
      .leftJoin(addon, eq(bookingAddon.addonId, addon.id))
      .where(eq(bookingAddon.bookingId, bookingId));

    return {
      booking: {
        ...bookingDetail,
        addons,
      },
    };
  } catch (err) {
    console.error("Error loading booking details:", err);
    if (err instanceof Error && err.message === "Booking not found") {
      throw error(404, "Booking not found");
    }
    throw error(500, "Failed to load booking details");
  }
};
