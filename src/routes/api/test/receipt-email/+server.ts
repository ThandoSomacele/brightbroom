// src/routes/api/test/receipt-email/+server.ts
import { json } from '@sveltejs/kit';
import { sendPaymentReceiptEmail } from '$lib/server/email-service';
import type { RequestHandler } from './$types';

// Ensure we only expose this endpoint in development
export const GET: RequestHandler = async ({ url }) => {
  // Safety check - only expose in development
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not found', { status: 404 });
  }

  // Get email parameter from query string
  const to = url.searchParams.get('to');

  // Validate parameters
  if (!to) {
    return json({ 
      error: 'Missing email address',
      usage: '/api/test/receipt-email?to=your@email.com'
    }, { status: 400 });
  }

  // Create sample data for testing
  const testPaymentDetails = {
    id: "test-payment-" + Date.now().toString(),
    createdAt: new Date(),
    amount: 350.00,
    booking: {
      id: "test-booking-123",
      service: { 
        name: "Regular Home Cleaning",
        description: "Standard cleaning service for your home"
      },
      scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      address: {
        street: "123 Test Street",
        city: "Cape Town",
        state: "Western Cape",
        zipCode: "8001"
      },
      duration: 120 // 2 hours
    },
    user: {
      firstName: "Test",
      lastName: "User",
    },
    paymentMethod: "Credit Card",
    vatRate: 15
  };

  // Send test receipt email
  const success = await sendPaymentReceiptEmail(to, testPaymentDetails);

  if (!success) {
    return json({ error: 'Failed to send test receipt email' }, { status: 500 });
  }

  return json({ 
    success: true, 
    message: `Test receipt email sent to ${to}`,
  });
};
