// src/routes/api/test/booking-email/+server.ts
import { json } from '@sveltejs/kit';
import { sendBookingConfirmationEmail } from '$lib/server/email-service';
import type { RequestHandler } from './$types';

// Ensure we only expose this endpoint in development
export const GET: RequestHandler = async ({ url }) => {
  // Safety check - only expose in development
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not found', { status: 404 });
  }

  // Get email parameters from query string
  const to = url.searchParams.get('to');

  // Validate parameters
  if (!to) {
    return json({ 
      error: 'Missing email address',
      usage: '/api/test/booking-email?to=your@email.com'
    }, { status: 400 });
  }

  // Create sample data for testing
  const testBookingDetails = {
    id: "test-booking-" + Date.now().toString(),
    service: { 
      name: "Regular Home Cleaning",
      description: "Standard cleaning service for your home"
    },
    scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    price: 350.00,
    address: {
      street: "123 Test Street",
      city: "Cape Town",
      state: "Western Cape",
      zipCode: "8001"
    }
  };

  // Send test booking confirmation email
  const success = await sendBookingConfirmationEmail(to, testBookingDetails);

  if (!success) {
    return json({ error: 'Failed to send test booking email' }, { status: 500 });
  }

  return json({ 
    success: true, 
    message: `Test booking confirmation email sent to ${to}`,
  });
};
