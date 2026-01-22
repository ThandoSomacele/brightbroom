// scripts/backfill-payout-amounts.ts
// Backfill cleanerPayoutAmount for past payments that don't have it set
import { db } from "../src/lib/server/db";
import { payment } from "../src/lib/server/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { calculatePayout, type PaymentMethodType, PLATFORM_COMMISSION_RATE } from "../src/lib/utils/payout-calculator";

async function backfillPayoutAmounts() {
  console.log("Starting backfill of cleaner payout amounts...\n");

  // Get all completed payments with NULL cleanerPayoutAmount
  const paymentsToUpdate = await db
    .select({
      id: payment.id,
      bookingId: payment.bookingId,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
    })
    .from(payment)
    .where(
      and(
        eq(payment.status, "COMPLETED"),
        isNull(payment.cleanerPayoutAmount)
      )
    );

  console.log(`Found ${paymentsToUpdate.length} payments to backfill\n`);

  if (paymentsToUpdate.length === 0) {
    console.log("No payments need backfilling. Exiting.");
    process.exit(0);
  }

  let updated = 0;
  let errors = 0;

  for (const p of paymentsToUpdate) {
    try {
      const amount = typeof p.amount === "string" ? parseFloat(p.amount) : Number(p.amount);
      const paymentMethod = (p.paymentMethod || "CREDIT_CARD") as PaymentMethodType;

      // Calculate payout using the standard formula
      const breakdown = calculatePayout(amount, paymentMethod);

      console.log(`Payment ${p.id}:`);
      console.log(`  Amount: R${amount.toFixed(2)}`);
      console.log(`  Payment Method: ${paymentMethod}`);
      console.log(`  PayFast Fee: R${breakdown.payFastFee.toFixed(2)}`);
      console.log(`  Commission (${(breakdown.commissionRate * 100).toFixed(0)}%): R${breakdown.commissionAmount.toFixed(2)}`);
      console.log(`  Cleaner Payout: R${breakdown.cleanerPayout.toFixed(2)}`);

      // Update the payment record
      await db
        .update(payment)
        .set({
          platformCommissionRate: (PLATFORM_COMMISSION_RATE * 100).toFixed(2),
          platformCommissionAmount: breakdown.commissionAmount.toFixed(2),
          payFastFeeAmount: breakdown.payFastFee.toFixed(2),
          cleanerPayoutAmount: breakdown.cleanerPayout.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(payment.id, p.id));

      console.log(`  ✓ Updated successfully\n`);
      updated++;
    } catch (error) {
      console.error(`  ✗ Error updating payment ${p.id}:`, error);
      errors++;
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Total payments processed: ${paymentsToUpdate.length}`);
  console.log(`Successfully updated: ${updated}`);
  console.log(`Errors: ${errors}`);

  process.exit(errors > 0 ? 1 : 0);
}

backfillPayoutAmounts().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
