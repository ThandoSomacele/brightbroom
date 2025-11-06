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
  
  // If no booking ID, check for guest booking data (from cookies)
  // This handles both guest users and newly authenticated users who just logged in
  const guestBookingData = getGuestBookingData(event);

  // Check if we have valid booking data for either one-time or recurring bookings
  const hasOneTimeBookingData = guestBookingData.serviceId && guestBookingData.scheduledDate;
  const hasRecurringBookingData = guestBookingData.serviceId && guestBookingData.isRecurring && guestBookingData.recurringFrequency;

  if (hasOneTimeBookingData || hasRecurringBookingData) {
    return {
      bookingId: null,
      guestBookingData,
      isGuest: !locals.user // False if user just logged in, true if still a guest
    };
  }

  // No booking data found at all
  throw error(400, 'No booking information found. Please start a new booking.');
};