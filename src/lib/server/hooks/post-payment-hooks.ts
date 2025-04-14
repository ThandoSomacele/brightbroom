// src/lib/server/hooks/post-payment-hooks.ts
import { db } from "$lib/server/db";
import {
  address,
  adminNote,
  booking,
  service,
  user,
} from "$lib/server/db/schema";
import { sendBookingConfirmationEmail } from "$lib/server/email-service";
import { cleanerAssignmentService } from "$lib/server/services/cleaner-assignment.service";
import { eq } from "drizzle-orm";

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
      const result =
        await cleanerAssignmentService.autoAssignCleaner(bookingId);

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
      console.error(
        `Error in post-payment cleaner assignment for booking ${bookingId}:`,
        error,
      );

      // Record the error
      try {
        await db.insert(adminNote).values({
          id: crypto.randomUUID(),
          bookingId,
          content: `Error during automatic cleaner assignment: ${error instanceof Error ? error.message : "Unknown error"}`,
          addedBy: "System (Auto)",
          createdAt: new Date(),
        });
      } catch (noteError) {
        console.error(
          "Failed to create admin note about assignment error:",
          noteError,
        );
      }

      return {
        success: false,
        message: "Internal server error during cleaner assignment",
      };
    }
  },

  // Modified function in src/lib/server/hooks/post-payment-hooks.ts

  /**
   * Send booking confirmation email
   * @param bookingId The booking ID
   * @param paymentStatus Optional payment status to override database check
   * @returns Success status
   */
  async sendConfirmationEmail(
    bookingId: string,
    paymentStatus = "COMPLETED",
  ): Promise<boolean> {
    try {
      console.log(
        `[POST-PAYMENT HOOKS] Preparing to send confirmation email for booking: ${bookingId}, payment status: ${paymentStatus}`,
      );

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
        console.error(
          `[POST-PAYMENT HOOKS] Booking not found when sending confirmation: ${bookingId}`,
        );
        return false;
      }

      const bookingData = results[0];

      // Check if booking is cancelled - don't send confirmation for cancelled bookings
      if (bookingData.booking.status === "CANCELLED") {
        console.log(
          `[POST-PAYMENT HOOKS] Skipping confirmation email for cancelled booking: ${bookingId}`,
        );
        return true; // Return true to indicate we handled this correctly (by not sending)
      }

      console.log(
        `[POST-PAYMENT HOOKS] Sending confirmation email with explicit payment status: ${paymentStatus}`,
      );

      // Send the confirmation email with the explicit payment status
      // This is the key fix - we're passing the payment status directly instead of querying it again
      const success = await sendBookingConfirmationEmail(
        bookingData.user.email,
        {
          id: bookingData.booking.id,
          status: bookingData.booking.status,
          service: bookingData.service,
          scheduledDate: bookingData.booking.scheduledDate,
          address: bookingData.address,
          price: bookingData.booking.price,
          paymentStatus: paymentStatus, // Pass the payment status directly and explicitly
        },
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
      console.error(
        `[POST-PAYMENT HOOKS] Error sending confirmation email for booking ${bookingId}:`,
        error,
      );

      // Record the error
      try {
        await db.insert(adminNote).values({
          id: crypto.randomUUID(),
          bookingId,
          content: `Error sending confirmation email: ${error instanceof Error ? error.message : "Unknown error"}`,
          addedBy: "System (Auto)",
          createdAt: new Date(),
        });
      } catch (noteError) {
        console.error(
          "[POST-PAYMENT HOOKS] Failed to create admin note about email error:",
          noteError,
        );
      }

      return false;
    }
  },

  /**
   * Run all post-payment hooks
   * @param bookingId The booking ID
   * @param paymentStatus Optional payment status to override database check
   */
  async runAll(bookingId: string, paymentStatus = "COMPLETED"): Promise<void> {
    try {
      console.log(
        `[POST-PAYMENT HOOKS] Running all post-payment hooks for booking ${bookingId} with payment status ${paymentStatus}`,
      );

      // Get booking status first to check if it's cancelled
      const bookingData = await db
        .select({ status: booking.status })
        .from(booking)
        .where(eq(booking.id, bookingId))
        .limit(1);

      if (bookingData.length === 0) {
        console.log(
          `[POST-PAYMENT HOOKS] Booking not found for post-payment hooks: ${bookingId}`,
        );
        return;
      }

      // Skip all hooks if the booking is cancelled
      if (bookingData[0].status === "CANCELLED") {
        console.log(
          `[POST-PAYMENT HOOKS] Skipping post-payment hooks for cancelled booking: ${bookingId}`,
        );
        return;
      }

      // Run the hooks in sequence
      console.log(
        `[POST-PAYMENT HOOKS] Running hooks sequence for booking ${bookingId}`,
      );

      // 1. Send confirmation email with the explicit payment status
      console.log(
        `[POST-PAYMENT HOOKS] Executing step 1: Send confirmation email`,
      );
      await this.sendConfirmationEmail(bookingId, paymentStatus);

      // 2. Attempt cleaner assignment
      console.log(
        `[POST-PAYMENT HOOKS] Executing step 2: Attempt cleaner assignment`,
      );
      await this.attemptCleanerAssignment(bookingId);

      console.log(
        `[POST-PAYMENT HOOKS] All hooks completed for booking ${bookingId}`,
      );
    } catch (error) {
      console.error(
        `[POST-PAYMENT HOOKS] Error running post-payment hooks for booking ${bookingId}:`,
        error,
      );
    }
  },

  /**
   * Run all post-payment hooks
   * @param bookingId The booking ID
   * @param paymentStatus Optional payment status to override database check
   */
  async runAll(bookingId: string, paymentStatus = "COMPLETED"): Promise<void> {
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
      if (bookingData[0].status === "CANCELLED") {
        console.log(
          `Skipping post-payment hooks for cancelled booking: ${bookingId}`,
        );
        return;
      }

      // Run the hooks in sequence
      console.log(`Running post-payment hooks for booking ${bookingId}`);

      // 1. Send confirmation email with the payment status
      await this.sendConfirmationEmail(bookingId, paymentStatus);

      // 2. Attempt cleaner assignment
      await this.attemptCleanerAssignment(bookingId);

      // 3. Add more hooks here as needed
    } catch (error) {
      console.error(
        `Error running post-payment hooks for booking ${bookingId}:`,
        error,
      );
    }
  },
};
