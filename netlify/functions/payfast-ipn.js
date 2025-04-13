// netlify/functions/payfast-ipn.js
const postgres = require('postgres');
const { drizzle } = require('drizzle-orm/postgres-js');
const { eq } = require('drizzle-orm');

exports.handler = async (event, context) => {
  console.log("PayFast IPN Handler invoked", {
    method: event.httpMethod,
    path: event.path,
  });

  // Handle OPTIONS requests for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
  }

  // Log the request details
  console.log("PayFast IPN request body:", event.body);
  
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
    
    console.log(`Processing payment: ${paymentId} for booking: ${bookingId} with status: ${paymentStatus}`);
    
    // Even if we can't update the database right now, acknowledge receipt
    return {
      statusCode: 200,
      body: "IPN received successfully"
    };
  } catch (error) {
    console.error("Error processing PayFast IPN:", error);
    
    // Still return 200 to acknowledge receipt
    return {
      statusCode: 200,
      body: "IPN received (with processing error)"
    };
  }
}
