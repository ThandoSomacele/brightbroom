// src/routes/api/payments/ipn/+server.ts
import { db } from "$lib/server/db";
import { adminNote, booking, payment } from "$lib/server/db/schema";
import { postPaymentHooks } from "$lib/server/hooks/post-payment-hooks";
import { validateIpnRequest } from "$lib/server/payment";
import { json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";


/**
 * IPN (Instant Payment Notification) handler for PayFast
 * This endpoint receives payment confirmations from PayFast
 */
export async function POST({ request }) {
  try {
    // Enhanced logging for debugging
    console.log("[IPN] Received PayFast notification", {
      url: request.url,
      method: request.method,
    });

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
    console.log("[IPN] Data received:", sanitizedData);

    // Extract the important values
    const paymentId = pfData.m_payment_id;
    const paymentStatus = pfData.payment_status;
    const bookingId = pfData.custom_str1;

    // Log the key information
    console.log(
      `[IPN] Processing: Payment ID: ${paymentId}, Status: ${paymentStatus}, Booking ID: ${bookingId}`,
    );

    // Check if the payment record exists
    const paymentRecords = await db
      .select()
      .from(payment)
      .where(eq(payment.id, paymentId))
      .limit(1);

    if (!paymentRecords || paymentRecords.length === 0) {
      console.error(`[IPN] Payment record not found: ${paymentId}`);
      return json(
        { status: "error", message: "Payment record not found" },
        { status: 404 },
      );
    }

    // Validate IPN with relaxed requirements in non-production environments
    let isValidIpn = false;
    try {
      isValidIpn = await validateIpnRequest(pfData, rawBody);
    } catch (validationError) {
      console.warn("[IPN] Validation error:", validationError);
      // In development or testing, we might want to proceed anyway
      if (process.env.NODE_ENV !== "production") {
        console.log(
          "[IPN] Non-production environment - proceeding despite validation error",
        );
        isValidIpn = true;
      }
    }

    if (!isValidIpn && process.env.NODE_ENV === "production") {
      console.error("[IPN] Invalid request, ignoring");
      return json(
        { status: "error", message: "Invalid IPN request" },
        { status: 400 },
      );
    }

    // Handle different payment statuses
    if (paymentStatus === "COMPLETE") {
      console.log(
        `[IPN] Processing completed payment: ${paymentId} for booking: ${bookingId}`,
      );

      try {
        // Update payment status to COMPLETED
        await db
          .update(payment)
          .set({
            status: "COMPLETED",
            updatedAt: new Date(),
          })
          .where(eq(payment.id, paymentId));

        console.log(`[IPN] Updated payment status to COMPLETED for ID: ${paymentId}`);

        // Update booking status to CONFIRMED
        await db
          .update(booking)
          .set({
            status: "CONFIRMED",
            updatedAt: new Date(),
          })
          .where(eq(booking.id, bookingId));

        console.log(`[IPN] Updated booking status to CONFIRMED for ID: ${bookingId}`);

        // Create admin note about successful payment
        await db.insert(adminNote).values({
          id: crypto.randomUUID(),
          bookingId: bookingId,
          content: `Payment completed via PayFast IPN (ID: ${paymentId})`,
          addedBy: "System (PayFast IPN)",
          createdAt: new Date(),
        });

        console.log(`[IPN] Created admin note for booking ${bookingId}`);

        // Run post-payment hooks directly in the same process (more reliable)
        try {
          console.log(`[IPN] Running post-payment hooks directly for booking ${bookingId}`);
          await postPaymentHooks.runAll(bookingId, "COMPLETED");
          console.log(
            `[IPN] Successfully ran post-payment hooks for booking ${bookingId}`,
          );
        } catch (hooksError) {
          console.error(`[IPN] Error running post-payment hooks: ${hooksError}`);
          // Don't fail the entire request if hooks fail
        }

        return json({
          status: "success",
          message: "Payment processed successfully",
        });
      } catch (dbError) {
        console.error("[IPN] Database error processing payment:", dbError);
        return json(
          { status: "error", message: "Database error processing payment" },
          { status: 500 },
        );
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
        `[IPN] Unhandled payment status: ${paymentStatus}, no action taken`,
      );
      return json({
        status: "success",
        message: "IPN received, no action taken",
      });
    }
  } catch (error) {
    console.error("[IPN] Error processing:", error);
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

// Add GET handler for testing the endpoint
export async function GET() {
  return new Response(
    "PayFast IPN endpoint is operational. POST requests are required for IPN processing.",
    {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    },
  );
}
