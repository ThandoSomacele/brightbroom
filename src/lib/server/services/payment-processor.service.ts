// src/lib/server/services/payment-processor.service.ts
import { db } from "$lib/server/db";
import { booking, payment } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { cleanerEarningsService } from "./cleaner-earnings.service";

interface ProcessPaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
}

/**
 * Service for processing payments and calculating commissions
 */
export const paymentProcessorService = {
  // Default commission rate (25%)
  DEFAULT_COMMISSION_RATE: 25.0,
  
  /**
   * Process a successful payment for a booking
   * 
   * @param bookingId The booking ID
   * @param paymentData Payment data from payment provider
   * @returns ProcessPaymentResult with success status
   */
  async processSuccessfulPayment(
    bookingId: string, 
    paymentData: { 
      amount: number;
      transactionId: string;
      paymentMethod: string;
    }
  ): Promise<ProcessPaymentResult> {
    try {
      // Get booking details
      const [bookingDetails] = await db
        .select({
          id: booking.id,
          userId: booking.userId,
          cleanerId: booking.cleanerId,
          status: booking.status,
          price: booking.price
        })
        .from(booking)
        .where(eq(booking.id, bookingId))
        .limit(1);
        
      if (!bookingDetails) {
        return { success: false, error: "Booking not found" };
      }
      
      // Validate payment amount matches booking price
      const bookingAmount = typeof bookingDetails.price === 'string' 
        ? parseFloat(bookingDetails.price) 
        : bookingDetails.price;
        
      if (Math.abs(bookingAmount - paymentData.amount) > 0.01) {
        return { 
          success: false, 
          error: `Payment amount ${paymentData.amount} does not match booking price ${bookingAmount}` 
        };
      }
      
      // Calculate platform commission and cleaner payout
      const platformCommissionRate = this.DEFAULT_COMMISSION_RATE; // 25%
      const platformCommissionAmount = (paymentData.amount * platformCommissionRate) / 100;
      const cleanerPayoutAmount = paymentData.amount - platformCommissionAmount;
      
      // Create new payment record
      const paymentId = crypto.randomUUID();
      const [newPayment] = await db
        .insert(payment)
        .values({
          id: paymentId,
          bookingId: bookingId,
          userId: bookingDetails.userId,
          amount: paymentData.amount,
          status: "COMPLETED",
          paymentMethod: this.mapPaymentMethod(paymentData.paymentMethod),
          platformCommissionRate: platformCommissionRate.toString(),
          platformCommissionAmount: platformCommissionAmount.toString(),
          cleanerPayoutAmount: cleanerPayoutAmount.toString(),
          isPaidToProvider: false, // Will be marked as paid when cleaner is paid out
          payFastId: paymentData.transactionId || null,
          merchantReference: bookingId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
        
      // Update booking status to CONFIRMED
      await db
        .update(booking)
        .set({
          status: "CONFIRMED",
          updatedAt: new Date()
        })
        .where(eq(booking.id, bookingId));
        
      // If there's a cleaner assigned, update their earnings summary
      if (bookingDetails.cleanerId) {
        await cleanerEarningsService.updateCleanerEarningsSummary(bookingDetails.cleanerId);
      }
      
      return { success: true, paymentId: newPayment.id };
    } catch (error) {
      console.error("Error processing payment:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown payment processing error" 
      };
    }
  },
  
  /**
   * Process a payment when a booking is marked as completed
   * This handles the case where the booking status changes from CONFIRMED to COMPLETED
   * 
   * @param bookingId The booking ID
   * @returns Success status
   */
  async processBookingCompletion(bookingId: string): Promise<boolean> {
    try {
      // Get booking details with payment info
      const [bookingDetails] = await db
        .select({
          cleanerId: booking.cleanerId,
        })
        .from(booking)
        .where(eq(booking.id, bookingId))
        .limit(1);
        
      if (!bookingDetails?.cleanerId) {
        return false;
      }
      
      // Update the cleaner's earnings summary
      await cleanerEarningsService.updateCleanerEarningsSummary(bookingDetails.cleanerId);
      
      return true;
    } catch (error) {
      console.error("Error processing booking completion:", error);
      return false;
    }
  },
  
  /**
   * Map external payment method to internal enum
   */
  mapPaymentMethod(externalMethod: string): "CREDIT_CARD" | "DEBIT_CARD" | "EFT" | "OTHER" {
    const methodMap: Record<string, "CREDIT_CARD" | "DEBIT_CARD" | "EFT" | "OTHER"> = {
      "cc": "CREDIT_CARD",
      "dc": "DEBIT_CARD",
      "eft": "EFT",
      "credit_card": "CREDIT_CARD",
      "debit_card": "DEBIT_CARD",
    };
    
    return methodMap[externalMethod.toLowerCase()] || "OTHER";
  }
};
