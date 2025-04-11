// src/lib/server/services/cleaner-earnings.service.ts
import { db } from "$lib/server/db";
import { booking, cleanerPayoutSummary, payment, user } from "$lib/server/db/schema";
import { and, eq, gte, lt, desc, sum, sql } from "drizzle-orm";

/**
 * Service for managing cleaner earnings and payouts
 */
export const cleanerEarningsService = {
  /**
   * Get a summary of a cleaner's earnings
   * @param cleanerId The cleaner's user ID
   */
  async getCleanerEarningsSummary(cleanerId: string): Promise<{
    totalEarnings: number;
    totalCommission: number;
    totalPayout: number;
    pendingPayout: number;
    completedBookings: number;
    currentMonthEarnings: number;
    lastMonthEarnings: number;
    yearToDateEarnings: number;
    lastPayoutAmount: number | null;
    lastPayoutDate: Date | null;
  }> {
    try {
      // First, check if we have a summary record in cleanerPayoutSummary
      const summaryRecords = await db
        .select()
        .from(cleanerPayoutSummary)
        .where(eq(cleanerPayoutSummary.cleanerId, cleanerId))
        .limit(1);

      if (summaryRecords && summaryRecords.length > 0) {
        // Return data from the summary table
        const summary = summaryRecords[0];
        
        return {
          totalEarnings: Number(summary.totalEarnings) || 0,
          totalCommission: Number(summary.totalCommission) || 0,
          totalPayout: Number(summary.totalPayout) || 0,
          pendingPayout: Number(summary.pendingPayout) || 0,
          completedBookings: 0, // This might need to be calculated separately
          currentMonthEarnings: Number(summary.totalEarningsCurrentMonth) || 0,
          lastMonthEarnings: Number(summary.totalEarningsLastMonth) || 0,
          yearToDateEarnings: Number(summary.totalEarningsThisYear) || 0,
          lastPayoutAmount: summary.lastPayoutAmount ? Number(summary.lastPayoutAmount) : null,
          lastPayoutDate: summary.lastPayoutDate || null,
        };
      }

      // If no summary exists, calculate from payment records
      // Get completed bookings associated with this cleaner
      const completedBookings = await db
        .select()
        .from(booking)
        .where(and(
          eq(booking.cleanerId, cleanerId),
          eq(booking.status, "COMPLETED")
        ));
      
      // Get all payments for these bookings
      let bookingIds = completedBookings.map(booking => booking.id);
      
      // Default values if no bookings/payments exist
      if (bookingIds.length === 0) {
        return {
          totalEarnings: 0,
          totalCommission: 0,
          totalPayout: 0,
          pendingPayout: 0,
          completedBookings: 0,
          currentMonthEarnings: 0,
          lastMonthEarnings: 0,
          yearToDateEarnings: 0,
          lastPayoutAmount: null,
          lastPayoutDate: null,
        };
      }

      // Get payments for these bookings
      const payments = await db
        .select()
        .from(payment)
        .where(and(
          payment.bookingId.in(bookingIds),
          eq(payment.status, "COMPLETED")
        ));

      // Calculate totals
      let totalEarnings = 0;
      let totalCommission = 0;
      let totalPayout = 0;
      let pendingPayout = 0;

      for (const pymt of payments) {
        totalEarnings += Number(pymt.amount) || 0;
        totalCommission += Number(pymt.platformCommissionAmount) || 0;
        totalPayout += Number(pymt.cleanerPayoutAmount) || 0;
        
        // Add to pending payout if not yet paid to cleaner
        if (!pymt.isPaidToProvider) {
          pendingPayout += Number(pymt.cleanerPayoutAmount) || 0;
        }
      }
      
      // Get current month data
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      // Get last month data
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      
      // Get year-to-date data
      const yearStart = new Date(now.getFullYear(), 0, 1);
      
      // Filter payments by date ranges
      const currentMonthPayments = payments.filter(p => {
        const date = new Date(p.createdAt);
        return date >= currentMonthStart && date <= currentMonthEnd;
      });
      
      const lastMonthPayments = payments.filter(p => {
        const date = new Date(p.createdAt);
        return date >= lastMonthStart && date <= lastMonthEnd;
      });
      
      const yearToDatePayments = payments.filter(p => {
        const date = new Date(p.createdAt);
        return date >= yearStart;
      });
      
      // Calculate sums
      const currentMonthEarnings = currentMonthPayments.reduce(
        (sum, p) => sum + Number(p.cleanerPayoutAmount || 0), 0
      );
      
      const lastMonthEarnings = lastMonthPayments.reduce(
        (sum, p) => sum + Number(p.cleanerPayoutAmount || 0), 0
      );
      
      const yearToDateEarnings = yearToDatePayments.reduce(
        (sum, p) => sum + Number(p.cleanerPayoutAmount || 0), 0
      );
      
      // Get last payout details (find the most recent payment that was paid to provider)
      const paidPayments = payments
        .filter(p => p.isPaidToProvider)
        .sort((a, b) => new Date(b.providerPayoutDate || 0).getTime() - new Date(a.providerPayoutDate || 0).getTime());
      
      const lastPayoutAmount = paidPayments.length > 0 ? Number(paidPayments[0].cleanerPayoutAmount) : null;
      const lastPayoutDate = paidPayments.length > 0 ? new Date(paidPayments[0].providerPayoutDate || "") : null;
      
      // Create or update the summary record for future use
      try {
        const existingRecords = await db
          .select({ id: cleanerPayoutSummary.id })
          .from(cleanerPayoutSummary)
          .where(eq(cleanerPayoutSummary.cleanerId, cleanerId));
        
        if (existingRecords.length === 0) {
          // Create new summary
          await db.insert(cleanerPayoutSummary).values({
            id: crypto.randomUUID(),
            cleanerId,
            totalEarnings,
            totalCommission,
            totalPayout,
            pendingPayout,
            totalEarningsCurrentMonth: currentMonthEarnings,
            totalEarningsLastMonth: lastMonthEarnings,
            totalEarningsThisYear: yearToDateEarnings,
            lastPayoutAmount,
            lastPayoutDate,
            lastUpdated: new Date()
          });
        } else {
          // Update existing summary
          await db.update(cleanerPayoutSummary)
            .set({
              totalEarnings,
              totalCommission,
              totalPayout,
              pendingPayout,
              totalEarningsCurrentMonth: currentMonthEarnings,
              totalEarningsLastMonth: lastMonthEarnings,
              totalEarningsThisYear: yearToDateEarnings,
              lastPayoutAmount,
              lastPayoutDate,
              lastUpdated: new Date()
            })
            .where(eq(cleanerPayoutSummary.id, existingRecords[0].id));
        }
      } catch (summaryError) {
        console.error("Error updating earnings summary:", summaryError);
        // Continue without throwing - this is just a cache/optimization
      }

      return {
        totalEarnings,
        totalCommission,
        totalPayout,
        pendingPayout,
        completedBookings: completedBookings.length,
        currentMonthEarnings,
        lastMonthEarnings,
        yearToDateEarnings,
        lastPayoutAmount,
        lastPayoutDate,
      };
    } catch (error) {
      console.error("Error getting cleaner earnings summary:", error);
      
      // Return default values if there's an error
      return {
        totalEarnings: 0,
        totalCommission: 0,
        totalPayout: 0,
        pendingPayout: 0,
        completedBookings: 0,
        currentMonthEarnings: 0,
        lastMonthEarnings: 0,
        yearToDateEarnings: 0,
        lastPayoutAmount: null,
        lastPayoutDate: null,
      };
    }
  },

  /**
   * Record a payout to a cleaner for multiple payments
   * @param cleanerId The cleaner's user ID
   * @param amount Total amount being paid out
   * @param paymentIds Array of payment IDs that are being paid out
   * @returns Success status
   */
  async recordCleanerPayout(
    cleanerId: string, 
    amount: number, 
    paymentIds: string[]
  ): Promise<boolean> {
    try {
      // 1. Mark payments as paid out
      const now = new Date();
      
      await db.update(payment)
        .set({ 
          isPaidToProvider: true,
          providerPayoutDate: now
        })
        .where(and(
          payment.id.in(paymentIds),
          eq(payment.status, "COMPLETED")
        ));
      
      // 2. Update the cleaner payout summary if it exists
      const summaryRecords = await db
        .select({ id: cleanerPayoutSummary.id })
        .from(cleanerPayoutSummary)
        .where(eq(cleanerPayoutSummary.cleanerId, cleanerId));
      
      if (summaryRecords.length > 0) {
        await db.update(cleanerPayoutSummary)
          .set({
            pendingPayout: sql`${cleanerPayoutSummary.pendingPayout} - ${amount}`,
            lastPayoutAmount: amount,
            lastPayoutDate: now,
            lastUpdated: now
          })
          .where(eq(cleanerPayoutSummary.id, summaryRecords[0].id));
      }
      
      return true;
    } catch (error) {
      console.error("Error recording cleaner payout:", error);
      return false;
    }
  }
};
