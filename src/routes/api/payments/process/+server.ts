// src/routes/api/payments/process/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createPaymentForBooking } from '$lib/server/payment';

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = await locals.auth.validate();
  
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { bookingId } = await request.json();
    
    if (!bookingId) {
      return json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const result = await createPaymentForBooking(bookingId);
    
    return json(result);
  } catch (error) {
    console.error('Payment processing error:', error);
    return json({ error: 'Failed to process payment' }, { status: 500 });
  }
};

// src/routes/api/payments/ipn/+server.ts
import { validateIpnRequest, processSuccessfulPayment } from '$lib/server/payment';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  // Read form data from PayFast IPN
  const formData = await request.formData();
  
  // Convert FormData to plain object
  const pfData: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    pfData[key] = value.toString();
  }
  
  // Get original query string for validation
  const pfParamString = new URLSearchParams(pfData).toString();
  
  try {
    // Validate the request is from PayFast
    const isValid = await validateIpnRequest(pfData, pfParamString);
    
    if (!isValid) {
      console.error('Invalid IPN request');
      return new Response('Invalid request', { status: 400 });
    }
    
    // Check payment status
    if (pfData.payment_status === 'COMPLETE') {
      // Update payment and booking status
      await processSuccessfulPayment(pfData.m_payment_id);
    }
    
    return new Response('OK');
  } catch (error) {
    console.error('Error processing IPN:', error);
    return new Response('Server error', { status: 500 });
  }
};
