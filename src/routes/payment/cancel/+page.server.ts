// src/routes/payment/cancel/+page.server.ts
import { db } from '$lib/server/db';
import { booking, service, address } from '$lib/server/db/schema';
import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
  // Get the booking ID from query parameters
  const bookingId = url.searchParams.get('booking_id');
  const wasError = url.searchParams.get('error');
  const wasCanceled = url.searchParams.has('canceled');
  
  // If no booking ID is provided, return basic data for the UI
  if (!bookingId) {
    return {
      bookingId: null,
      userCanceled: wasCanceled,
      error: wasError || null
    };
  }
  
  try {
    // Fetch the booking with service and address details
    const results = await db
      .select({
        booking: {
          id: booking.id,
          status: booking.status,
          scheduledDate: booking.scheduledDate,
          price: booking.price,
          createdAt: booking.createdAt,
          userId: booking.userId
        },
        service: {
          name: service.name
        },
        address: {
          street: address.street,
          city: address.city
        }
      })
      .from(booking)
      .innerJoin(service, eq(booking.serviceId, service.id))
      .innerJoin(address, eq(booking.addressId, address.id))
      .where(eq(booking.id, bookingId))
      .limit(1);
    
    if (results.length === 0) {
      return {
        bookingId,
        bookingFound: false,
        userCanceled: wasCanceled,
        error: "Booking not found"
      };
    }
    
    const bookingData = results[0];
    
    // Check if user is logged in and if this is their booking
    if (locals.user && bookingData.booking.userId !== locals.user.id) {
      return {
        bookingId,
        bookingFound: false,
        unauthorized: true,
        userCanceled: wasCanceled,
        error: "Unauthorized access to booking"
      };
    }
    
    // Return the booking data needed for the cancel page
    return {
      bookingId,
      bookingData,
      bookingFound: true,
      userCanceled: wasCanceled,
      error: wasError
    };
  } catch (err) {
    console.error('Error loading cancelled booking details:', err);
    return {
      bookingId,
      bookingFound: false,
      error: 'Failed to load booking details',
      userCanceled: wasCanceled
    };
  }
};
