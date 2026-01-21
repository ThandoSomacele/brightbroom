// src/routes/api/test/subscription-email/+server.ts
import { json } from '@sveltejs/kit';
import { getSubscriptionActivatedTemplate } from '$lib/server/email-templates';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { Resend } from 'resend';

// Initialise Resend with API key from environment variable
const RESEND_API_KEY = env.RESEND_API_KEY;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// The sender email address
const FROM_EMAIL = 'BrightBroom <notifications@brightbroom.com>';

// Email config for templates
const EMAIL_CONFIG = {
  appUrl: env.PUBLIC_URL || 'https://brightbroom.com',
  brandName: 'BrightBroom',
  primaryColor: '#20C3AF',
  secondaryColor: '#C2511F',
};

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
      usage: '/api/test/subscription-email?to=your@email.com'
    }, { status: 400 });
  }

  // Create sample data for testing with all subscription details
  const testSubscriptionDetails = {
    id: 'test-subscription-' + Date.now().toString(),
    service: {
      name: 'General Clean'
    },
    frequency: 'WEEKLY',
    finalPrice: 522.00,
    preferredDays: ['MONDAY', 'WEDNESDAY'],
    preferredTimeSlot: '09:00 - 12:00',
    nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    // Room-based pricing details
    bedroomCount: 3,
    bathroomCount: 2,
    // Add-ons with names and prices
    addons: [
      { name: 'Oven Deep Clean', price: 120.00 },
      { name: 'Fridge Clean', price: 60.00 }
    ],
    // Duration in minutes
    durationMinutes: 240,
    // Discount info
    discountPercentage: 10,
    basePrice: 580.00
  };

  // Generate the email template
  const template = getSubscriptionActivatedTemplate(to, testSubscriptionDetails, EMAIL_CONFIG);

  // Send test subscription email
  if (!resend) {
    return json({ error: 'Resend API key not configured' }, { status: 500 });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Resend API error:', error);
      return json({ error: 'Failed to send test subscription email', details: error }, { status: 500 });
    }

    return json({
      success: true,
      message: `Test subscription confirmation email sent to ${to}`,
      emailId: data.id
    });
  } catch (err) {
    console.error('Error sending test subscription email:', err);
    return json({
      error: 'Failed to send test subscription email',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
};
