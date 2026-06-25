// src/routes/admin/cleaners/[id]/earnings/+page.server.ts
import { db } from "$lib/server/db";
import { booking, payment, user } from "$lib/server/db/schema";
import { cleanerEarningsService } from "$lib/server/services/cleaner-earnings.service";
import {
  calculatePayout,
  resolveCleanerPayout,
  type PaymentMethodType,
} from "$lib/utils/payout-calculator";
import { error, fail, redirect } from "@sveltejs/kit";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";

/**
 * Run an optional query, degrading to a fallback (and logging) on failure.
 * Keeps the earnings page rendering even if a secondary query fails — e.g. a
 * payout column missing on an un-migrated database — instead of returning a 500.
 */
async function safeQuery<T>(
  promise: PromiseLike<T>,
  fallback: T,
  label: string,
): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    console.error(`[cleaner-earnings] ${label} failed:`, err);
    return fallback;
  }
}

export const load: PageServerLoad = async ({ params, locals }) => {
  // Ensure admin access
  if (!locals.user || locals.user.role !== "ADMIN") {
    throw redirect(302, "/auth/login?redirectTo=/admin");
  }

  const cleanerId = params.id;
  if (!cleanerId) {
    throw error(404, "Cleaner not found");
  }

  // Get cleaner details. A genuine "not found" must surface as a 404 — it is
  // intentionally NOT wrapped in a try/catch that would mask it as a 500.
  const userResults = await db
    .select()
    .from(user)
    .where(and(eq(user.id, cleanerId), eq(user.role, "CLEANER")))
    .limit(1);

  if (userResults.length === 0) {
    throw error(404, "Cleaner not found");
  }

  const cleanerData = userResults[0];

  // Earnings summaries already fail-safe internally (return defaults on error).
  const earningsSummary = await cleanerEarningsService.getCleanerEarningsSummary(cleanerId);
  const upcomingEarnings = await cleanerEarningsService.getUpcomingEarnings(cleanerId);

  // Payment history with PayFast fee — guarded so a query error degrades to an
  // empty list rather than crashing the page.
  const paymentHistoryRaw = await safeQuery(
    db
      .select({
        id: payment.id,
        bookingId: payment.bookingId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
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
      .limit(50),
    [],
    "paymentHistory",
  );

  // Resolve the fee/commission/payout breakdown for display: older payments
  // never had these persisted (null), so fall back to the canonical calculation
  // so the history table matches the summary and pending-payout figures.
  const paymentHistory = paymentHistoryRaw.map((p) => {
    const estimate = calculatePayout(
      Number(p.amount) || 0,
      (p.paymentMethod as PaymentMethodType) || "CREDIT_CARD",
    );
    return {
      ...p,
      payFastFee: p.payFastFee != null ? Number(p.payFastFee) : estimate.payFastFee,
      commission: p.commission != null ? Number(p.commission) : estimate.commissionAmount,
      payout: p.payout != null ? Number(p.payout) : estimate.cleanerPayout,
    };
  });

  // Pending payouts — same guarding. cleanerPayoutAmount may be null on older
  // payments, so resolve the real payout (matching the processPayout action)
  // instead of passing null through to the page.
  const pendingRaw = await safeQuery(
    db
      .select({
        id: payment.id,
        bookingId: payment.bookingId,
        gross: payment.amount,
        paymentMethod: payment.paymentMethod,
        storedPayout: payment.cleanerPayoutAmount,
        createdAt: payment.createdAt,
      })
      .from(payment)
      .innerJoin(booking, eq(payment.bookingId, booking.id))
      .where(and(
        eq(booking.cleanerId, cleanerId),
        eq(payment.status, "COMPLETED"),
        eq(payment.isPaidToProvider, false)
      ))
      .orderBy(desc(payment.createdAt)),
    [],
    "pendingPayouts",
  );

  const pendingPayouts = pendingRaw.map((p) => ({
    id: p.id,
    bookingId: p.bookingId,
    amount: resolveCleanerPayout(p.gross, p.paymentMethod, p.storedPayout),
    createdAt: p.createdAt,
  }));

  return {
    cleaner: cleanerData,
    earnings: earningsSummary,
    upcomingEarnings,
    paymentHistory,
    pendingPayouts,
  };
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
      
      // Calculate total payout amount. cleanerPayoutAmount may be null on older
      // payments, so fall back to computing it from amount + method.
      const selectedPayments = await db
        .select({
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          cleanerPayoutAmount: payment.cleanerPayoutAmount,
        })
        .from(payment)
        .where(and(
          inArray(payment.id, paymentIds),
          eq(payment.status, "COMPLETED"),
          eq(payment.isPaidToProvider, false)
        ));

      const payoutAmount = selectedPayments.reduce(
        (sum, p) => sum + resolveCleanerPayout(p.amount, p.paymentMethod, p.cleanerPayoutAmount),
        0,
      );
      
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
