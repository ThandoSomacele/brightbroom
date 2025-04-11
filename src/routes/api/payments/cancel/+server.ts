// src/routes/api/payments/cancel/+server.ts
import { db } from "$lib/server/db";
import { payment, booking, adminNote } from "$lib/server/db/schema";
import { error, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";

/**
 * API handler for payment cancellation redirects
 * This captures payment cancellations from the payment provider
 */
export async function GET({ url, locals }) {
  try {
    // Get the booking ID from query params
    const bookingId = url.searchParams.get("booking_id") || 
                    url.searchParams.get("m_payment_id") ||
                    url.searchParams.get("custom_str1");
    
    if (!bookingId) {
      throw error(400, "Missing booking ID");
    }
    
    // Log the callback
    console.log(`Payment cancellation callback received for booking: ${bookingId}`);
    
    // Check if the user is authenticated
    if (!locals.user) {
      throw redirect(302, `/auth/login?redirectTo=/payment/cancel?bookingId=${bookingId}`);
    }
    
    // Find the payment record for this booking
    const paymentRecord = await db
      .select()
      .from(payment)
      .where(eq(payment.bookingId, bookingId))
      .limit(1);
    
    // Find booking info
    const bookingRecord = await db
      .select()
      .from(booking)
      .where(eq(booking.id, bookingId))
      .limit(1);
      
    // If payment record exists, update it to cancelled/failed status
    if (paymentRecord.length > 0) {
      const paymentData = paymentRecord[0];
      
      // Only update if not already completed
      if (paymentData.status !== "COMPLETED") {
        await db
          .update(payment)
          .set({
            status: "FAILED",
            updatedAt: new Date()
          })
          .where(eq(payment.id, paymentData.id));
        
        // Create an admin note about the payment cancellation
        await db.insert(adminNote).values({
          id: crypto.randomUUID(),
          bookingId,
          content: `Payment cancelled by user (ID: ${paymentData.id})`,
          addedBy: "System (Payment Redirect)",
          createdAt: new Date(),
        });
      }
    }
    
    // Get error details if available
    const errorCode = url.searchParams.get("error_code") || "";
    const errorMessage = url.searchParams.get("error_message") || "";
    
    // Redirect to the cancellation page
    let redirectUrl = `/payment/cancel?bookingId=${bookingId}`;
    if (errorCode) redirectUrl += `&error_code=${errorCode}`;
    if (errorMessage) redirectUrl += `&error_message=${encodeURIComponent(errorMessage)}`;
    
    throw redirect(302, redirectUrl);
  } catch (error) {
    // If it's already a redirect, just pass it through
    if (error.status === 302) {
      throw error;
    }
    
    console.error("Error processing payment cancellation:", error);
    throw error;
  }
};
