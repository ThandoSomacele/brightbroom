// src/lib/server/hooks/post-payment-hooks.ts
import { db } from "$lib/server/db";
import {
  address,
  adminNote,
  booking,
  bookingAddon,
  addon,
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
        'Error in post-payment cleaner assignment for booking:',
        {
          bookingId,
          error: error instanceof Error ? error.message : String(error)
        }
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

      // Check if we've already sent an email for this booking
      const existingEmailNotes = await db
        .select()
        .from(adminNote)
        .where(eq(adminNote.bookingId, bookingId))
        .limit(100);

      const alreadySent = existingEmailNotes.some(
        (note) =>
          note.content.includes("confirmation email sent successfully") ||
          note.content.includes("EMAIL_SENT:"),
      );

      if (alreadySent) {
        console.log(
          `[POST-PAYMENT HOOKS] Email already sent for booking ${bookingId}, skipping`,
        );
        return true;
      }

      // Get booking details with user email and enhanced data
      const results = await db
        .select({
          booking: {
            id: booking.id,
            status: booking.status,
            scheduledDate: booking.scheduledDate,
            price: booking.price,
            bedroomCount: booking.bedroomCount,
            bathroomCount: booking.bathroomCount,
            duration: booking.duration,
            notes: booking.notes,
          },
          user: {
            email: user.email,
          },
          address: {
            street: address.street,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
          },
        })
        .from(booking)
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

      // Fetch booking add-ons with their names and prices
      const bookingAddons = await db
        .select({
          name: addon.name,
          price: bookingAddon.priceAtBooking,
        })
        .from(bookingAddon)
        .innerJoin(addon, eq(bookingAddon.addonId, addon.id))
        .where(eq(bookingAddon.bookingId, bookingId));

      // Format add-ons for email
      const emailAddons = bookingAddons.map(a => ({
        name: a.name,
        price: parseFloat(a.price)
      }));

      console.log(
        `[POST-PAYMENT HOOKS] Sending confirmation email with explicit payment status: ${paymentStatus}`,
      );

      // Send the confirmation email with the explicit payment status and full booking details
      const success = await sendBookingConfirmationEmail(
        bookingData.user.email,
        {
          id: bookingData.booking.id,
          status: bookingData.booking.status,
          service: { name: "General Clean" },
          scheduledDate: bookingData.booking.scheduledDate,
          address: bookingData.address,
          price: bookingData.booking.price,
          paymentStatus: paymentStatus, // Pass the payment status directly and explicitly
          // Enhanced booking details
          bedroomCount: bookingData.booking.bedroomCount || undefined,
          bathroomCount: bookingData.booking.bathroomCount || undefined,
          addons: emailAddons.length > 0 ? emailAddons : undefined,
          durationMinutes: bookingData.booking.duration || undefined,
          notes: bookingData.booking.notes || undefined,
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
        '[POST-PAYMENT HOOKS] Error sending confirmation email for booking:',
        {
          bookingId,
          error: error instanceof Error ? error.message : String(error)
        }
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
  // async runAll(bookingId: string, paymentStatus = "COMPLETED"): Promise<void> {
  //   try {
  //     console.log(
  //       `[POST-PAYMENT HOOKS] Running all post-payment hooks for booking ${bookingId} with payment status ${paymentStatus}`,
  //     );

  //     // Get booking status first to check if it's cancelled
  //     const bookingData = await db
  //       .select({ status: booking.status })
  //       .from(booking)
  //       .where(eq(booking.id, bookingId))
  //       .limit(1);

  //     if (bookingData.length === 0) {
  //       console.log(
  //         `[POST-PAYMENT HOOKS] Booking not found for post-payment hooks: ${bookingId}`,
  //       );
  //       return;
  //     }

  //     // Skip all hooks if the booking is cancelled
  //     if (bookingData[0].status === "CANCELLED") {
  //       console.log(
  //         `[POST-PAYMENT HOOKS] Skipping post-payment hooks for cancelled booking: ${bookingId}`,
  //       );
  //       return;
  //     }

  //     // Run the hooks in sequence
  //     console.log(
  //       `[POST-PAYMENT HOOKS] Running hooks sequence for booking ${bookingId}`,
  //     );

  //     // 1. Send confirmation email with the explicit payment status
  //     console.log(
  //       `[POST-PAYMENT HOOKS] Executing step 1: Send confirmation email`,
  //     );
  //     await this.sendConfirmationEmail(bookingId, paymentStatus);

  //     // 2. Attempt cleaner assignment
  //     console.log(
  //       `[POST-PAYMENT HOOKS] Executing step 2: Attempt cleaner assignment`,
  //     );
  //     await this.attemptCleanerAssignment(bookingId);

  //     console.log(
  //       `[POST-PAYMENT HOOKS] All hooks completed for booking ${bookingId}`,
  //     );
  //   } catch (error) {
  //     console.error(
  //       `[POST-PAYMENT HOOKS] Error running post-payment hooks for booking ${bookingId}:`,
  //       error,
  //     );
  //   }
  // },

  // Add this method to the postPaymentHooks object

  /**
   * Send booking confirmation email with retry mechanism
   * @param bookingId The booking ID
   * @param paymentStatus Optional payment status to override database check
   * @param retries Number of retry attempts
   * @returns Success status
   */
  async sendConfirmationEmailWithRetry(
    bookingId: string,
    paymentStatus = "COMPLETED",
    retries = 3,
  ): Promise<boolean> {
    try {
      console.log(
        `[POST-PAYMENT HOOKS] Attempting to send confirmation email for booking: ${bookingId} (retries left: ${retries})`,
      );

      // First attempt
      let success = await this.sendConfirmationEmail(bookingId, paymentStatus);

      // If failed and we have retries left, try again with exponential backoff
      let retryCount = 0;
      while (!success && retryCount < retries) {
        // Wait with exponential backoff (1s, 2s, 4s, etc.)
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(
          `[POST-PAYMENT HOOKS] Email send failed, retrying in ${delay}ms...`,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));

        // Try again
        retryCount++;
        console.log(
          `[POST-PAYMENT HOOKS] Retry attempt ${retryCount} for booking ${bookingId}`,
        );
        success = await this.sendConfirmationEmail(bookingId, paymentStatus);
      }

      // If all retries failed, try direct email endpoint as last resort
      if (!success) {
        console.log(
          `[POST-PAYMENT HOOKS] All retry attempts failed, trying direct endpoint for booking ${bookingId}`,
        );

        try {
          // Make a direct call to the direct-email endpoint
          const response = await fetch(`/api/payments/direct-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              bookingId,
              forceEmail: true,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            success = result.success;
            console.log(
              `[POST-PAYMENT HOOKS] Direct email endpoint result: ${success ? "Success" : "Failed"}`,
            );
          }
        } catch (directError) {
          console.error(
            `[POST-PAYMENT HOOKS] Error calling direct email endpoint:`,
            directError,
          );
        }
      }

      // Record final result
      try {
        await db.insert(adminNote).values({
          id: crypto.randomUUID(),
          bookingId,
          content: success
            ? `Email sending with retry mechanism: SUCCESS after ${retryCount} retries`
            : `Email sending with retry mechanism: FAILED after ${retries} retries`,
          addedBy: "System (Retry Mechanism)",
          createdAt: new Date(),
        });
      } catch (noteError) {
        console.error(
          `[POST-PAYMENT HOOKS] Error creating admin note:`,
          noteError,
        );
      }

      return success;
    } catch (error) {
      console.error(
        '[POST-PAYMENT HOOKS] Error in email retry mechanism for booking:',
        {
          bookingId,
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return false;
    }
  },

  /**
   * Run all post-payment hooks with improved reliability
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

      // 1. Send confirmation email with retries
      console.log(
        `[POST-PAYMENT HOOKS] Executing step 1: Send confirmation email with retries`,
      );
      await this.sendConfirmationEmailWithRetry(bookingId, paymentStatus);

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
        '[POST-PAYMENT HOOKS] Error running post-payment hooks for booking:',
        {
          bookingId,
          error: error instanceof Error ? error.message : String(error)
        }
      );
    }
  },
};
