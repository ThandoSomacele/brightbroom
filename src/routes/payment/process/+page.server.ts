// src/routes/payment/process/+page.server.ts
import { error } from '@sveltejs/kit';
import { getGuestBookingData } from '$lib/server/guest-booking';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url, ...event }) => {
  // Get booking ID from query parameters
  const bookingId = url.searchParams.get('bookingId');
  
  // If we have a booking ID, that means payment is for an existing booking
  if (bookingId) {
    return {
      bookingId,
      isGuest: !locals.user
    };
  }
  
  // If no booking ID, check for guest booking data
  if (!locals.user) {
    const guestBookingData = getGuestBookingData(event);
    
    if (!guestBookingData.serviceId || !guestBookingData.scheduledDate) {
      throw error(400, 'No booking data found. Please start a new booking.');
    }
    
    return {
      bookingId: null,
      guestBookingData,
      isGuest: true
    };
  }
  
  // Authenticated user without booking ID - redirect to bookings
  throw error(400, 'No booking information found. Please select a booking to pay for.');
};