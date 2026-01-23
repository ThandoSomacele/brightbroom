// src/routes/profile/bookings/+page.server.ts
import { db } from '$lib/server/db';
import { booking, address, payment } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

// Helper function to fetch user bookings
async function getUserBookings(userId: string) {
  return db.select({
    id: booking.id,
    status: booking.status,
    scheduledDate: booking.scheduledDate,
    duration: booking.duration,
    price: booking.price,
    notes: booking.notes,
    createdAt: booking.createdAt,
    guestAddress: booking.guestAddress, // For former guest bookings
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
    }
  })
  .from(booking)
  .leftJoin(address, eq(booking.addressId, address.id)) // Changed to leftJoin to include guest bookings
  .leftJoin(payment, eq(booking.id, payment.bookingId))
  .where(eq(booking.userId, userId))
  .orderBy(desc(booking.createdAt));
}

export const load: PageServerLoad = async ({ locals }) => {
  // Check if the user is logged in
  if (!locals.user) {
    throw redirect(302, '/auth/login?redirectTo=/profile/bookings');
  }

  return {
    streamed: {
      bookings: getUserBookings(locals.user.id)
    }
  };
};
