// src/routes/api/subscriptions/process-recurring/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { subscription, subscriptionPayment, booking } from '$lib/server/db/schema';
import { payFastSubscriptionService } from '$lib/server/services/payfast-subscription';
import { tenantService } from '$lib/server/services/tenant.service';
import { and, eq, lte, or } from 'drizzle-orm';
import crypto from 'crypto';
import { toNaiveDateTimeString } from '$lib/utils/date-utils';

/**
 * Bill every subscription whose cycle has come due, on the customer's actual
 * schedule (weekly, biweekly, twice weekly, twice monthly - the cycles
 * PayFast cannot bill natively). Runs daily; CSRF-exempt in hooks.server.ts.
 *
 * Money code, so the shape matters:
 *
 * - One payment record per cycle, keyed by a deterministic id derived from
 *   the cycle date. A crashed or double-fired run cannot charge the same
 *   cycle twice: a COMPLETED row means skip, and a PENDING row left by a
 *   run that died mid-charge means "may or may not have been charged" and is
 *   flagged for a human instead of retried blindly.
 * - The cycle's own due date drives the schedule, not the moment the cron
 *   happened to run - a charge that lands two days late does not shift every
 *   later cycle by two days.
 * - A subscription more than STALE_CYCLE_DAYS overdue is paused rather than
 *   charged. Nobody expects a surprise catch-up debit for a cycle from weeks
 *   ago; a human decides what happens to those.
 */
const STALE_CYCLE_DAYS = 14;

export const POST: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    console.log('[Recurring Charge] Processing subscriptions due on:', now.toISOString());

    const dueSubscriptions = await db
      .select()
      .from(subscription)
      .where(
        and(
          eq(subscription.status, 'ACTIVE'),
          lte(subscription.nextBillingDate, now),
          or(
            eq(subscription.frequency, 'WEEKLY'),
            eq(subscription.frequency, 'BIWEEKLY'),
            eq(subscription.frequency, 'TWICE_WEEKLY'),
            eq(subscription.frequency, 'TWICE_MONTHLY')
          )
        )
      );

    console.log(`[Recurring Charge] Found ${dueSubscriptions.length} subscriptions due for charging`);

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [] as Array<{ subscriptionId: string; error: string }>,
    };

    for (const sub of dueSubscriptions) {
      results.processed++;

      try {
        if (!sub.payFastToken) {
          results.failed++;
          results.errors.push({ subscriptionId: sub.id, error: 'No PayFast token available' });
          console.error(`[Recurring Charge] Subscription ${sub.id} has no PayFast token`);
          continue;
        }

        const cycleDate = sub.nextBillingDate ?? now;

        // A cycle that has sat unpaid for weeks is a conversation, not a debit
        const daysOverdue = (now.getTime() - cycleDate.getTime()) / 86_400_000;
        if (daysOverdue > STALE_CYCLE_DAYS) {
          await db
            .update(subscription)
            .set({
              status: 'PAUSED',
              pausedAt: now,
              notes: `${sub.notes ? sub.notes + '\n' : ''}Paused by billing: cycle of ${cycleDate.toISOString().slice(0, 10)} was ${Math.floor(daysOverdue)} days overdue`,
              updatedAt: now,
            })
            .where(eq(subscription.id, sub.id));
          results.skipped++;
          results.errors.push({
            subscriptionId: sub.id,
            error: `Paused: cycle ${Math.floor(daysOverdue)} days overdue - needs manual review`,
          });
          continue;
        }

        // One record per cycle. The deterministic id is the idempotency lock,
        // and it travels to PayFast as m_payment_id so the ITN resolves back
        // to this row.
        const cycleId = `rc-${cycleDate.toISOString().slice(0, 10).replace(/-/g, '')}-${sub.id}`;

        const [existing] = await db
          .select()
          .from(subscriptionPayment)
          .where(eq(subscriptionPayment.id, cycleId))
          .limit(1);

        if (existing?.status === 'COMPLETED') {
          results.skipped++;
          continue; // already charged this cycle
        }
        if (existing && existing.status !== 'FAILED') {
          // A PENDING row from a run that died mid-charge: the charge may or
          // may not have gone through. Never re-charge on a guess.
          results.skipped++;
          results.errors.push({
            subscriptionId: sub.id,
            error: `Cycle ${cycleId} has an unresolved attempt - check PayFast before retrying`,
          });
          continue;
        }

        const nextBillingDate = payFastSubscriptionService.calculateNextBillingDate(
          sub.frequency,
          cycleDate,
          sub.preferredDays || undefined
        );

        if (existing) {
          // Previous attempt failed; try again under the same cycle id
          await db
            .update(subscriptionPayment)
            .set({ status: 'PENDING' })
            .where(eq(subscriptionPayment.id, cycleId));
        } else {
          await db.insert(subscriptionPayment).values({
            id: cycleId,
            subscriptionId: sub.id,
            amount: sub.finalPrice,
            status: 'PENDING',
            paymentMethod: 'CREDIT_CARD',
            billingPeriodStart: cycleDate,
            billingPeriodEnd: nextBillingDate,
          });
        }

        console.log(`[Recurring Charge] Charging ${sub.id} (${sub.frequency}) for cycle ${cycleDate.toISOString().slice(0, 10)}`);
        const charge = await payFastSubscriptionService.chargeSubscriptionCycle(
          sub,
          sub.payFastToken,
          cycleId
        );

        if (charge.ok) {
          // The cleaning this charge pays for
          const bookingId = crypto.randomBytes(16).toString('hex');
          const scheduledDate = toNaiveDateTimeString(
            payFastSubscriptionService.calculateNextCleaningDate(
              sub.frequency,
              sub.preferredDays || [],
              sub.monthlyDates || [],
              sub.preferredTimeSlot || '09:00-12:00',
              sub.startDate
            )
          );

          const bookingTenantId = await tenantService.resolveBookingTenantId(
            sub.cleanerId || null,
          );

          await db.insert(booking).values({
            id: bookingId,
            userId: sub.userId,
            addressId: sub.addressId,
            serviceId: sub.serviceId,
            cleanerId: sub.cleanerId || null,
            tenantId: bookingTenantId,
            subscriptionId: sub.id,
            status: 'CONFIRMED',
            scheduledDate,
            duration: 180, // 3 hours default
            price: sub.finalPrice,
            notes: `Recurring booking - ${sub.frequency}`,
          });

          await db
            .update(subscriptionPayment)
            .set({
              status: 'COMPLETED',
              bookingId,
              payFastPaymentId: charge.pfPaymentId,
              payFastReference: charge.pfPaymentId,
              processedAt: now,
            })
            .where(eq(subscriptionPayment.id, cycleId));

          await db
            .update(subscription)
            .set({ nextBillingDate, updatedAt: now })
            .where(eq(subscription.id, sub.id));

          results.succeeded++;
          console.log(`[Recurring Charge] Charged ${sub.id}; booking ${bookingId} for ${scheduledDate}`);
        } else {
          await db
            .update(subscriptionPayment)
            .set({
              status: 'FAILED',
              failureReason: charge.detail.slice(0, 1000),
              processedAt: now,
            })
            .where(eq(subscriptionPayment.id, cycleId));

          results.failed++;
          results.errors.push({ subscriptionId: sub.id, error: charge.detail.slice(0, 200) });
          console.error(`[Recurring Charge] Charge failed for ${sub.id}: ${charge.detail}`);
        }
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({ subscriptionId: sub.id, error: errorMessage });
        console.error(`[Recurring Charge] Error processing subscription ${sub.id}:`, error);
      }
    }

    console.log('[Recurring Charge] Processing complete:', results);

    return json({ success: true, results });
  } catch (error) {
    console.error('[Recurring Charge] Fatal error:', error);
    return json(
      {
        error: 'Failed to process recurring charges',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};
