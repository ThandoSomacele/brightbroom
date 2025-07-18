// src/routes/book/payment/+page.server.ts
import { error, redirect } from '@sveltejs/kit';
import { getGuestBookingData } from '$lib/server/guest-booking';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url, ...event }) => {
  // Get booking ID from query parameters
  const bookingId = url.searchParams.get('bookingId');
  
  // If user is already authenticated, redirect to payment processing
  if (locals.user) {
    const redirectUrl = bookingId ? `/payment/process?bookingId=${bookingId}` : '/payment/process';
    throw redirect(302, redirectUrl);
  }
  
  // Get guest booking data
  const guestBookingData = getGuestBookingData(event);
  
  // Check if we have valid booking data
  if (!guestBookingData.serviceId || !guestBookingData.scheduledDate) {
    throw error(400, 'No booking data found. Please start a new booking.');
  }
  
  return {
    bookingData: guestBookingData,
    bookingId,
    isGuest: true
  };
};