// src/routes/api/payments/process/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createPaymentForBooking } from '$lib/server/payment';
import { db } from '$lib/server/db';
import { booking } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
  // Check if user is authenticated
  if (!locals.user) {
    console.error('Unauthorized payment process attempt');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const data = await request.json();
    const { bookingId } = data;
    
    if (!bookingId) {
      console.error('Missing booking ID in payment process request');
      return json({ error: 'Booking ID is required' }, { status: 400 });
    }

    console.log(`Processing payment for booking: ${bookingId}`);

    // Verify the booking exists and belongs to the user
    const bookingResult = await db.select()
      .from(booking)
      .where(
        eq(booking.id, bookingId)
      )
      .limit(1);

    if (!bookingResult || bookingResult.length === 0) {
      console.error(`Booking not found: ${bookingId}`);
      return json({ error: 'Booking not found' }, { status: 404 });
    }

    const bookingData = bookingResult[0];

    // Verify the booking belongs to the logged-in user
    if (bookingData.userId !== locals.user.id) {
      console.error(`Unauthorized access to booking: ${bookingId}`);
      return json({ error: 'Unauthorized access to booking' }, { status: 403 });
    }

    // Create payment and get redirect URL
    const result = await createPaymentForBooking(bookingId);
    
    console.log(`Payment created successfully for booking: ${bookingId}`);
    console.log(`Redirecting to PayFast URL`);
    
    return json(result);
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