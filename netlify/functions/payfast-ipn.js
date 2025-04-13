// netlify/functions/payfast-ipn.js
const postgres = require('postgres');
const { drizzle } = require('drizzle-orm/postgres-js');
const { eq } = require('drizzle-orm');
const { randomUUID } = require('crypto');

// Define simplified schema for the function
const schema = {
  payment: {
    id: { name: 'id' },
    bookingId: { name: 'booking_id' },
    status: { name: 'status' },
    updatedAt: { name: 'updated_at' }
  },
  booking: {
    id: { name: 'id' },
    status: { name: 'status' },
    updatedAt: { name: 'updated_at' }
  },
  adminNote: {
    id: { name: 'id' },
    bookingId: { name: 'booking_id' },
    content: { name: 'content' },
    addedBy: { name: 'added_by' },
    createdAt: { name: 'created_at' }
  }
};

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
    
    console.log(`Processing payment: ${paymentId} for booking: ${bookingId} with status: ${paymentStatus}`);
    
    // Only process if payment is COMPLETE
    if (paymentStatus === 'COMPLETE') {
      try {
        // Initialize database connection
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
          throw new Error('DATABASE_URL environment variable is not set');
        }
        
        console.log("Connecting to database...");
        client = postgres(connectionString);
        const db = drizzle(client);
        
        // Update payment status to COMPLETED
        console.log(`Updating payment status for ID: ${paymentId}`);
        await db.execute(`
          UPDATE payment 
          SET status = 'COMPLETED', updated_at = NOW() 
          WHERE id = $1
        `, [paymentId]);
        
        // Update booking status to CONFIRMED
        console.log(`Updating booking status for ID: ${bookingId}`);
        await db.execute(`
          UPDATE booking 
          SET status = 'CONFIRMED', updated_at = NOW() 
          WHERE id = $1
        `, [bookingId]);
        
        // Create admin note about the payment
        console.log("Creating admin note");
        const noteId = randomUUID();
        await db.execute(`
          INSERT INTO admin_note (id, booking_id, content, added_by, created_at)
          VALUES ($1, $2, $3, $4, NOW())
        `, [
          noteId,
          bookingId,
          `Payment completed via PayFast IPN (ID: ${paymentId})`,
          'System (Netlify Function)'
        ]);
        
        console.log("Database updates completed successfully");
      } catch (dbError) {
        console.error("Database error:", dbError);
        // We'll still return 200 to acknowledge receipt to PayFast
      } finally {
        if (client) {
          await client.end();
          console.log("Database connection closed");
        }
      }
    } else {
      console.log(`Ignoring payment with status: ${paymentStatus}`);
    }
    
    // Always return 200 to acknowledge receipt
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
