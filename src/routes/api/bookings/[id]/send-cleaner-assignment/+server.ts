// src/routes/api/bookings/[id]/send-cleaner-assignment/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { booking, service, address, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { sendCleanerAssignmentEmail } from '$lib/server/email-service';

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
    
    // Get booking details along with cleaner information
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
        email: user.email
      },
      cleaner: booking.cleanerId ? {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone
      } : null
    })
    .from(booking)
    .where(eq(booking.id, bookingId))
    .innerJoin(service, eq(booking.serviceId, service.id))
    .innerJoin(address, eq(booking.addressId, address.id))
    .innerJoin(user, eq(booking.userId, user.id))
    .leftJoin(user.as('cleaner'), booking.cleanerId ? eq(booking.cleanerId, user.as('cleaner').id) : undefined)
    .limit(1);
    
    if (results.length === 0) {
      return json({ error: 'Booking not found' }, { status: 404 });
    }
    
    const result = results[0];
    
    // Check if a cleaner is assigned
    if (!result.booking.cleanerId || !result.cleaner) {
      return json({ 
        success: false, 
        error: 'No cleaner assigned to this booking yet' 
      }, { status: 400 });
    }
    
    // Prepare booking data for the email
    const bookingData = {
      id: result.booking.id,
      scheduledDate: result.booking.scheduledDate.toISOString(),
      service: result.service,
      address: result.address,
      cleaner: result.cleaner
    };
    
    // Use override email if provided, otherwise use user's email
    const emailTo = overrideEmail || result.user.email;
    
    // Send cleaner assignment notification
    const success = await sendCleanerAssignmentEmail(emailTo, bookingData);
    
    if (!success) {
      return json({ 
        success: false, 
        error: 'Failed to send cleaner assignment notification' 
      }, { status: 500 });
    }
    
    return json({ 
      success: true,
      message: 'Cleaner assignment notification sent',
      emailTo
    });
  } catch (error) {
    console.error('Error sending cleaner assignment notification:', { bookingId, error });
    return json({ 
      success: false, 
      error: 'Failed to send cleaner assignment notification' 
    }, { status: 500 });
  }
};
