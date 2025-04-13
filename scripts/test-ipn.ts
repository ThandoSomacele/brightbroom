// scripts/test-ipn.ts
// Run with: npx tsx scripts/test-ipn.ts
import fetch from 'node-fetch';
import { db } from '../src/lib/server/db';
import { booking, payment } from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';

// Define which booking to test
const BOOKING_ID = 'ef979fca-0886-4c15-bff1-974d2f816644'; // Replace with your test booking ID

async function main() {
  try {
    console.log(`Testing IPN functionality for booking: ${BOOKING_ID}`);
    
    // First, get the booking and payment details
    const bookings = await db.select().from(booking).where(eq(booking.id, BOOKING_ID));
    
    if (bookings.length === 0) {
      console.error(`Booking not found: ${BOOKING_ID}`);
      process.exit(1);
    }
    
    const bookingData = bookings[0];
    console.log(`Found booking: ${bookingData.id} with status: ${bookingData.status}`);
    
    // Get payment record
    const payments = await db.select().from(payment).where(eq(payment.bookingId, BOOKING_ID));
    
    if (payments.length === 0) {
      console.error(`No payment record found for booking: ${BOOKING_ID}`);
      process.exit(1);
    }
    
    const paymentData = payments[0];
    console.log(`Found payment: ${paymentData.id} with status: ${paymentData.status}`);
    
    // Now simulate a PayFast IPN notification
    console.log("Simulating PayFast IPN notification...");
    
    // Create form data that mimics PayFast IPN
    const formData = new URLSearchParams();
    formData.append('m_payment_id', paymentData.id);
    formData.append('payment_status', 'COMPLETE');
    formData.append('custom_str1', bookingData.id);
    
    // Determine endpoint
    const endpoint = process.env.NODE_ENV === 'production' 
      ? 'https://brightbroom.com/.netlify/functions/payfast-ipn'
      : 'http://localhost:5173/api/payments/ipn';
    
    console.log(`Sending IPN notification to: ${endpoint}`);
    
    // Send the request
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const responseText = await response.text();
    console.log(`IPN Response Status: ${response.status}`);
    console.log(`IPN Response Body: ${responseText}`);
    
    // Wait for database to update
    console.log("Waiting for database updates...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if booking status was updated
    const updatedBookings = await db.select().from(booking).where(eq(booking.id, BOOKING_ID));
    const updatedBooking = updatedBookings[0];
    
    console.log(`Updated booking status: ${updatedBooking.status}`);
    
    // Check if payment status was updated
    const updatedPayments = await db.select().from(payment).where(eq(payment.id, paymentData.id));
    const updatedPayment = updatedPayments[0];
    
    console.log(`Updated payment status: ${updatedPayment.status}`);
    
    // Verify success
    if (updatedBooking.status === 'CONFIRMED' && updatedPayment.status === 'COMPLETED') {
      console.log("✅ Test successful! Both booking and payment status were updated correctly.");
    } else {
      console.log("❌ Test failed! Status updates were not applied correctly:");
      console.log(`Booking status: ${updatedBooking.status} (expected: CONFIRMED)`);
      console.log(`Payment status: ${updatedPayment.status} (expected: COMPLETED)`);
    }
    
  } catch (error) {
    console.error("Error during test:", error);
  } finally {
    // Disconnect from database
    process.exit(0);
  }
}

main();
