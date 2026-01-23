// src/routes/admin/payouts/+page.server.ts
import { db } from "$lib/server/db";
import {
  booking,
  cleanerProfile,
  payment,
  user,
} from "$lib/server/db/schema";
import { fail } from "@sveltejs/kit";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";

// Helper function to get payout data
async function getPayoutData() {
  try {
    // Step 1: Get all active cleaners with profiles
    const cleaners = await db
      .select({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        payoutMethod: cleanerProfile.payoutMethod,
        bankName: cleanerProfile.bankName,
        bankAccountNumber: cleanerProfile.bankAccountNumber,
        bankBranchCode: cleanerProfile.bankBranchCode,
        bankAccountType: cleanerProfile.bankAccountType,
        bankAccountHolder: cleanerProfile.bankAccountHolder,
      })
      .from(user)
      .innerJoin(cleanerProfile, eq(cleanerProfile.userId, user.id))
      .where(and(eq(user.role, "CLEANER"), eq(user.isActive, true)));

    // Step 2: Get pending payouts for each cleaner
    const pendingPayoutsQuery = await db
      .select({
        cleanerId: booking.cleanerId,
        pendingPayout: sql<string>`COALESCE(SUM(${payment.cleanerPayoutAmount}), 0)`,
        pendingBookingsCount: sql<number>`COUNT(*)`,
      })
      .from(payment)
      .innerJoin(booking, eq(booking.id, payment.bookingId))
      .where(
        and(
          eq(payment.status, "COMPLETED"),
          eq(payment.isPaidToProvider, false)
        )
      )
      .groupBy(booking.cleanerId);

    // Create a map of cleaner ID to pending payout data
    const pendingPayoutsMap = new Map<string, { pendingPayout: string; pendingBookingsCount: number }>();
    pendingPayoutsQuery.forEach((row) => {
      if (row.cleanerId) {
        pendingPayoutsMap.set(row.cleanerId, {
          pendingPayout: row.pendingPayout,
          pendingBookingsCount: Number(row.pendingBookingsCount) || 0,
        });
      }
    });

    // Combine data
    const cleanersWithPayouts = cleaners.map((cleaner) => {
      const payoutData = pendingPayoutsMap.get(cleaner.id);
      return {
        ...cleaner,
        pendingPayout: payoutData?.pendingPayout || "0",
        pendingBookingsCount: payoutData?.pendingBookingsCount || 0,
      };
    });

    // Sort by pending payout descending
    cleanersWithPayouts.sort((a, b) =>
      Number(b.pendingPayout) - Number(a.pendingPayout)
    );

    // Step 3: Get recent paid payments for history display
    const recentPaidPayments = await db
      .select({
        id: payment.id,
        cleanerId: booking.cleanerId,
        cleanerFirstName: user.firstName,
        cleanerLastName: user.lastName,
        bookingId: payment.bookingId,
        amount: payment.amount,
        cleanerPayoutAmount: payment.cleanerPayoutAmount,
        paidDate: payment.providerPayoutDate,
      })
      .from(payment)
      .innerJoin(booking, eq(booking.id, payment.bookingId))
      .innerJoin(user, eq(user.id, booking.cleanerId))
      .where(eq(payment.isPaidToProvider, true))
      .orderBy(desc(payment.providerPayoutDate))
      .limit(50);

    // Calculate totals
    const totals = {
      eftTotal: 0,
      eftCount: 0,
      instantMoneyTotal: 0,
      instantMoneyCount: 0,
    };

    cleanersWithPayouts.forEach((cleaner) => {
      const amount = Number(cleaner.pendingPayout) || 0;
      if (amount > 0) {
        if (cleaner.payoutMethod === "EFT") {
          totals.eftTotal += amount;
          totals.eftCount++;
        } else {
          totals.instantMoneyTotal += amount;
          totals.instantMoneyCount++;
        }
      }
    });

    return {
      cleaners: cleanersWithPayouts,
      recentPayouts: recentPaidPayments,
      totals,
    };
  } catch (err) {
    console.error("Error loading payout data:", err);
    return {
      cleaners: [],
      recentPayouts: [],
      totals: {
        eftTotal: 0,
        eftCount: 0,
        instantMoneyTotal: 0,
        instantMoneyCount: 0,
      },
    };
  }
}

export const load: PageServerLoad = async () => {
  // Return streamed data
  return {
    streamed: {
      payoutData: getPayoutData(),
    },
  };
};

export const actions: Actions = {
  // Mark selected payouts as paid
  markAsPaid: async ({ request }) => {
    const formData = await request.formData();
    const cleanerIdsJson = formData.get("cleanerIds")?.toString();
    const payoutReference = formData.get("payoutReference")?.toString();

    if (!cleanerIdsJson) {
      return fail(400, { error: "No cleaners selected" });
    }

    let cleanerIds: string[] = [];
    try {
      cleanerIds = JSON.parse(cleanerIdsJson);
    } catch (e) {
      return fail(400, { error: "Invalid cleaner selection" });
    }

    if (cleanerIds.length === 0) {
      return fail(400, { error: "No cleaners selected" });
    }

    try {
      const now = new Date();
      let totalProcessed = 0;

      for (const cleanerId of cleanerIds) {
        const unpaidPayments = await db
          .select({
            paymentId: payment.id,
          })
          .from(payment)
          .innerJoin(booking, eq(booking.id, payment.bookingId))
          .where(
            and(
              eq(booking.cleanerId, cleanerId),
              eq(payment.status, "COMPLETED"),
              eq(payment.isPaidToProvider, false)
            )
          );

        if (unpaidPayments.length === 0) continue;

        const paymentIds = unpaidPayments.map((p) => p.paymentId);
        await db
          .update(payment)
          .set({
            isPaidToProvider: true,
            providerPayoutDate: now,
            updatedAt: now,
          })
          .where(inArray(payment.id, paymentIds));

        totalProcessed++;
      }

      return {
        success: true,
        message: `Successfully marked ${totalProcessed} cleaner(s) as paid`,
      };
    } catch (err) {
      console.error("Error marking payouts as paid:", err);
      return fail(500, { error: "Failed to process payouts" });
    }
  },
};
