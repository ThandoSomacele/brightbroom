// src/lib/server/services/email-recovery.service.ts
import { db } from "$lib/server/db";
import { adminNote, booking, payment, user, service, address } from "$lib/server/db/schema";
import { sendBookingConfirmationEmail } from "$lib/server/email-service";
import { eq, and, like, gte } from "drizzle-orm";

/**
 * Service to recover missed confirmation emails
 */
export const emailRecoveryService = {
  /**
   * Check for payments that have been completed but may not have had emails sent
   * This can be run periodically or triggered by an admin
   */
  async checkMissedEmails(hoursBack: number = 24): Promise<{
    checked: number;
    sent: number;
    errors: number;
  }> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hoursBack);
      
      console.log(`[EMAIL RECOVERY] Checking for missed emails within last ${hoursBack} hours`);
      
      // Find payments marked as COMPLETED
      const completedPayments = await db
        .select({
          paymentId: payment.id,
          bookingId: payment.bookingId,
          updatedAt: payment.updatedAt,
          userId: payment.userId
        })
        .from(payment)
        .where(
          and(
            eq(payment.status, "COMPLETED"),
            gte(payment.updatedAt, cutoffTime)
          )
        );
      
      console.log(`[EMAIL RECOVERY] Found ${completedPayments.length} completed payments to check`);
      
      let sent = 0;
      let errors = 0;
      
      // For each payment, check if confirmation email was sent
      for (const paymentData of completedPayments) {
        try {
          // Check if we already have a note confirming email was sent
          const emailSentNotes = await db
            .select()
            .from(adminNote)
            .where(
              and(
                eq(adminNote.bookingId, paymentData.bookingId),
                like(adminNote.content, "%Booking confirmation email sent successfully%")
              )
            )
            .limit(1);
          
          // If we already sent an email, skip this booking
          if (emailSentNotes.length > 0) {
            console.log(`[EMAIL RECOVERY] Email already sent for booking ${paymentData.bookingId}`);
            continue;
          }
          
          // Get booking details
          const bookingDetails = await db.select({
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
            }
          })
          .from(booking)
          .innerJoin(service, eq(booking.serviceId, service.id))
          .innerJoin(address, eq(booking.addressId, address.id))
          .innerJoin(user, eq(booking.userId, user.id))
          .where(eq(booking.id, paymentData.bookingId))
          .limit(1);
          
          if (bookingDetails.length === 0 || bookingDetails[0].booking.status === "CANCELLED") {
            continue;
          }
          
          // Send the confirmation email
          console.log(`[EMAIL RECOVERY] Sending recovery email for booking ${paymentData.bookingId}`);
          const success = await sendBookingConfirmationEmail(
            bookingDetails[0].user.email,
            {
              id: bookingDetails[0].booking.id,
              status: bookingDetails[0].booking.status,
              service: bookingDetails[0].service,
              scheduledDate: bookingDetails[0].booking.scheduledDate,
              address: bookingDetails[0].address,
              price: bookingDetails[0].booking.price,
              paymentStatus: "COMPLETED" // Explicitly set
            }
          );
          
          if (success) {
            sent++;
            // Add note that email was recovered
            await db.insert(adminNote).values({
              id: crypto.randomUUID(),
              bookingId: paymentData.bookingId,
              content: `RECOVERY: Booking confirmation email sent by recovery process`,
              addedBy: "Email Recovery Service",
              createdAt: new Date()
            });
          } else {
            errors++;
          }
        } catch (bookingError) {
          console.error(`[EMAIL RECOVERY] Error processing booking ${paymentData.bookingId}:`, bookingError);
          errors++;
        }
      }
      
      return {
        checked: completedPayments.length,
        sent,
        errors
      };
    } catch (error) {
      console.error("[EMAIL RECOVERY] Error checking for missed emails:", error);
      return {
        checked: 0,
        sent: 0,
        errors: 1
      };
    }
  }
};
