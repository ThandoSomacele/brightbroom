// src/routes/api/payfast/subscription-webhook/+server.ts

import { text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { subscription, subscriptionPayment, booking } from '$lib/server/db/schema';
import { payFastSubscriptionService } from '$lib/server/services/payfast-subscription';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Get the raw body for signature verification
    const body = await request.text();
    const params = new URLSearchParams(body);
    const paramsObject: Record<string, string> = {};

    params.forEach((value, key) => {
      paramsObject[key] = value;
    });

    // Validate webhook signature
    const signature = paramsObject.signature;
    delete paramsObject.signature;

    if (!payFastSubscriptionService.validateWebhookSignature(paramsObject, signature)) {
      console.error('Invalid PayFast webhook signature');
      return text('Invalid signature', { status: 400 });
    }

    // Extract relevant data
    const {
      m_payment_id: subscriptionId,
      pf_payment_id: payFastPaymentId,
      payment_status,
      item_name,
      amount_gross,
      token,
    } = paramsObject;

    console.log('PayFast subscription webhook:', {
      subscriptionId,
      payFastPaymentId,
      payment_status,
      amount_gross,
    });

    // Get the subscription
    const [subscriptionData] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.id, subscriptionId))
      .limit(1);

    if (!subscriptionData) {
      console.error('Subscription not found:', subscriptionId);
      return text('Subscription not found', { status: 404 });
    }

    // Handle different payment statuses
    if (payment_status === 'COMPLETE') {
      // Update subscription status if this is the first payment
      if (subscriptionData.status === 'PENDING') {
        await db
          .update(subscription)
          .set({
            status: 'ACTIVE',
            payFastToken: token || subscriptionData.payFastToken,
            payFastSubscriptionId: payFastPaymentId,
            updatedAt: new Date(),
          })
          .where(eq(subscription.id, subscriptionId));
      }

      // Calculate next billing date
      const nextBillingDate = payFastSubscriptionService.calculateNextBillingDate(
        subscriptionData.frequency,
        new Date(),
        subscriptionData.preferredDays || undefined,
        subscriptionData.monthlyDates || undefined
      );

      // Create a booking for the next scheduled cleaning
      const bookingId = crypto.randomBytes(16).toString('hex');
      const scheduledDate = calculateNextCleaningDate(
        subscriptionData.frequency,
        subscriptionData.preferredDays || [],
        subscriptionData.monthlyDates || [],
        subscriptionData.preferredTimeSlot || '09:00-12:00'
      );

      await db.insert(booking).values({
        id: bookingId,
        userId: subscriptionData.userId,
        addressId: subscriptionData.addressId,
        serviceId: subscriptionData.serviceId,
        cleanerId: subscriptionData.cleanerId || null,
        subscriptionId: subscriptionData.id,
        status: 'CONFIRMED',
        scheduledDate,
        duration: 180, // 3 hours default
        price: subscriptionData.finalPrice,
        notes: `Recurring booking - ${subscriptionData.frequency}`,
      });

      // Record the payment
      const paymentId = crypto.randomBytes(16).toString('hex');
      await db.insert(subscriptionPayment).values({
        id: paymentId,
        subscriptionId: subscriptionData.id,
        bookingId,
        amount: amount_gross,
        status: 'COMPLETED',
        paymentMethod: 'CREDIT_CARD',
        payFastPaymentId,
        payFastReference: payFastPaymentId,
        billingPeriodStart: new Date(),
        billingPeriodEnd: nextBillingDate,
        processedAt: new Date(),
      });

      // Update next billing date on subscription
      await db
        .update(subscription)
        .set({
          nextBillingDate,
          updatedAt: new Date(),
        })
        .where(eq(subscription.id, subscriptionId));

      console.log('Subscription payment processed successfully:', subscriptionId);
    } else if (payment_status === 'CANCELLED') {
      // Handle subscription cancellation
      await db
        .update(subscription)
        .set({
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: 'PayFast cancellation',
          updatedAt: new Date(),
        })
        .where(eq(subscription.id, subscriptionId));

      console.log('Subscription cancelled:', subscriptionId);
    } else if (payment_status === 'FAILED') {
      // Record failed payment attempt
      const paymentId = crypto.randomBytes(16).toString('hex');
      await db.insert(subscriptionPayment).values({
        id: paymentId,
        subscriptionId: subscriptionData.id,
        amount: amount_gross,
        status: 'FAILED',
        payFastPaymentId,
        payFastReference: payFastPaymentId,
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(),
        failureReason: 'Payment failed',
        processedAt: new Date(),
      });

      console.log('Subscription payment failed:', subscriptionId);
    }

    return text('OK');
  } catch (error) {
    console.error('Error processing PayFast subscription webhook:', error);
    return text('Internal server error', { status: 500 });
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
        // Default to 7 days from now
        nextDate.setDate(now.getDate() + 7);
      }
      break;

    case 'BIWEEKLY':
      // Similar to weekly but add 14 days
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