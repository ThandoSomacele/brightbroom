// src/routes/api/payments/ipn/+server.ts
import {
  processSuccessfulPayment,
  validateIpnRequest,
} from "$lib/server/payment";
import { sendPaymentReceiptEmail, sendBookingConfirmationEmail } from "$lib/server/email-service";
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

    // Convert FormData to plain object with better logging
    const pfData: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      pfData[key] = value.toString();
    }

    // Enhanced logging - important for debugging
    console.log("PayFast IPN data received:", {
      payment_status: pfData.payment_status,
      m_payment_id: pfData.m_payment_id,
      pf_payment_id: pfData.pf_payment_id,
      item_name: pfData.item_name,
      amount_gross: pfData.amount_gross,
      custom_str1: pfData.custom_str1, // Often contains booking ID
    });

    // Get original query string for validation
    const pfParamString = new URLSearchParams(pfData).toString();

    // Validate the request is from PayFast
    const isValid = await validateIpnRequest(pfData, pfParamString);

    if (!isValid) {
      console.error("Invalid IPN request - validation failed");
      return new Response("OK"); // Still return 200 OK
    }

    console.log(`Valid IPN request - Payment status: ${pfData.payment_status}`);

    // Check payment status
    if (pfData.payment_status === "COMPLETE") {
      console.log(
        `Processing successful payment for ID: ${pfData.m_payment_id}`,
      );

      try {
        // Update payment and booking status
        const result = await processSuccessfulPayment(pfData.m_payment_id);
        console.log(
          "Payment processing result:",
          result ? "Success" : "Failed",
        );

        if (!result) {
          console.error(
            "processSuccessfulPayment returned null - check if payment ID exists in database",
          );
        } else {
          // Send receipt email
          const { booking, user } = result;
          if (user && user.email) {
            // Create combined payment details for the receipt email
            const paymentDetails = {
              id: pfData.m_payment_id,
              createdAt: new Date(),
              amount: booking.price,
              booking,
              user,
              paymentMethod: "CREDIT_CARD", // Default or get from payment record
              vatRate: 15 // Default VAT rate for South Africa
            };
            
            // Send payment receipt email
            const receiptSent = await sendPaymentReceiptEmail(user.email, paymentDetails);
            console.log(`Payment receipt email ${receiptSent ? 'sent' : 'failed to send'} to ${user.email}`);
            
            // Send booking confirmation email if not already sent
            const confirmationSent = await sendBookingConfirmationEmail(user.email, booking);
            console.log(`Booking confirmation email ${confirmationSent ? 'sent' : 'failed to send'} to ${user.email}`);
          } else {
            console.error("User email not available for sending receipt");
          }
        }
      } catch (processError) {
        console.error("Error processing payment:", processError);
      }
    } else {
      console.log(`Payment not complete. Status: ${pfData.payment_status}`);
    }

    // Return 200 OK to acknowledge receipt
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing IPN:", error);
    return new Response("OK", { status: 200 }); // Always return 200 to PayFast
  }
};

export const OPTIONS: RequestHandler = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
