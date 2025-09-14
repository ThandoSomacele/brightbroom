// src/routes/api/bookings/[id]/send-reminder/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { booking, service, address, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { sendBookingReminderEmail } from '$lib/server/email-service';

export const POST: RequestHandler = async ({ params, request, locals }) => {
  // Check if user is admin - we'll keep this for security but won't build the admin UI yet
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
      service: {
        id: service.id,
        name: service.name,
      },
      address: {
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
      },
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    })
    .from(booking)
    .where(eq(booking.id, bookingId))
    .innerJoin(service, eq(booking.serviceId, service.id))
    .innerJoin(address, eq(booking.addressId, address.id))
    .innerJoin(user, eq(booking.userId, user.id))
    .limit(1);
    
    if (results.length === 0) {
      return json({ error: 'Booking not found' }, { status: 404 });
    }
    
    const result = results[0];
    
    // Prepare booking data for the email
    const bookingData = {
      id: result.booking.id,
      scheduledDate: result.booking.scheduledDate.toISOString(),
      service: result.service,
      address: result.address,
    };
    
    // Use override email if provided, otherwise use user's email
    const emailTo = overrideEmail || result.user.email;
    
    // Send reminder email
    const success = await sendBookingReminderEmail(emailTo, bookingData);
    
    if (!success) {
      return json({ 
        success: false, 
        error: 'Failed to send reminder email' 
      }, { status: 500 });
    }
    
    return json({ 
      success: true,
      message: 'Booking reminder email sent',
      emailTo
    });
  } catch (error) {
    console.error('Error sending booking reminder:', { bookingId, error });
    return json({ 
      success: false, 
      error: 'Failed to send booking reminder email' 
    }, { status: 500 });
  }
};
