// src/routes/api/payfast/subscription-webhook/+server.ts

import { text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { subscription, subscriptionPayment, booking, service, user } from '$lib/server/db/schema';
import { payFastSubscriptionService } from '$lib/server/services/payfast-subscription';
import { amountMatches, checkItn, confirmWithPayFast } from '$lib/server/payfast-itn';
import { sendSubscriptionCancelledEmail } from '$lib/server/email-service';
import { tenantService } from '$lib/server/services/tenant.service';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { toNaiveDateTimeString } from '$lib/utils/date-utils';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Signature (over the fields in posted order) and merchant first;
    // nothing in an unverified post is trusted
    const check = checkItn(await request.text());
    if (!check.ok) {
      console.error(`Refused PayFast subscription webhook: ${check.reason}`);
      return text('Invalid signature', { status: 400 });
    }
    const { itn } = check;
    const paramsObject = itn.fields;

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
      // Cycle charges initiated by our cron carry the cycle's payment record
      // id as m_payment_id. Those are recorded synchronously when the charge
      // is made, so just acknowledge - otherwise PayFast retries for hours.
      const [cyclePayment] = await db
        .select({ id: subscriptionPayment.id })
        .from(subscriptionPayment)
        .where(eq(subscriptionPayment.id, subscriptionId))
        .limit(1);
      if (cyclePayment) {
        return text('OK');
      }

      console.error('Subscription not found:', subscriptionId);
      return text('Subscription not found', { status: 404 });
    }

    // PayFast's own confirmation that it sent this ITN, before any change
    if (!(await confirmWithPayFast(itn))) {
      console.error('PayFast did not confirm the subscription ITN:', subscriptionId);
      return text('Invalid ITN', { status: 400 });
    }

    // The first payment is the subscription price; later cycles carry their
    // own payment id and were acknowledged above
    if (payment_status === 'COMPLETE' && !amountMatches(amount_gross, subscriptionData.finalPrice)) {
      console.error(
        `Subscription ITN amount mismatch for ${subscriptionId}: PayFast R${amount_gross}, expected R${subscriptionData.finalPrice}`,
      );
      return text('Amount mismatch', { status: 400 });
    }

    // Handle different payment statuses
    if (payment_status === 'COMPLETE') {
      // A payment notification for a cancelled subscription must never create
      // bookings or revive billing. It can still teach us the billing token
      // we may have missed - needed to manage the subscription at PayFast -
      // and is acknowledged so PayFast stops retrying. This also makes an ITN
      // resend from the PayFast dashboard a clean token-capture mechanism.
      if (subscriptionData.status === 'CANCELLED') {
        if (token && !subscriptionData.payFastToken) {
          await db
            .update(subscription)
            .set({ payFastToken: token, updatedAt: new Date() })
            .where(eq(subscription.id, subscriptionId));
          console.log('Stored billing token from ITN for cancelled subscription:', subscriptionId);
        }
        console.warn('COMPLETE ITN for cancelled subscription acknowledged without processing:', {
          subscriptionId,
          payFastPaymentId,
        });
        return text('OK');
      }

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

      // Tell the customer - but only on the actual transition, so an ITN
      // retry or a cancellation we already processed does not email twice
      if (subscriptionData.status !== 'CANCELLED' && subscriptionData.userId) {
        const [[customer], [svc]] = await Promise.all([
          db.select({ email: user.email }).from(user)
            .where(eq(user.id, subscriptionData.userId)).limit(1),
          db.select({ name: service.name }).from(service)
            .where(eq(service.id, subscriptionData.serviceId)).limit(1),
        ]);
        if (customer?.email) {
          await sendSubscriptionCancelledEmail(
            customer.email,
            {
              id: subscriptionData.id,
              serviceName: svc?.name ?? 'Cleaning Service',
              frequency: subscriptionData.frequency,
            },
            'system',
            'Your subscription was cancelled with our payment provider',
          );
        }
      }
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
