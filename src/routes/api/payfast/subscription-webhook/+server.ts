// src/routes/api/payfast/subscription-webhook/+server.ts

import { text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { subscription, subscriptionPayment, booking } from '$lib/server/db/schema';
import { payFastSubscriptionService } from '$lib/server/services/payfast-subscription';
import { tenantService } from '$lib/server/services/tenant.service';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { toNaiveDateTimeString } from '$lib/utils/date-utils';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Get the raw body for signature verification
    const body = await request.text();
    const params = new URLSearchParams(body);
    const paramsObject: Record<string, string> = {};

    params.forEach((value, key) => {
      paramsObject[key] = value;
    });

    // Validate the ITN signature over the raw body. ITN posts are signed in
    // the order the fields were sent — not the checkout attribute order — so
    // this must not go through the checkout signature path.
    if (!payFastSubscriptionService.validateItnSignature(body)) {
      console.error('Invalid PayFast webhook signature', {
        keys: [...params.keys()].filter((k) => k !== 'signature'),
      });
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
      } else if (token && !subscriptionData.payFastToken) {
        // A subscription activated by hand (e.g. after a missed first ITN)
        // still needs the billing token off the next webhook that carries it
        await db
          .update(subscription)
          .set({ payFastToken: token, updatedAt: new Date() })
          .where(eq(subscription.id, subscriptionId));
      }

      // Calculate next billing date
      const nextBillingDate = payFastSubscriptionService.calculateNextBillingDate(
        subscriptionData.frequency,
        new Date(),
        subscriptionData.preferredDays || undefined
      );

      // Create a booking for the next scheduled cleaning. The start date
      // matters: a customer who chose to start next week must not be booked
      // for this one.
      const bookingId = crypto.randomBytes(16).toString('hex');
      const scheduledDate = toNaiveDateTimeString(
        payFastSubscriptionService.calculateNextCleaningDate(
          subscriptionData.frequency,
          subscriptionData.preferredDays || [],
          subscriptionData.monthlyDates || [],
          subscriptionData.preferredTimeSlot || '09:00-12:00',
          subscriptionData.startDate
        )
      );

      const bookingTenantId = await tenantService.resolveBookingTenantId(
        subscriptionData.cleanerId || null,
      );

      await db.insert(booking).values({
        id: bookingId,
        userId: subscriptionData.userId,
        addressId: subscriptionData.addressId,
        serviceId: subscriptionData.serviceId,
        cleanerId: subscriptionData.cleanerId || null,
        tenantId: bookingTenantId,
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
