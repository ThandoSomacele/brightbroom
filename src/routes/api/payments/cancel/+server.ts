// src/routes/api/payments/cancel/+server.ts
import { db } from '$lib/server/db';
import { booking, payment, adminNote } from '$lib/server/db/schema';
import { error, json, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

/**
 * API handler for payment cancellations
 * This handles both direct API calls and PayFast redirect cancellations
 */
export const GET: RequestHandler = async ({ url }) => {
  // Get the booking ID from query params
  const bookingId = url.searchParams.get('booking_id');
  const paymentId = url.searchParams.get('m_payment_id');
  
  if (!bookingId && !paymentId) {
    // No booking or payment reference provided
    throw redirect(302, '/payment/cancel?error=missing_reference');
  }
  
  try {
    // Find the booking by ID or payment ID
    let bookingData;
    
    if (bookingId) {
      // Find by booking ID
      const results = await db
        .select()
        .from(booking)
        .where(eq(booking.id, bookingId))
        .limit(1);
      
      if (results.length > 0) {
        bookingData = results[0];
      }
    } else if (paymentId) {
      // Find by payment ID
      const paymentResults = await db
        .select()
        .from(payment)
        .where(eq(payment.id, paymentId))
        .limit(1);
      
      if (paymentResults.length > 0) {
        const paymentRecord = paymentResults[0];
        
        // Now get the associated booking
        const bookingResults = await db
          .select()
          .from(booking)
          .where(eq(booking.id, paymentRecord.bookingId))
          .limit(1);
        
        if (bookingResults.length > 0) {
          bookingData = bookingResults[0];
        }
      }
    }
    
    if (!bookingData) {
      // Booking not found
      throw redirect(302, '/payment/cancel?error=booking_not_found');
    }
    
    // Only update if the booking is in PENDING state
    // This prevents multiple cancellations from changing state again
    if (bookingData.status === 'PENDING') {
      // Update the booking status to CANCELLED
      await db.update(booking)
        .set({ 
          status: 'CANCELLED',
          updatedAt: new Date()
        })
        .where(eq(booking.id, bookingData.id));
      
      // Create an admin note about the cancellation
      await db.insert(adminNote).values({
        id: crypto.randomUUID(),
        bookingId: bookingData.id,
        content: 'Booking cancelled by customer via payment gateway',
        addedBy: 'System (PayFast Cancellation)',
        createdAt: new Date()
      });
      
      // Also update payment status if it exists
      if (paymentId) {
        await db.update(payment)
          .set({
            status: 'FAILED',
            updatedAt: new Date()
          })
          .where(eq(payment.id, paymentId));
      }
    }
    
    // Redirect to the cancellation page with booking ID
    throw redirect(302, `/payment/cancel?booking_id=${bookingData.id}&canceled=true`);
  } catch (error) {
    // If it's already a redirect, pass it through
    if (error.status === 302) {
      throw error;
    }
    
    console.error('Error processing payment cancellation:', error);
    throw redirect(302, '/payment/cancel?error=processing_error');
  }
};

/**
 * Handle POST requests for direct cancellations
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { bookingId } = data;
    
    if (!bookingId) {
      return json({ error: 'Booking ID is required' }, { status: 400 });
    }
    
    // Find the booking
    const results = await db
      .select()
      .from(booking)
      .where(eq(booking.id, bookingId))
      .limit(1);
    
    if (results.length === 0) {
      return json({ error: 'Booking not found' }, { status: 404 });
    }
    
    const bookingData = results[0];
    
    // Only update if the booking is in PENDING state
    if (bookingData.status === 'PENDING') {
      // Update the booking status to CANCELLED
      await db.update(booking)
        .set({ 
          status: 'CANCELLED',
          updatedAt: new Date()
        })
        .where(eq(booking.id, bookingId));
      
      // Create an admin note about the cancellation
      await db.insert(adminNote).values({
        id: crypto.randomUUID(),
        bookingId: bookingData.id,
        content: 'Booking cancelled by customer via API',
        addedBy: 'System (API Cancellation)',
        createdAt: new Date()
      });
      
      // Also update payment status if it exists
      const paymentResults = await db
        .select()
        .from(payment)
        .where(eq(payment.bookingId, bookingId))
        .limit(1);
      
      if (paymentResults.length > 0) {
        await db.update(payment)
          .set({
            status: 'FAILED',
            updatedAt: new Date()
          })
          .where(eq(payment.bookingId, bookingId));
      }
    }
    
    return json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Error processing payment cancellation:', error);
    return json({ 
      error: 'Failed to process cancellation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
