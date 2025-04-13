// src/lib/server/hooks/post-payment-hooks.ts
import { cleanerAssignmentService } from "$lib/server/services/cleaner-assignment.service";
import { db } from "$lib/server/db";
import { adminNote, booking } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { sendBookingConfirmationEmail } from "$lib/server/email-service";

/**
 * Hooks that run after a successful payment
 */
export const postPaymentHooks = {
  /**
   * Attempt to auto-assign a cleaner after successful payment
   * @param bookingId The booking ID
   * @returns Success status and cleaner ID if assigned
   */
  async attemptCleanerAssignment(bookingId: string): Promise<{
    success: boolean;
    cleanerId?: string;
    message?: string;
  }> {
    try {
      console.log(`Attempting auto-assignment for booking: ${bookingId}`);
      
      // Auto-assign the cleaner
      const result = await cleanerAssignmentService.autoAssignCleaner(bookingId);
      
      // Record the attempt in admin notes
      await db.insert(adminNote).values({
        id: crypto.randomUUID(),
        bookingId,
        content: result.success 
          ? `Cleaner automatically assigned: ${result.message}`
          : `Automatic cleaner assignment failed: ${result.message}`,
        addedBy: "System (Auto)",
        createdAt: new Date(),
      });
      
      return result;
    } catch (error) {
      console.error(`Error in post-payment cleaner assignment for booking ${bookingId}:`, error);
      
      // Record the error
      try {
        await db.insert(adminNote).values({
          id: crypto.randomUUID(),
          bookingId,
          content: `Error during automatic cleaner assignment: ${error instanceof Error ? error.message : 'Unknown error'}`,
          addedBy: "System (Auto)",
          createdAt: new Date(),
        });
      } catch (noteError) {
        console.error("Failed to create admin note about assignment error:", noteError);
      }
      
      return {
        success: false,
        message: "Internal server error during cleaner assignment",
      };
    }
  },
  
  /**
   * Send booking confirmation email
   * @param bookingId The booking ID
   * @returns Success status
   */
  async sendConfirmationEmail(bookingId: string): Promise<boolean> {
    try {
      console.log(`Preparing to send confirmation email for booking: ${bookingId}`);
      
      // Get booking details with user email
      const results = await db
        .select({
          booking: {
            id: booking.id,
            status: booking.status,
            scheduledDate: booking.scheduledDate,
            price: booking.price,
          },
          user: {
            email: user.email,
          },
          service: {
            name: service.name,
          },
          address: {
            street: address.street,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
          },
        })
        .from(booking)
        .innerJoin(service, eq(booking.serviceId, service.id))
        .innerJoin(address, eq(booking.addressId, address.id))
        .innerJoin(user, eq(booking.userId, user.id))
        .where(eq(booking.id, bookingId))
        .limit(1);
      
      if (results.length === 0) {
        console.error(`Booking not found when sending confirmation: ${bookingId}`);
        return false;
      }
      
      const bookingData = results[0];
      
      // Check if booking is cancelled - don't send confirmation for cancelled bookings
      if (bookingData.booking.status === 'CANCELLED') {
        console.log(`Skipping confirmation email for cancelled booking: ${bookingId}`);
        return true; // Return true to indicate we handled this correctly (by not sending)
      }
      
      // Send the confirmation email
      const success = await sendBookingConfirmationEmail(
        bookingData.user.email,
        {
          id: bookingData.booking.id,
          status: bookingData.booking.status,
          service: bookingData.service,
          scheduledDate: bookingData.booking.scheduledDate,
          address: bookingData.address,
          price: bookingData.booking.price,
        }
      );
      
      // Record the result in admin notes
      await db.insert(adminNote).values({
        id: crypto.randomUUID(),
        bookingId,
        content: success 
          ? `Booking confirmation email sent successfully`
          : `Failed to send booking confirmation email`,
        addedBy: "System (Auto)",
        createdAt: new Date(),
      });
      
      return success;
    } catch (error) {
      console.error(`Error sending confirmation email for booking ${bookingId}:`, error);
      
      // Record the error
      try {
        await db.insert(adminNote).values({
          id: crypto.randomUUID(),
          bookingId,
          content: `Error sending confirmation email: ${error instanceof Error ? error.message : 'Unknown error'}`,
          addedBy: "System (Auto)",
          createdAt: new Date(),
        });
      } catch (noteError) {
        console.error("Failed to create admin note about email error:", noteError);
      }
      
      return false;
    }
  },
  
  /**
   * Run all post-payment hooks
   * @param bookingId The booking ID
   */
  async runAll(bookingId: string): Promise<void> {
    try {
      // Get booking status first to check if it's cancelled
      const bookingData = await db
        .select({ status: booking.status })
        .from(booking)
        .where(eq(booking.id, bookingId))
        .limit(1);
      
      if (bookingData.length === 0) {
        console.log(`Booking not found for post-payment hooks: ${bookingId}`);
        return;
      }
      
      // Skip all hooks if the booking is cancelled
      if (bookingData[0].status === 'CANCELLED') {
        console.log(`Skipping post-payment hooks for cancelled booking: ${bookingId}`);
        return;
      }
      
      // Run the hooks in sequence
      console.log(`Running post-payment hooks for booking ${bookingId}`);
      
      // 1. Send confirmation email
      await this.sendConfirmationEmail(bookingId);
      
      // 2. Attempt cleaner assignment
      await this.attemptCleanerAssignment(bookingId);
      
      // 3. Add more hooks here as needed
      
    } catch (error) {
      console.error(`Error running post-payment hooks for booking ${bookingId}:`, error);
    }
  }
};
