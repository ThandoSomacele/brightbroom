// src/routes/api/payments/success/+server.ts
import { db } from "$lib/server/db";
import { adminNote, payment } from "$lib/server/db/schema";
import { postPaymentHooks } from "$lib/server/hooks/post-payment-hooks";
import { processSuccessfulPayment } from "$lib/server/payment";
import { error, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";

/**
 * API handler for payment success redirects
 * This captures payment success from redirect and processes the payment
 */
export async function GET({ url, locals }) {
  try {
    // Get the booking ID from query params
    const bookingId = url.searchParams.get("booking_id");
    const paymentIdParam = url.searchParams.get("m_payment_id");

    if (!bookingId) {
      throw error(400, "Missing booking ID");
    }

    // Log the callback
    console.log('Payment success callback received for booking:', { bookingId });

    // Check if the user is authenticated
    if (!locals.user) {
      throw redirect(
        302,
        `/auth/login?redirectTo=${encodeURIComponent(`/payment/success?booking_id=${bookingId}`)}`,
      );
    }

    // Find the payment record for this booking
    const paymentRecord = await db
      .select()
      .from(payment)
      .where(eq(payment.bookingId, bookingId))
      .limit(1);

    if (paymentRecord.length === 0) {
      throw error(404, "Payment record not found");
    }

    const paymentData = paymentRecord[0];

    // If payment ID was specified in query params, verify it matches
    if (paymentIdParam && paymentIdParam !== paymentData.id) {
      console.warn('Payment ID mismatch:', {
        expected: paymentData.id,
        received: paymentIdParam
      });
    }

    // Check if the payment is already completed
    if (paymentData.status === "COMPLETED") {
      // Payment already processed, just redirect to success page
      throw redirect(302, `/payment/success?booking_id=${bookingId}`);
    }

    // Process the payment
    await processSuccessfulPayment(paymentData.id);

    // Create an admin note about the payment
    await db.insert(adminNote).values({
      id: crypto.randomUUID(),
      bookingId,
      content: 'Payment completed via redirect',
      // Note: paymentId logged separately for security
      addedBy: "System (Payment Redirect)",
      createdAt: new Date(),
    });

    // Run post-payment hooks to auto-assign a cleaner
    try {
      await postPaymentHooks.runAll(bookingId, "COMPLETED");
      console.log('Post-payment hooks completed for booking:', { bookingId });
    } catch (hookError) {
      console.error('Error in post-payment hooks for booking:', {
        bookingId,
        error: hookError
      });
    }

    // Redirect to the success page
    throw redirect(302, `/payment/success?booking_id=${bookingId}`);
  } catch (error) {
    // If it's already a redirect, just pass it through
    if (error.status === 302) {
      throw error;
    }

    console.error("Error processing payment success:", error);
    throw error;
  }
}
