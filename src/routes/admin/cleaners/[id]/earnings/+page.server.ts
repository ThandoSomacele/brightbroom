// src/routes/admin/cleaners/[id]/earnings/+page.server.ts
import { db } from "$lib/server/db";
import { booking, payment, user } from "$lib/server/db/schema";
import { cleanerEarningsService } from "$lib/server/services/cleaner-earnings.service";
import { error, fail, redirect } from "@sveltejs/kit";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
  // Ensure admin access
  if (!locals.user || locals.user.role !== "ADMIN") {
    throw redirect(302, "/auth/login?redirectTo=/admin");
  }

  const cleanerId = params.id;
  if (!cleanerId) {
    throw error(404, "Cleaner not found");
  }

  try {
    // Get cleaner details
    const userResults = await db
      .select()
      .from(user)
      .where(and(eq(user.id, cleanerId), eq(user.role, "CLEANER")))
      .limit(1);

    if (userResults.length === 0) {
      throw error(404, "Cleaner not found");
    }

    const cleanerData = userResults[0];

    // Get earnings summary
    const earningsSummary = await cleanerEarningsService.getCleanerEarningsSummary(cleanerId);

    // Get upcoming/potential earnings
    const upcomingEarnings = await cleanerEarningsService.getUpcomingEarnings(cleanerId);

    // Get payment history with PayFast fee
    const paymentHistory = await db
      .select({
        id: payment.id,
        bookingId: payment.bookingId,
        amount: payment.amount,
        payFastFee: payment.payFastFeeAmount,
        commission: payment.platformCommissionAmount,
        commissionRate: payment.platformCommissionRate,
        payout: payment.cleanerPayoutAmount,
        status: payment.status,
        isPaid: payment.isPaidToProvider,
        payoutDate: payment.providerPayoutDate,
        createdAt: payment.createdAt,
      })
      .from(payment)
      .innerJoin(booking, eq(payment.bookingId, booking.id))
      .where(and(
        eq(booking.cleanerId, cleanerId),
        eq(payment.status, "COMPLETED")
      ))
      .orderBy(desc(payment.createdAt))
      .limit(50);

    // Get pending payouts
    const pendingPayouts = await db
      .select({
        id: payment.id,
        bookingId: payment.bookingId,
        amount: payment.cleanerPayoutAmount,
        createdAt: payment.createdAt,
      })
      .from(payment)
      .innerJoin(booking, eq(payment.bookingId, booking.id))
      .where(and(
        eq(booking.cleanerId, cleanerId),
        eq(payment.status, "COMPLETED"),
        eq(payment.isPaidToProvider, false)
      ))
      .orderBy(desc(payment.createdAt));

    return {
      cleaner: cleanerData,
      earnings: earningsSummary,
      upcomingEarnings,
      paymentHistory,
      pendingPayouts,
    };
  } catch (err) {
    console.error("Error loading cleaner earnings:", err);
    throw error(500, "Error loading cleaner earnings");
  }
};

export const actions: Actions = {
  // Process payout to cleaner
  processPayout: async ({ params, request }) => {
    const cleanerId = params.id;
    
    if (!cleanerId) {
      return fail(400, { error: "Cleaner ID is required" });
    }
    
    // Process form data
    const formData = await request.formData();
    const paymentIdsString = formData.get("paymentIds")?.toString();
    
    if (!paymentIdsString) {
      return fail(400, { error: "No payments selected for payout" });
    }
    
    try {
      // Parse payment IDs
      const paymentIds = JSON.parse(paymentIdsString) as string[];
      
      if (!paymentIds.length) {
        return fail(400, { error: "No payments selected for payout" });
      }
      
      // Calculate total payout amount
      const payoutResult = await db
        .select({
          totalAmount: db.fn.sum(payment.cleanerPayoutAmount)
        })
        .from(payment)
        .where(and(
          inArray(payment.id, paymentIds),
          eq(payment.status, "COMPLETED"),
          eq(payment.isPaidToProvider, false)
        ));
        
      const payoutAmount = Number(payoutResult[0]?.totalAmount || 0);
      
      if (payoutAmount <= 0) {
        return fail(400, { error: "Invalid payout amount or selected payments already processed" });
      }
      
      // Record the payout
      const success = await cleanerEarningsService.recordCleanerPayout(
        cleanerId, 
        payoutAmount, 
        paymentIds
      );
      
      if (!success) {
        return fail(500, { error: "Failed to process payout" });
      }
      
      return {
        success: true,
        message: `Successfully processed payout of R${payoutAmount.toFixed(2)}`,
        amount: payoutAmount
      };
    } catch (error) {
      console.error("Error processing payout:", error);
      return fail(500, { 
        error: error instanceof Error ? error.message : "Failed to process payout" 
      });
    }
  }
};
