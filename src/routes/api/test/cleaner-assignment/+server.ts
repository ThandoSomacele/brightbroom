// src/routes/api/test/cleaner-assignment/+server.ts
import { json } from '@sveltejs/kit';
import { sendCleanerAssignmentEmail } from '$lib/server/email-service';
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
      usage: '/api/test/cleaner-assignment?to=your@email.com'
    }, { status: 400 });
  }

  // Create sample data for testing
  const testBookingDetails = {
    id: "test-booking-" + Date.now().toString(),
    service: { 
      id: "service-123",
      name: "Regular Home Cleaning"
    },
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    address: {
      street: "123 Test Street",
      city: "Cape Town",
      state: "Western Cape",
      zipCode: "8001"
    },
    cleaner: {
      firstName: "James",
      lastName: "Smith",
      phone: "+27123456789"
    }
  };

  // Send test cleaner assignment email
  const success = await sendCleanerAssignmentEmail(to, testBookingDetails);

  if (!success) {
    return json({ error: 'Failed to send test cleaner assignment email' }, { status: 500 });
  }

  return json({ 
    success: true, 
    message: `Test cleaner assignment email sent to ${to}`
  });
};
