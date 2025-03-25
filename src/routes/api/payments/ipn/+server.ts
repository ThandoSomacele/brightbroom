// src/routes/api/payments/ipn/+server.ts
import { sendBookingConfirmationEmail } from "$lib/server/email-service";
import {
  processSuccessfulPayment,
  validateIpnRequest,
} from "$lib/server/payment";
import type { RequestHandler } from "./$types";

/**
 * Handle Instant Payment Notification (IPN) from PayFast
 * This endpoint receives callbacks from PayFast after payment is processed
 */
export const POST: RequestHandler = async ({ request }) => {
  console.log("Received IPN request from PayFast");

  try {
    // Read form data from PayFast IPN
    const formData = await request.formData();

    // Convert FormData to plain object for logging and processing
    const pfData: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      pfData[key] = value.toString();
    }

    // Log payment data (excluding sensitive info)
    console.log("PayFast IPN data received:", {
      payment_status: pfData.payment_status,
      m_payment_id: pfData.m_payment_id,
      pf_payment_id: pfData.pf_payment_id,
      item_name: pfData.item_name,
      amount_gross: pfData.amount_gross,
    });

    // Get original query string for validation
    const pfParamString = new URLSearchParams(pfData).toString();

    // Validate the request is from PayFast
    const isValid = await validateIpnRequest(pfData, pfParamString);

    if (!isValid) {
      console.error("Invalid IPN request - validation failed");
      return new Response("Invalid request", { status: 400 });
    }

    console.log(`Valid IPN request - Payment status: ${pfData.payment_status}`);

    // Check payment status
    if (pfData.payment_status === "COMPLETE") {
      console.log(`Processing successful payment for: ${pfData.m_payment_id}`);

      // Update payment and booking status
      const result = await processSuccessfulPayment(pfData.m_payment_id);

      // Send confirmation email if payment was processed successfully
      if (result && result.booking && result.user) {
        await sendBookingConfirmationEmail(result.user.email, result.booking);
      }

      console.log("Payment processed successfully");
    } else {
      console.log(`Payment not complete. Status: ${pfData.payment_status}`);
    }

    // Return 200 OK to acknowledge receipt
    return new Response("OK");
  } catch (error) {
    console.error("Error processing IPN:", error);

    // Always return 200 to PayFast even if processing fails
    // This prevents PayFast from retrying, and we can handle issues separately
    return new Response("OK");
  }
};
