// src/routes/api/subscriptions/process-recurring/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { subscription, subscriptionPayment, booking } from '$lib/server/db/schema';
import { payFastSubscriptionService } from '$lib/server/services/payfast-subscription';
import { and, eq, lte, or } from 'drizzle-orm';
import crypto from 'crypto';

// This endpoint processes subscriptions that are due for recurring charges
// CSRF protection is exempted in hooks.server.ts for this endpoint
// It should be called by a cron job (e.g., Netlify scheduled functions, external cron service)
export const POST: RequestHandler = async ({ request }) => {
  try {
    // Optional: Add authentication/authorization check here
    // For example, verify a secret token to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    console.log('[Recurring Charge] Processing subscriptions due on:', now.toISOString());

    // Get all active subscriptions that are due for payment
    // These are subscriptions where nextBillingDate is today or in the past
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
      errors: [] as Array<{ subscriptionId: string; error: string }>,
    };

    // Process each subscription
    for (const sub of dueSubscriptions) {
      results.processed++;

      try {
        // Check if subscription has a PayFast token
        if (!sub.payFastToken) {
          console.error(`[Recurring Charge] Subscription ${sub.id} has no PayFast token`);
          results.failed++;
          results.errors.push({
            subscriptionId: sub.id,
            error: 'No PayFast token available',
          });
          continue;
        }

        console.log(`[Recurring Charge] Processing subscription ${sub.id} (${sub.frequency})`);

        // Attempt to charge the customer using the ad hoc token
        const chargeSuccess = await payFastSubscriptionService.processCustomRecurringPayment(
          sub,
          sub.payFastToken
        );

        if (chargeSuccess) {
          // Calculate next billing date
          const nextBillingDate = payFastSubscriptionService.calculateNextBillingDate(
            sub.frequency,
            now,
            sub.preferredDays || undefined,
            sub.monthlyDates || undefined
          );

          // Create a booking for the next scheduled cleaning
          const bookingId = crypto.randomBytes(16).toString('hex');
          const scheduledDate = calculateNextCleaningDate(
            sub.frequency,
            sub.preferredDays || [],
            sub.monthlyDates || [],
            sub.preferredTimeSlot || '09:00-12:00'
          );

          await db.insert(booking).values({
            id: bookingId,
            userId: sub.userId,
            addressId: sub.addressId,
            serviceId: sub.serviceId,
            cleanerId: sub.cleanerId || null,
            subscriptionId: sub.id,
            status: 'CONFIRMED',
            scheduledDate,
            duration: 180, // 3 hours default
            price: sub.finalPrice,
            notes: `Recurring booking - ${sub.frequency}`,
          });

          // Record the payment
          const paymentId = crypto.randomBytes(16).toString('hex');
          await db.insert(subscriptionPayment).values({
            id: paymentId,
            subscriptionId: sub.id,
            bookingId,
            amount: sub.finalPrice,
            status: 'COMPLETED',
            paymentMethod: 'CREDIT_CARD',
            billingPeriodStart: now,
            billingPeriodEnd: nextBillingDate,
            processedAt: now,
          });

          // Update subscription with next billing date
          await db
            .update(subscription)
            .set({
              nextBillingDate,
              updatedAt: now,
            })
            .where(eq(subscription.id, sub.id));

          results.succeeded++;
          console.log(`[Recurring Charge] Successfully charged subscription ${sub.id}`);
        } else {
          results.failed++;
          results.errors.push({
            subscriptionId: sub.id,
            error: 'Payment processing failed',
          });

          // Optionally: Update subscription status or send notification
          console.error(`[Recurring Charge] Failed to charge subscription ${sub.id}`);
        }
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({
          subscriptionId: sub.id,
          error: errorMessage,
        });

        console.error(`[Recurring Charge] Error processing subscription ${sub.id}:`, error);
      }
    }

    console.log('[Recurring Charge] Processing complete:', results);

    return json({
      success: true,
      results,
    });
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

// Helper function to calculate the next cleaning date based on preferences
function calculateNextCleaningDate(
  frequency: string,
  preferredDays: string[],
  monthlyDates: number[],
  timeSlot: string
): Date {
  const now = new Date();
  const [startTime] = timeSlot.split('-');
  const [hours, minutes] = startTime.split(':').map(Number);

  let nextDate = new Date();
  nextDate.setHours(hours, minutes, 0, 0);

  switch (frequency) {
    case 'WEEKLY':
      // Find next occurrence of preferred day
      if (preferredDays.length > 0) {
        const dayMap: Record<string, number> = {
          'SUNDAY': 0, 'MONDAY': 1, 'TUESDAY': 2, 'WEDNESDAY': 3,
          'THURSDAY': 4, 'FRIDAY': 5, 'SATURDAY': 6
        };

        const targetDay = dayMap[preferredDays[0]];
        const currentDay = now.getDay();
        const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;

        nextDate.setDate(now.getDate() + daysUntilTarget);
      } else {
        nextDate.setDate(now.getDate() + 7);
      }
      break;

    case 'BIWEEKLY':
      if (preferredDays.length > 0) {
        const dayMap: Record<string, number> = {
          'SUNDAY': 0, 'MONDAY': 1, 'TUESDAY': 2, 'WEDNESDAY': 3,
          'THURSDAY': 4, 'FRIDAY': 5, 'SATURDAY': 6
        };

        const targetDay = dayMap[preferredDays[0]];
        const currentDay = now.getDay();
        const daysUntilTarget = (targetDay - currentDay + 14) % 14 || 14;

        nextDate.setDate(now.getDate() + daysUntilTarget);
      } else {
        nextDate.setDate(now.getDate() + 14);
      }
      break;

    case 'TWICE_WEEKLY':
      // Find next occurrence of any preferred day (twice per week)
      if (preferredDays.length > 0) {
        const dayMap: Record<string, number> = {
          'SUNDAY': 0, 'MONDAY': 1, 'TUESDAY': 2, 'WEDNESDAY': 3,
          'THURSDAY': 4, 'FRIDAY': 5, 'SATURDAY': 6
        };

        let minDays = 7;
        for (const day of preferredDays) {
          const targetDay = dayMap[day];
          const currentDay = now.getDay();
          const daysUntilTarget = (targetDay - currentDay + 7) % 7;

          if (daysUntilTarget > 0 && daysUntilTarget < minDays) {
            minDays = daysUntilTarget;
          }
        }

        nextDate.setDate(now.getDate() + (minDays === 7 ? 3 : minDays));
      } else {
        nextDate.setDate(now.getDate() + 3);
      }
      break;

    case 'TWICE_MONTHLY':
      // For twice monthly, use the specified dates
      if (monthlyDates && monthlyDates.length > 0) {
        const currentDate = now.getDate();
        let targetDate = monthlyDates.find(d => d > currentDate);

        if (targetDate) {
          nextDate.setDate(targetDate);
        } else {
          // Move to next month, use first date
          nextDate.setMonth(nextDate.getMonth() + 1);
          nextDate.setDate(monthlyDates[0]);
        }
      } else {
        // Default to 15 days
        nextDate.setDate(now.getDate() + 15);
      }
      break;

    default:
      // Monthly - default to 30 days
      nextDate.setDate(now.getDate() + 30);
  }

  // Ensure the date is in the future
  if (nextDate <= now) {
    nextDate.setDate(nextDate.getDate() + 1);
  }

  return nextDate;
}
