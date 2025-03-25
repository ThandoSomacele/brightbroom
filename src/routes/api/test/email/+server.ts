// src/routes/api/test/email/+server.ts
import { json } from '@sveltejs/kit';
import { sendTestEmail } from '$lib/server/email-testing';
import type { RequestHandler } from './$types';

// Ensure we only expose this endpoint in development
export const GET: RequestHandler = async ({ url }) => {
  // Safety check - only expose in development
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not found', { status: 404 });
  }

  // Get email parameters from query string
  const to = url.searchParams.get('to');
  const type = url.searchParams.get('type') as any;

  // Validate parameters
  if (!to || !type) {
    return json({ 
      error: 'Missing required parameters',
      usage: '/api/test/email?to=your@email.com&type=welcome|password-reset|booking-confirmation|reminder'
    }, { status: 400 });
  }

  // Send the test email
  const result = await sendTestEmail(type, to);

  if (!result.success) {
    return json({ error: result.error }, { status: 500 });
  }

  return json({ 
    success: true, 
    message: `Test ${type} email sent to ${to}`,
    id: result.id
  });
};
