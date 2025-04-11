// src/routes/payment/cancel/+page.server.ts
import { db } from '$lib/server/db';
import { booking } from '$lib/server/db/schema';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
  // Get the booking ID from query parameters
  const bookingId = url.searchParams.get('booking_id');
  
  // If no booking ID is provided, return empty data
  // The client-side will handle this case
  if (!bookingId) {
    return {
      bookingId: null,
      userCanceled: url.searchParams.has('canceled')
    };
  }
  
  try {
    // Check if user is logged in
    if (!locals.user) {
      // Even if not logged in, we want to maintain the booking ID in the query params
      return {
        bookingId,
        userCanceled: true
      };
    }
    
    // Verify the booking exists and belongs to the user
    const bookingData = await db
      .select()
      .from(booking)
      .where(eq(booking.id, bookingId))
      .limit(1);
    
    if (bookingData.length === 0) {
      console.error(`Booking not found: ${bookingId}`);
      return {
        bookingId,
        bookingFound: false,
        userCanceled: true
      };
    }
    
    // Verify the booking belongs to the user
    if (bookingData[0].userId !== locals.user.id) {
      console.error(`Unauthorized access to booking: ${bookingId}`);
      return {
        bookingId,
        bookingFound: false,
        unauthorized: true,
        userCanceled: true
      };
    }
    
    // Return the booking data needed for the cancel page
    return {
      bookingId,
      bookingData: bookingData[0],
      bookingFound: true,
      userCanceled: true
    };
  } catch (err) {
    console.error('Error processing payment cancellation:', err);
    return {
      bookingId,
      bookingFound: false,
      error: 'Failed to process cancellation',
      userCanceled: true
    };
  }
};
