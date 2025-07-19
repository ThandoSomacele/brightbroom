// src/routes/profile/bookings/+page.server.ts
import { db } from '$lib/server/db';
import { booking, service, address, payment } from '$lib/server/db/schema';
import { error, redirect } from '@sveltejs/kit';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Check if the user is logged in
  if (!locals.user) {
    throw redirect(302, '/auth/login?redirectTo=/profile/bookings');
  }
  
  try {
    // Get all the user's bookings (including former guest bookings)
    const bookings = await db.select({
      id: booking.id,
      status: booking.status,
      scheduledDate: booking.scheduledDate,
      duration: booking.duration,
      price: booking.price,
      notes: booking.notes,
      createdAt: booking.createdAt,
      guestAddress: booking.guestAddress, // For former guest bookings
      service: {
        id: service.id,
        name: service.name,
        description: service.description,
      },
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
    .innerJoin(service, eq(booking.serviceId, service.id))
    .leftJoin(address, eq(booking.addressId, address.id)) // Changed to leftJoin to include guest bookings
    .leftJoin(payment, eq(booking.id, payment.bookingId))
    .where(eq(booking.userId, locals.user.id))
    .orderBy(desc(booking.createdAt));
    
    return {
      bookings
    };
  } catch (err) {
    console.error('Error loading bookings:', err);
    throw error(500, 'Failed to load bookings');
  }
};
