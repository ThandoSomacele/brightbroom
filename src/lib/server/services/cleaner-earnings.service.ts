// src/lib/server/services/cleaner-earnings.service.ts
import { db } from "$lib/server/db";
import { booking, payment, cleanerPayoutSummary, user } from "$lib/server/db/schema";
import { and, eq, gte, lt, sum, count, desc } from "drizzle-orm";
import { startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";

/**
 * Service for managing cleaner earnings and payouts
 */
export const cleanerEarningsService = {
  /**
   * Get a cleaner's total earnings, including all time and period-specific statistics
   * 
   * @param cleanerId The cleaner user ID
   * @returns Summary of cleaner's earnings
   */
  async getCleanerEarningsSummary(cleanerId: string): Promise<{
    totalEarnings: number;
    totalCommission: number;
    totalPayout: number;
    pendingPayout: number;
    currentMonthEarnings: number;
    lastMonthEarnings: number;
    yearToDateEarnings: number;
    lastPayoutAmount: number | null;
    lastPayoutDate: Date | null;
    completedBookings: number;
    averageRating: number | null;
  }> {
    try {
      // First try to get from the summary table for better performance
      const summary = await this.getOrCreateSummary(cleanerId);
      
      if (summary) {
        // Get pending payout (completed bookings where payment is completed but not paid to cleaner)
        const pendingPayoutResult = await db
          .select({
            pendingAmount: sum(payment.cleanerPayoutAmount)
          })
          .from(payment)
          .innerJoin(booking, eq(payment.bookingId, booking.id))
          .where(
            and(
              eq(booking.cleanerId, cleanerId),
              eq(booking.status, "COMPLETED"),
              eq(payment.status, "COMPLETED"),
              eq(payment.isPaidToProvider, false)
            )
          );
      
        const pendingPayout = pendingPayoutResult[0]?.pendingAmount 
          ? Number(pendingPayoutResult[0].pendingAmount) 
          : 0;
          
        // Get cleaner's average rating
        const ratingResult = await db
          .select({
            rating: user.rating
          })
          .from(user)
          .where(eq(user.id, cleanerId))
          .limit(1);
          
        const rating = ratingResult[0]?.rating ? Number(ratingResult[0].rating) : null;
        
        // Get cleaner's completed booking count
        const bookingsResult = await db
          .select({
            count: count()
          })
          .from(booking)
          .where(
            and(
              eq(booking.cleanerId, cleanerId),
              eq(booking.status, "COMPLETED")
            )
          );
          
        const completedBookings = Number(bookingsResult[0]?.count || 0);
        
        return {
          totalEarnings: Number(summary.totalEarnings || 0),
          totalCommission: Number(summary.totalCommission || 0),
          totalPayout: Number(summary.totalPayout || 0),
          pendingPayout,
          currentMonthEarnings: Number(summary.totalEarningsCurrentMonth || 0),
          lastMonthEarnings: Number(summary.totalEarningsLastMonth || 0),
          yearToDateEarnings: Number(summary.totalEarningsThisYear || 0),
          lastPayoutAmount: summary.lastPayoutAmount ? Number(summary.lastPayoutAmount) : null,
          lastPayoutDate: summary.lastPayoutDate,
          completedBookings,
          averageRating: rating,
        };
      }
      
      // Fallback to calculating everything from scratch
      return this.calculateEarningsSummary(cleanerId);
    } catch (error) {
      console.error("Error getting cleaner earnings summary:", error);
      throw error;
    }
  },
  
  /**
   * Get or create the earnings summary record for a cleaner
   */
  async getOrCreateSummary(cleanerId: string): Promise<typeof cleanerPayoutSummary.$inferSelect | null> {
    try {
      // Try to get existing summary
      const [existingSummary] = await db
        .select()
        .from(cleanerPayoutSummary)
        .where(eq(cleanerPayoutSummary.cleanerId, cleanerId))
        .limit(1);
        
      if (existingSummary) {
        return existingSummary;
      }
      
      // If no summary exists, calculate and create one
      const summary = await this.calculateEarningsSummary(cleanerId);
      
      // Create a new summary record
      const [newSummary] = await db
        .insert(cleanerPayoutSummary)
        .values({
          id: crypto.randomUUID(),
          cleanerId,
          totalEarnings: summary.totalEarnings.toString(),
          totalCommission: summary.totalCommission.toString(),
          totalPayout: summary.totalPayout.toString(),
          pendingPayout: summary.pendingPayout.toString(),
          totalEarningsCurrentMonth: summary.currentMonthEarnings.toString(),
          totalEarningsLastMonth: summary.lastMonthEarnings.toString(),
          totalEarningsThisYear: summary.yearToDateEarnings.toString(),
          lastPayoutAmount: summary.lastPayoutAmount?.toString() || null,
          lastPayoutDate: summary.lastPayoutDate,
          lastUpdated: new Date()
        })
        .returning();
        
      return newSummary;
    } catch (error) {
      console.error("Error getting or creating earnings summary:", error);
      return null;
    }
  },
  
  /**
   * Calculate a cleaner's earnings summary from booking and payment data
   * This is more computationally expensive but ensures accurate data
   */
  async calculateEarningsSummary(cleanerId: string): Promise<{
    totalEarnings: number;
    totalCommission: number;
    totalPayout: number;
    pendingPayout: number;
    currentMonthEarnings: number;
    lastMonthEarnings: number;
    yearToDateEarnings: number;
    lastPayoutAmount: number | null;
    lastPayoutDate: Date | null;
    completedBookings: number;
    averageRating: number | null;
  }> {
    try {
      // Get date ranges
      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));
      
      const yearStart = startOfYear(now);
      
      // Total earnings (all completed bookings with payments)
      const totalResult = await db
        .select({
          totalAmount: sum(payment.amount),
          totalCommission: sum(payment.platformCommissionAmount),
          totalPayout: sum(payment.cleanerPayoutAmount)
        })
        .from(payment)
        .innerJoin(booking, eq(payment.bookingId, booking.id))
        .where(
          and(
            eq(booking.cleanerId, cleanerId),
            eq(booking.status, "COMPLETED"),
            eq(payment.status, "COMPLETED")
          )
        );
        
      // Current month earnings
      const currentMonthResult = await db
        .select({
          amount: sum(payment.amount)
        })
        .from(payment)
        .innerJoin(booking, eq(payment.bookingId, booking.id))
        .where(
          and(
            eq(booking.cleanerId, cleanerId),
            eq(booking.status, "COMPLETED"),
            eq(payment.status, "COMPLETED"),
            gte(booking.scheduledDate, currentMonthStart),
            lt(booking.scheduledDate, currentMonthEnd)
          )
        );
        
      // Last month earnings
      const lastMonthResult = await db
        .select({
          amount: sum(payment.amount)
        })
        .from(payment)
        .innerJoin(booking, eq(payment.bookingId, booking.id))
        .where(
          and(
            eq(booking.cleanerId, cleanerId),
            eq(booking.status, "COMPLETED"),
            eq(payment.status, "COMPLETED"),
            gte(booking.scheduledDate, lastMonthStart),
            lt(booking.scheduledDate, lastMonthEnd)
          )
        );
        
      // Year to date earnings
      const yearToDateResult = await db
        .select({
          amount: sum(payment.amount)
        })
        .from(payment)
        .innerJoin(booking, eq(payment.bookingId, booking.id))
        .where(
          and(
            eq(booking.cleanerId, cleanerId),
            eq(booking.status, "COMPLETED"),
            eq(payment.status, "COMPLETED"),
            gte(booking.scheduledDate, yearStart)
          )
        );
        
      // Pending payout
      const pendingPayoutResult = await db
        .select({
          pendingAmount: sum(payment.cleanerPayoutAmount)
        })
        .from(payment)
        .innerJoin(booking, eq(payment.bookingId, booking.id))
        .where(
          and(
            eq(booking.cleanerId, cleanerId),
            eq(booking.status, "COMPLETED"),
            eq(payment.status, "COMPLETED"),
            eq(payment.isPaidToProvider, false)
          )
        );
        
      // Last payout
      const lastPayoutResult = await db
        .select({
          amount: payment.cleanerPayoutAmount,
          date: payment.providerPayoutDate
        })
        .from(payment)
        .innerJoin(booking, eq(payment.bookingId, booking.id))
        .where(
          and(
            eq(booking.cleanerId, cleanerId),
            eq(payment.isPaidToProvider, true),
            payment.providerPayoutDate.isNotNull()
          )
        )
        .orderBy(desc(payment.providerPayoutDate))
        .limit(1);
        
      // Cleaner rating
      const ratingResult = await db
        .select({
          rating: user.rating
        })
        .from(user)
        .where(eq(user.id, cleanerId))
        .limit(1);
        
      // Completed bookings count
      const bookingsResult = await db
        .select({
          count: count()
        })
        .from(booking)
        .where(
          and(
            eq(booking.cleanerId, cleanerId),
            eq(booking.status, "COMPLETED")
          )
        );
        
      // Process and return the results
      const totalEarnings = Number(totalResult[0]?.totalAmount || 0);
      const totalCommission = Number(totalResult[0]?.totalCommission || 0);
      const totalPayout = Number(totalResult[0]?.totalPayout || 0);
      const pendingPayout = Number(pendingPayoutResult[0]?.pendingAmount || 0);
      const currentMonthEarnings = Number(currentMonthResult[0]?.amount || 0);
      const lastMonthEarnings = Number(lastMonthResult[0]?.amount || 0);
      const yearToDateEarnings = Number(yearToDateResult[0]?.amount || 0);
      const lastPayoutAmount = lastPayoutResult[0]?.amount ? Number(lastPayoutResult[0].amount) : null;
      const lastPayoutDate = lastPayoutResult[0]?.date || null;
      const completedBookings = Number(bookingsResult[0]?.count || 0);
      const averageRating = ratingResult[0]?.rating ? Number(ratingResult[0].rating) : null;
      
      return {
        totalEarnings,
        totalCommission,
        totalPayout,
        pendingPayout,
        currentMonthEarnings,
        lastMonthEarnings,
        yearToDateEarnings,
        lastPayoutAmount,
        lastPayoutDate,
        completedBookings,
        averageRating,
      };
    } catch (error) {
      console.error("Error calculating earnings summary:", error);
      return {
        totalEarnings: 0,
        totalCommission: 0,
        totalPayout: 0,
        pendingPayout: 0,
        currentMonthEarnings: 0,
        lastMonthEarnings: 0,
        yearToDateEarnings: 0,
        lastPayoutAmount: null,
        lastPayoutDate: null,
        completedBookings: 0,
        averageRating: null,
      };
    }
  },
  
  /**
   * Update the cleaner's earnings summary to reflect recent changes
   * This should be called whenever a booking is completed or a payment is made
   */
  async updateCleanerEarningsSummary(cleanerId: string): Promise<void> {
    try {
      // Calculate latest earnings 
      const summary = await this.calculateEarningsSummary(cleanerId);
      
      // Check if summary record exists
      const [existingSummary] = await db
        .select({ id: cleanerPayoutSummary.id })
        .from(cleanerPayoutSummary)
        .where(eq(cleanerPayoutSummary.cleanerId, cleanerId))
        .limit(1);
        
      if (existingSummary) {
        // Update existing summary
        await db
          .update(cleanerPayoutSummary)
          .set({
            totalEarnings: summary.totalEarnings.toString(),
            totalCommission: summary.totalCommission.toString(),
            totalPayout: summary.totalPayout.toString(),
            pendingPayout: summary.pendingPayout.toString(),
            totalEarningsCurrentMonth: summary.currentMonthEarnings.toString(),
            totalEarningsLastMonth: summary.lastMonthEarnings.toString(),
            totalEarningsThisYear: summary.yearToDateEarnings.toString(),
            lastPayoutAmount: summary.lastPayoutAmount?.toString() || null,
            lastPayoutDate: summary.lastPayoutDate,
            lastUpdated: new Date()
          })
          .where(eq(cleanerPayoutSummary.id, existingSummary.id));
      } else {
        // Create new summary record
        await db
          .insert(cleanerPayoutSummary)
          .values({
            id: crypto.randomUUID(),
            cleanerId,
            totalEarnings: summary.totalEarnings.toString(),
            totalCommission: summary.totalCommission.toString(),
            totalPayout: summary.totalPayout.toString(),
            pendingPayout: summary.pendingPayout.toString(),
            totalEarningsCurrentMonth: summary.currentMonthEarnings.toString(),
            totalEarningsLastMonth: summary.lastMonthEarnings.toString(),
            totalEarningsThisYear: summary.yearToDateEarnings.toString(),
            lastPayoutAmount: summary.lastPayoutAmount?.toString() || null,
            lastPayoutDate: summary.lastPayoutDate,
            lastUpdated: new Date()
          });
      }
    } catch (error) {
      console.error("Error updating cleaner earnings summary:", error);
    }
  },
  
  /**
   * Record a payout to a cleaner
   * 
   * @param cleanerId The cleaner receiving payment
   * @param amount The amount being paid out
   * @param paymentIds Array of payment IDs being marked as paid
   * @returns Success flag
   */
  async recordCleanerPayout(cleanerId: string, amount: number, paymentIds: string[]): Promise<boolean> {
    try {
      // Update all the specified payments
      await db
        .update(payment)
        .set({
          isPaidToProvider: true,
          providerPayoutDate: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          payment.id.in(paymentIds),
          eq(payment.status, "COMPLETED")
        ));
        
      // Update the summary
      await this.updateCleanerEarningsSummary(cleanerId);
      
      return true;
    } catch (error) {
      console.error("Error recording cleaner payout:", error);
      return false;
    }
  }
};
