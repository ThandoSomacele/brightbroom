// netlify/functions/payfast-ipn.js
const postgres = require('postgres');
const { drizzle } = require('drizzle-orm/postgres-js');
const { eq } = require('drizzle-orm');

// Import schema definitions (create a simplified version for the function)
const schema = {
  payment: {
    id: { name: 'id' },
    status: { name: 'status' },
    bookingId: { name: 'booking_id' },
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
  // Log the request for debugging
  console.log('IPN Request received:', {
    method: event.httpMethod,
    headers: event.headers
  });

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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Create database connection
  let db;
  let client;

  try {
    // Parse the request body
    const formData = new URLSearchParams(event.body);
    const paymentData = {};
    
    // Convert FormData to object
    for (const [key, value] of formData.entries()) {
      paymentData[key] = value;
    }
    
    // Log sanitized payment data (excluding signature)
    const logData = { ...paymentData };
    delete logData.signature;
    console.log('Payment data received:', logData);

    // Extract key information
    const paymentId = paymentData.m_payment_id;
    const paymentStatus = paymentData.payment_status;
    const bookingId = paymentData.custom_str1;
    
    if (!paymentId || !bookingId) {
      console.error('Missing required payment data');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required payment data' })
      };
    }

    // Initialize PostgreSQL client and Drizzle
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    client = postgres(connectionString);
    db = drizzle(client, { schema });
    
    // Process the payment based on status
    if (paymentStatus === 'COMPLETE') {
      console.log(`Processing successful payment for booking: ${bookingId}`);
      
      // Update payment record
      await db.update(schema.payment)
        .set({ 
          status: 'COMPLETED',
          updatedAt: new Date()
        })
        .where(eq(schema.payment.id, paymentId));
      
      // Update booking status to CONFIRMED
      await db.update(schema.booking)
        .set({ 
          status: 'CONFIRMED',
          updatedAt: new Date()
        })
        .where(eq(schema.booking.id, bookingId));
        
      // Add admin note about the payment
      await db.insert(schema.adminNote)
        .values({
          id: crypto.randomUUID(),
          bookingId,
          content: `Payment completed via PayFast IPN (ID: ${paymentId})`,
          addedBy: 'System (Netlify Function)',
          createdAt: new Date()
        });
      
      console.log(`Successfully processed payment for booking: ${bookingId}`);
    } else if (paymentStatus === 'FAILED') {
      console.log(`Recording failed payment for booking: ${bookingId}`);
      
      // Update payment status to failed
      await db.update(schema.payment)
        .set({ 
          status: 'FAILED',
          updatedAt: new Date()
        })
        .where(eq(schema.payment.id, paymentId));
        
      // Add admin note about the failed payment
      await db.insert(schema.adminNote)
        .values({
          id: crypto.randomUUID(),
          bookingId,
          content: `Payment failed via PayFast IPN (ID: ${paymentId})`,
          addedBy: 'System (Netlify Function)',
          createdAt: new Date()
        });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'success', message: 'IPN processed successfully' })
    };
  } catch (error) {
    console.error('Error processing IPN:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  } finally {
    // Close database connection
    if (client) {
      await client.end();
    }
  }
};
