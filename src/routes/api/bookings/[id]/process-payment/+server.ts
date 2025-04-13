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
    // Get data from request body
    const data = await request.json();
    const paymentStatus = data.paymentStatus || "COMPLETED";
    
    console.log(`Processing payment for booking ${bookingId} with status ${paymentStatus}`);
    
    // Verify the booking exists and is not cancelled
    const bookings = await db
      .select({ status: booking.status })
      .from(booking)
      .where(eq(booking.id, bookingId))
      .limit(1);
    
    if (bookings.length === 0) {
      return json({ error: "Booking not found" }, { status: 404 });
    }
    
    const bookingStatus = bookings[0].status;
    
    if (bookingStatus === "CANCELLED") {
      return json({ 
        success: false, 
        message: "Cannot process payment for cancelled booking" 
      });
    }
    
    // Run post-payment hooks with the provided payment status
    await postPaymentHooks.runAll(bookingId, paymentStatus);
    
    return json({ 
      success: true, 
      message: "Post-payment hooks executed successfully" 
    });
  } catch (error) {
    console.error(`Error processing payment for booking ${bookingId}:`, error);
    
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
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
};
