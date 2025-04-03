// src/lib/server/services/notification.service.ts
import { db } from '$lib/server/db';
import { booking, service, address, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { sendCleanerAssignmentEmail } from '$lib/server/email-service';

/**
 * Send cleaner assignment notification when a cleaner is assigned to a booking
 * This function can be called whenever a cleaner is assigned to a booking
 * 
 * @param bookingId The booking ID
 * @returns Success indicator
 */
export async function sendCleanerAssignmentNotification(bookingId: string): Promise<boolean> {
  try {
    // Get booking details with all needed information
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
    .leftJoin(user.as('cleaner'), 
      booking.cleanerId ? eq(booking.cleanerId, user.as('cleaner').id) : undefined)
    .limit(1);
    
    if (results.length === 0) {
      console.error(`Booking not found: ${bookingId}`);
      return false;
    }
    
    const result = results[0];
    
    // Check if a cleaner is assigned
    if (!result.booking.cleanerId || !result.cleaner) {
      console.error(`No cleaner assigned to booking: ${bookingId}`);
      return false;
    }
    
    // Prepare booking data for the email
    const bookingData = {
      id: result.booking.id,
      scheduledDate: result.booking.scheduledDate.toISOString(),
      service: result.service,
      address: result.address,
      cleaner: result.cleaner
    };
    
    // Send notification to the customer
    return await sendCleanerAssignmentEmail(result.user.email, bookingData);
  } catch (error) {
    console.error(`Error sending cleaner assignment notification: ${error}`);
    return false;
  }
}

/**
 * Integration point: How to use this in a booking update API
 * 
 * When updating a booking with a new cleaner ID:
 * 
 * 1. Update the booking in the database
 * 2. If cleanerId was changed/added, call this function:
 *    sendCleanerAssignmentNotification(bookingId)
 *      .then(success => {
 *        console.log(`Cleaner assignment notification ${success ? 'sent' : 'failed'} for booking ${bookingId}`);
 *      });
 */
