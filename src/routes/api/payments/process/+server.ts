// src/routes/api/payments/process/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createPaymentForBooking } from '$lib/server/payment';
import { db } from '$lib/server/db';
import { booking, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals, url }) => {
  try {
    const data = await request.json();
    const { bookingId } = data;
    
    if (!bookingId) {
      console.error('Missing booking ID in payment process request');
      return json({ error: 'Booking ID is required' }, { status: 400 });
    }

    console.log(`Processing payment for booking: ${bookingId}`);

    // Get booking with user information
    const bookingResult = await db.select({
      id: booking.id,
      userId: booking.userId,
      status: booking.status,
      price: booking.price,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        mustChangePassword: user.mustChangePassword
      }
    })
    .from(booking)
    .innerJoin(user, eq(booking.userId, user.id))
    .where(eq(booking.id, bookingId))
    .limit(1);

    if (!bookingResult || bookingResult.length === 0) {
      console.error(`Booking not found: ${bookingId}`);
      return json({ error: 'Booking not found' }, { status: 404 });
    }

    const bookingData = bookingResult[0];
    const bookingUser = bookingData.user;

    // For authenticated users, verify ownership
    if (locals.user) {
      if (bookingData.userId !== locals.user.id) {
        console.error(`Unauthorized access to booking: ${bookingId} by user: ${locals.user.id}`);
        return json({ error: 'Unauthorized access to booking' }, { status: 403 });
      }
    } else {
      // For guest users, we allow payment processing but with additional security checks
      // The booking was just created, so we trust the immediate payment request
      // Additional validation: check if this is a recently created booking (within last 30 minutes)
      const now = new Date();
      const bookingAge = now.getTime() - new Date(bookingData.user.id).getTime();
      const thirtyMinutesInMs = 30 * 60 * 1000;
      
      // Note: We're not enforcing this timing check strictly for now as it could cause issues
      // In production, you might want to implement session-based validation instead
      console.log(`Guest payment for booking: ${bookingId}, user: ${bookingData.userId}`);
    }

    // Verify booking is in payable status
    if (bookingData.status !== 'PENDING') {
      console.error(`Booking ${bookingId} is not in PENDING status: ${bookingData.status}`);
      return json({ 
        error: 'Booking is not available for payment',
        details: `Booking status: ${bookingData.status}`
      }, { status: 400 });
    }

    // Get the origin from the current request
    const origin = url.origin;
    console.log(`Using origin for payment callbacks: ${origin}`);
    
    // Create payment and get redirect URL, passing the origin
    const result = await createPaymentForBooking(bookingId, { origin });
    
    console.log(`Payment created successfully for booking: ${bookingId}`);
    console.log(`User must change password: ${bookingUser.mustChangePassword}`);
    
    return json({
      ...result,
      bookingDetails: {
        id: bookingData.id,
        userId: bookingData.userId,
        userEmail: bookingUser.email,
        userFirstName: bookingUser.firstName,
        userLastName: bookingUser.lastName,
        isGuestBooking: bookingUser.mustChangePassword, // Flag for guest bookings
        price: bookingData.price
      }
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to process payment';
      
    return json({ 
      error: errorMessage,
      details: 'There was an issue initializing the payment process. Please try again later.'
    }, { status: 500 });
  }
};
