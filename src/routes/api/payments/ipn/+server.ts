// src/routes/api/payments/ipn/+server.ts
import { db } from "$lib/server/db";
import { adminNote, booking, payment } from "$lib/server/db/schema";
import { postPaymentHooks } from "$lib/server/hooks/post-payment-hooks";
import {
  processSuccessfulPayment,
  validateIpnRequest,
} from "$lib/server/payment";
import { json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";

/**
 * IPN (Instant Payment Notification) handler for PayFast
 * This endpoint receives payment confirmations from PayFast
 */
export async function POST({ request }) {
  try {
    // Log that we received an IPN request
    console.log("Received IPN request from PayFast");

    // Get the raw request body to validate it
    const rawBody = await request.text();

    // Parse the form data
    const formData = new URLSearchParams(rawBody);
    const pfData: Record<string, string> = {};

    // Convert FormData to a plain object
    for (const [key, value] of formData.entries()) {
      pfData[key] = value;
    }

    // Log the IPN data (excluding sensitive information)
    const sanitizedData = { ...pfData };
    delete sanitizedData.signature;
    console.log("IPN data received:", sanitizedData);

    // Validate the IPN request
    const isValidIpn = await validateIpnRequest(pfData, rawBody);

    if (!isValidIpn) {
      console.error("Invalid IPN request, ignoring");
      return json(
        { status: "error", message: "Invalid IPN request" },
        { status: 400 },
      );
    }

    // Extract the important values
    const paymentId = pfData.m_payment_id;
    const paymentStatus = pfData.payment_status;
    const bookingId = pfData.custom_str1;

    // Log the payment status
    console.log(`Payment status for ${paymentId}: ${paymentStatus}`);

    // Check if the payment record exists
    const paymentRecord = await db
      .select()
      .from(payment)
      .where(eq(payment.id, paymentId))
      .limit(1);

    if (!paymentRecord || paymentRecord.length === 0) {
      console.error(`Payment record not found: ${paymentId}`);
      return json(
        { status: "error", message: "Payment record not found" },
        { status: 404 },
      );
    }

    // Handle different payment statuses
    if (paymentStatus === "COMPLETE") {
      // Process the payment
      const result = await processSuccessfulPayment(paymentId);

      // Verify booking is not cancelled before triggering hooks
      const bookingStatus = await db
        .select({ status: booking.status })
        .from(booking)
        .where(eq(booking.id, bookingId))
        .limit(1);

      if (bookingStatus.length > 0 && bookingStatus[0].status !== "CANCELLED") {
        // Only run hooks if booking is not cancelled
        postPaymentHooks.runAll(bookingId).catch((error) => {
          console.error(`Error running post-payment hooks: ${error}`);
        });
      }
    } else if (paymentStatus === "FAILED") {
      // Update payment status to failed
      await db
        .update(payment)
        .set({
          status: "FAILED",
          updatedAt: new Date(),
        })
        .where(eq(payment.id, paymentId));

      // Create an admin note about the failed payment
      await db.insert(adminNote).values({
        id: crypto.randomUUID(),
        bookingId,
        content: `Payment failed via PayFast (ID: ${paymentId})`,
        addedBy: "System (PayFast IPN)",
        createdAt: new Date(),
      });

      return json({ status: "success", message: "Payment failure recorded" });
    } else {
      // Unknown or pending status
      console.log(
        `Unhandled payment status: ${paymentStatus}, no action taken`,
      );
      return json({
        status: "success",
        message: "IPN received, no action taken",
      });
    }
  } catch (error) {
    console.error("Error processing IPN:", error);
    return json(
      { status: "error", message: "Server error processing IPN" },
      { status: 500 },
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
