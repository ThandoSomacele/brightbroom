// src/routes/api/admin/bookings/[id]/send-confirmation/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { booking, address, user } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { sendBookingConfirmationEmail } from '$lib/server/email-service';

export const POST: RequestHandler = async ({ params, request, locals }) => {
  // Check if user is admin
  if (!locals.user || locals.user.role !== 'ADMIN') {
    return json({ error: 'Unauthorized' }, { status: 403 });
  }

  const bookingId = params.id;
  
  try {
    // Parse request body to get optional email override
    const body = await request.json();
    const overrideEmail = body.email; // Optional override for email
    
    // Get booking details along with all required information for the email
    const results = await db.select({
      booking: booking,
      address: {
        street: sql<string>`coalesce(${address.street}, ${booking.guestAddress}->>'street', '(guest address)')`,
        city: sql<string>`coalesce(${address.city}, ${booking.guestAddress}->>'city', '')`,
        state: sql<string>`coalesce(${address.state}, ${booking.guestAddress}->>'state', '')`,
        zipCode: sql<string>`coalesce(${address.zipCode}, ${booking.guestAddress}->>'zipCode', '')`
      },
      user: {
        firstName: sql<string>`coalesce(${user.firstName}, 'Guest')`,
        lastName: sql<string>`coalesce(${user.lastName}, '')`,
        email: user.email
      }
    })
    .from(booking)
    .where(eq(booking.id, bookingId))
    .leftJoin(address, eq(booking.addressId, address.id))
    .leftJoin(user, eq(booking.userId, user.id))
    .limit(1);
    
    if (results.length === 0) {
      return json({ error: 'Booking not found' }, { status: 404 });
    }
    
    const result = results[0];
    
    // Prepare email data
    const bookingData = {
      id: result.booking.id,
      service: { name: "General Clean" },
      scheduledDate: result.booking.scheduledDate,
      address: result.address,
      price: result.booking.price,
      bedroomCount: result.booking.bedroomCount || undefined,
      bathroomCount: result.booking.bathroomCount || undefined,
    };
    
    // Use override email if provided, otherwise use user's email
    const emailTo = overrideEmail || result.user?.email;
    if (!emailTo) {
      return json({ error: 'This booking has no customer email; supply an override address' }, { status: 400 });
    }
    
    // Send confirmation email
    const success = await sendBookingConfirmationEmail(emailTo, bookingData);
    
    if (!success) {
      return json({ 
        success: false, 
        error: 'Failed to send email' 
      }, { status: 500 });
    }
    
    return json({ 
      success: true,
      message: 'Booking confirmation email sent',
      emailTo
    });
  } catch (error) {
    console.error('Error sending booking confirmation:', { bookingId, error });
    return json({ 
      success: false, 
      error: 'Failed to send booking confirmation email' 
    }, { status: 500 });
  }
};
