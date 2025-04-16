// src/lib/server/services/notification.service.ts
import { db } from "$lib/server/db";
import {
  address,
  booking,
  cleanerProfile,
  service,
  user,
} from "$lib/server/db/schema";
import { sendCleanerAssignmentEmail, sendCleanerJobAssignmentEmail } from "$lib/server/email-service";
import { eq } from "drizzle-orm";

/**
 * Send cleaner assignment notification when a cleaner is assigned to a booking
 * This function can be called whenever a cleaner is assigned to a booking
 *
 * @param bookingId The booking ID
 * @returns Success indicator
 */
export async function sendCleanerAssignmentNotification(
  bookingId: string,
): Promise<boolean> {
  try {
    // First fetch the booking to get the cleanerId
    const bookingResults = await db
      .select()
      .from(booking)
      .where(eq(booking.id, bookingId))
      .limit(1);

    if (bookingResults.length === 0 || !bookingResults[0].cleanerId) {
      console.error(`Booking not found or no cleaner assigned: ${bookingId}`);
      return false;
    }

    const bookingData = bookingResults[0];
    const cleanerId = bookingData.cleanerId;

    // Get booking details with related data - now including more service details
    const results = await db
      .select({
        booking: {
          id: booking.id,
          scheduledDate: booking.scheduledDate,
          duration: booking.duration, // Add duration
          notes: booking.notes, // Add customer notes
        },
        service: {
          id: service.id,
          name: service.name,
          description: service.description, // Add full service description
          details: service.details, // Add structured service details
        },
        address: {
          street: address.street,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
        },
        user: {
          email: user.email,
        },
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

    // Get cleaner information
    // Using proper SQL syntax for the query:
    const cleanerResults = await db
      .select({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        profileImageUrl: cleanerProfile.profileImageUrl,
      })
      .from(user)
      .leftJoin(cleanerProfile, eq(user.id, cleanerProfile.userId))
      .where(eq(user.id, cleanerId)) // Use cleanerId directly here, we know it's not null
      .limit(1);

    if (cleanerResults.length === 0) {
      console.error(`Cleaner not found: ${cleanerId}`);
      return false;
    }

    const cleanerInfo = cleanerResults[0];

    // Prepare booking data for the email - now with enhanced service details
    const emailData = {
      id: result.booking.id,
      scheduledDate: result.booking.scheduledDate.toISOString(),
      duration: result.booking.duration,
      notes: result.booking.notes,
      service: result.service, // This now includes description and details
      address: result.address,
      cleaner: cleanerInfo,
    };

    // Send notification to the customer
    return await sendCleanerAssignmentEmail(result.user.email, emailData);
  } catch (error) {
    console.error(`Error sending cleaner assignment notification: ${error}`);
    return false;
  }
}

/**
 * Send job assignment notification to the cleaner
 * This notifies the cleaner that they have been assigned to a job
 *
 * @param bookingId The booking ID
 * @returns Success indicator
 */
export async function sendCleanerJobNotification(
  bookingId: string,
): Promise<boolean> {
  try {
    // Fetch the booking to get the cleanerId
    const bookingResults = await db
      .select()
      .from(booking)
      .where(eq(booking.id, bookingId))
      .limit(1);

    if (bookingResults.length === 0 || !bookingResults[0].cleanerId) {
      console.error(`Booking not found or no cleaner assigned: ${bookingId}`);
      return false;
    }

    const bookingData = bookingResults[0];
    const cleanerId = bookingData.cleanerId;

    // Get full booking details with related data
    const results = await db
      .select({
        booking: {
          id: booking.id,
          scheduledDate: booking.scheduledDate,
          duration: booking.duration,
          notes: booking.notes,
          userId: booking.userId,
        },
        service: {
          id: service.id,
          name: service.name,
          description: service.description,
          details: service.details,
        },
        address: {
          street: address.street,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
        },
      })
      .from(booking)
      .where(eq(booking.id, bookingId))
      .innerJoin(service, eq(booking.serviceId, service.id))
      .innerJoin(address, eq(booking.addressId, address.id))
      .limit(1);

    if (results.length === 0) {
      console.error(`Failed to fetch booking details: ${bookingId}`);
      return false;
    }

    const result = results[0];

    // Get cleaner information - we need their email
    const cleanerInfo = await db
      .select({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      })
      .from(user)
      .where(eq(user.id, cleanerId))
      .limit(1);

    if (cleanerInfo.length === 0) {
      console.error(`Cleaner not found: ${cleanerId}`);
      return false;
    }

    // Get customer information
    const customerInfo = await db
      .select({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      })
      .from(user)
      .where(eq(user.id, result.booking.userId))
      .limit(1);

    if (customerInfo.length === 0) {
      console.error(`Customer not found: ${result.booking.userId}`);
      return false;
    }

    // Prepare booking data for the cleaner email
    const emailData = {
      id: result.booking.id,
      scheduledDate: result.booking.scheduledDate.toISOString(),
      service: result.service,
      address: result.address,
      notes: result.booking.notes,
      duration: result.booking.duration,
      customer: customerInfo[0],
    };

    // Send notification to the cleaner
    return await sendCleanerJobAssignmentEmail(cleanerInfo[0].email, emailData);
  } catch (error) {
    console.error(`Error sending job notification to cleaner: ${error}`);
    return false;
  }
}

/**
 * Send notifications to both customer and cleaner when a cleaner is assigned
 * This should be called whenever a cleaner is assigned to a booking
 *
 * @param bookingId The booking ID
 * @returns Object indicating success for both notifications
 */
export async function sendCleanerAssignmentNotifications(
  bookingId: string,
): Promise<{ customerNotified: boolean; cleanerNotified: boolean }> {
  // Send notification to customer
  const customerNotified = await sendCleanerAssignmentNotification(bookingId);

  // Send notification to cleaner
  const cleanerNotified = await sendCleanerJobNotification(bookingId);

  // Log the results
  console.log(`Assignment notifications for booking ${bookingId}:`, {
    customerNotified,
    cleanerNotified,
  });

  return { customerNotified, cleanerNotified };
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
