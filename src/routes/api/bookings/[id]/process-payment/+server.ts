// src/routes/api/bookings/[id]/process-payment/+server.ts
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { postPaymentHooks } from "$lib/server/hooks/post-payment-hooks";
import { db } from "$lib/server/db";
import { booking } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";


/**
 * Endpoint to trigger post-payment processing for a booking
 * This is called by the Netlify function after it updates the database
 */
export const POST: RequestHandler = async ({ params, request }) => {
  const bookingId = params.id;
  
  if (!bookingId) {
    return json({ error: "Booking ID is required" }, { status: 400 });
  }
  
  try {
    console.log(`[PROCESS PAYMENT] Endpoint called for booking ${bookingId}`);
    
    // Get data from request body
    const data = await request.json();
    const paymentStatus = data.paymentStatus || "COMPLETED";
    
    console.log(`[PROCESS PAYMENT] Processing with status ${paymentStatus} for booking ${bookingId}`);
    
    // Verify the booking exists and is not cancelled
    const bookings = await db
      .select({ status: booking.status })
      .from(booking)
      .where(eq(booking.id, bookingId))
      .limit(1);
    
    if (bookings.length === 0) {
      console.error(`[PROCESS PAYMENT] Booking not found: ${bookingId}`);
      return json({ error: "Booking not found" }, { status: 404 });
    }
    
    const bookingStatus = bookings[0].status;
    console.log(`[PROCESS PAYMENT] Current booking status: ${bookingStatus}`);
    
    if (bookingStatus === "CANCELLED") {
      console.log(`[PROCESS PAYMENT] Cannot process payment for cancelled booking: ${bookingId}`);
      return json({ 
        success: false, 
        message: "Cannot process payment for cancelled booking" 
      });
    }
    
    // Run post-payment hooks with the provided payment status
    console.log(`[PROCESS PAYMENT] Invoking post-payment hooks with status: ${paymentStatus}`);
    
    // Extra logging to troubleshoot the hook
    try {
      console.log(`[PROCESS PAYMENT] pre runAll() check`);
      if (!postPaymentHooks || typeof postPaymentHooks.runAll !== 'function') {
        console.error(`[PROCESS PAYMENT] postPaymentHooks is not properly defined: `, postPaymentHooks);
        return json({ 
          success: false, 
          message: "Post-payment hooks not properly defined" 
        }, { status: 500 });
      }
    } catch (checkError) {
      console.error(`[PROCESS PAYMENT] Error checking postPaymentHooks:`, checkError);
    }
    
    try {
      await postPaymentHooks.runAll(bookingId, paymentStatus);
      console.log(`[PROCESS PAYMENT] Post-payment hooks completed for booking ${bookingId}`);
    } catch (hooksError) {
      console.error(`[PROCESS PAYMENT] Error in post-payment hooks:`, hooksError);
      return json({ 
        success: false, 
        message: `Error in post-payment hooks: ${hooksError instanceof Error ? hooksError.message : 'Unknown error'}` 
      }, { status: 500 });
    }
    
    return json({ 
      success: true, 
      message: "Post-payment hooks executed successfully" 
    });
  } catch (error) {
    console.error(`[PROCESS PAYMENT] Error processing payment for booking ${bookingId}:`, error);
    
    return json({ 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
};

// Allow OPTIONS for CORS preflight
export const OPTIONS: RequestHandler = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
};
