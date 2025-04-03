// src/lib/server/services/notification.service.ts
import { db } from '$lib/server/db';
import { booking, service, address, user } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
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
    // First fetch the booking to get the cleanerId
    const bookingResults = await db.select()
      .from(booking)
      .where(eq(booking.id, bookingId))
      .limit(1);
      
    if (bookingResults.length === 0 || !bookingResults[0].cleanerId) {
      console.error(`Booking not found or no cleaner assigned: ${bookingId}`);
      return false;
    }
    
    const bookingData = bookingResults[0];
    const cleanerId = bookingData.cleanerId;
    
    // Get booking details with related data
    const results = await db.select({
      booking: {
        id: booking.id,
        scheduledDate: booking.scheduledDate,
      },
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
      }
    })
    .from(booking)
    .where(eq(booking.id, bookingId))
    .innerJoin(service, eq(booking.serviceId, service.id))
    .innerJoin(address, eq(booking.addressId, address.id))
    .innerJoin(user, eq(booking.userId, user.id))
    .limit(1);
    
    if (results.length === 0) {
      console.error(`Failed to fetch booking details: ${bookingId}`);
      return false;
    }
    
    const result = results[0];
    
    // Get cleaner information in a separate query
    const cleanerResults = await db.select({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone
    })
    .from(user)
    .where(eq(user.id, cleanerId))
    .limit(1);
    
    if (cleanerResults.length === 0) {
      console.error(`Cleaner not found: ${cleanerId}`);
      return false;
    }
    
    const cleanerInfo = cleanerResults[0];
    
    // Prepare booking data for the email
    const emailData = {
      id: result.booking.id,
      scheduledDate: result.booking.scheduledDate.toISOString(),
      service: result.service,
      address: result.address,
      cleaner: cleanerInfo
    };
    
    // Send notification to the customer
    return await sendCleanerAssignmentEmail(result.user.email, emailData);
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
