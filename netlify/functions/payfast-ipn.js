// netlify/functions/payfast-ipn.js
const postgres = require("postgres");
const { randomUUID } = require("crypto");

// Modified function in netlify/functions/payfast-ipn.js

exports.handler = async (event, context) => {
  console.log("[NETLIFY IPN] PayFast IPN Handler invoked", {
    method: event.httpMethod,
    path: event.path,
  });

  // Handle OPTIONS requests for CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  // For GET requests, just confirm the endpoint is working
  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      body: "PayFast IPN endpoint is operational. POST requests are required for IPN processing.",
    };
  }

  // Log the request details
  console.log("[NETLIFY IPN] Request body:", event.body);

  let client;

  try {
    // Parse the IPN data
    const formData = new URLSearchParams(event.body);
    const paymentData = {};

    // Convert FormData to object
    for (const [key, value] of formData.entries()) {
      paymentData[key] = value;
    }

    // Extract key information
    const paymentId = paymentData.m_payment_id;
    const paymentStatus = paymentData.payment_status;
    const bookingId = paymentData.custom_str1;

    console.log(
      `[NETLIFY IPN] Processing payment: ${paymentId} for booking: ${bookingId} with status: ${paymentStatus}`,
    );

    // Only process if payment is COMPLETE
    if (paymentStatus === "COMPLETE") {
      try {
        // Initialize database connection
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
          throw new Error("DATABASE_URL environment variable is not set");
        }

        console.log("[NETLIFY IPN] Connecting to database...");
        client = postgres(connectionString, {
          ssl: { rejectUnauthorized: false },
        });

        // Update payment status to COMPLETED
        console.log(`[NETLIFY IPN] Updating payment status for ID: ${paymentId}`);
        await client`
          UPDATE payment 
          SET status = 'COMPLETED', updated_at = NOW() 
          WHERE id = ${paymentId}
        `;

        // Update booking status to CONFIRMED - THIS IS THE CRITICAL PART
        console.log(`[NETLIFY IPN] Updating booking status for ID: ${bookingId}`);
        await client`
          UPDATE booking 
          SET status = 'CONFIRMED', updated_at = NOW() 
          WHERE id = ${bookingId}
        `;

        // Create admin note about the payment
        console.log("[NETLIFY IPN] Creating admin note");
        const noteId = randomUUID();
        await client`
          INSERT INTO admin_note (id, booking_id, content, added_by, created_at)
          VALUES (${noteId}, ${bookingId}, ${`Payment completed via PayFast IPN (ID: ${paymentId})`}, ${"System (Netlify Function)"}, NOW())
        `;

        console.log("[NETLIFY IPN] Database updates completed successfully");
      } catch (dbError) {
        console.error("[NETLIFY IPN] Database error:", dbError);
        // We'll still return 200 to acknowledge receipt to PayFast
      } finally {
        if (client) {
          await client.end();
          console.log("[NETLIFY IPN] Database connection closed");
        }
      }

      // Call the SvelteKit API to trigger hooks
      try {
        console.log("[NETLIFY IPN] Triggering post-payment hooks via API call");
        
        // Define both possible API URLs
        const prodBaseUrl = process.env.URL || process.env.DEPLOY_URL || "https://brightbroom.com";
        const apiUrl = process.env.NODE_ENV === "production"
          ? `${prodBaseUrl}/api/bookings/${bookingId}/process-payment`
          : `http://localhost:5173/api/bookings/${bookingId}/process-payment`;
        
        console.log(`[NETLIFY IPN] Calling API: ${apiUrl}`);
        
        // Use node-fetch or similar to make the request
        const fetch = require("node-fetch");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentId,
            paymentStatus: "COMPLETED", // Explicitly set to COMPLETED
          }),
        });

        if (response.ok) {
          console.log("[NETLIFY IPN] Post-payment hooks triggered successfully");
        } else {
          console.error(
            "[NETLIFY IPN] Failed to trigger post-payment hooks. Status:",
            response.status,
            "Response:",
            await response.text(),
          );
          
          // Fallback: Try the alternate URL format 
          // (this is critical for some Netlify deployments)
          console.log("[NETLIFY IPN] Trying alternate API URL format as fallback");
          
          // Try with /.netlify/functions/handler path prefix
          const alternateUrl = process.env.NODE_ENV === "production"
            ? `${prodBaseUrl}/.netlify/functions/handler/api/bookings/${bookingId}/process-payment`
            : `http://localhost:8888/.netlify/functions/handler/api/bookings/${bookingId}/process-payment`;
          
          console.log(`[NETLIFY IPN] Fallback API: ${alternateUrl}`);
          
          try {
            const fallbackResponse = await fetch(alternateUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                paymentId,
                paymentStatus: "COMPLETED",
              }),
            });
            
            if (fallbackResponse.ok) {
              console.log("[NETLIFY IPN] Fallback hooks call succeeded");
            } else {
              console.error(
                "[NETLIFY IPN] Fallback API call also failed:",
                fallbackResponse.status,
              );
            }
          } catch (fallbackError) {
            console.error("[NETLIFY IPN] Error in fallback API call:", fallbackError);
          }
        }
      } catch (hookError) {
        console.error("[NETLIFY IPN] Error triggering post-payment hooks:", hookError);
        // Don't fail the entire request if hooks fail
      }
    } else {
      console.log(`[NETLIFY IPN] Ignoring payment with status: ${paymentStatus}`);
    }

    // Always return 200 to acknowledge receipt
    return {
      statusCode: 200,
      body: "IPN received successfully",
    };
  } catch (error) {
    console.error("[NETLIFY IPN] Error processing:", error);

    // Still return 200 to acknowledge receipt
    return {
      statusCode: 200,
      body: "IPN received (with processing error)",
    };
  }
};
