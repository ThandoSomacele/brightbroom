// src/routes/profile/subscriptions/+page.server.ts
import { db } from '$lib/server/db';
import { subscription, service, address, subscriptionPayment } from '$lib/server/db/schema';
import { error, redirect } from '@sveltejs/kit';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { payFastSubscriptionService } from '$lib/server/services/payfast-subscription';

export const load: PageServerLoad = async ({ locals }) => {
  // Check if the user is logged in
  if (!locals.user) {
    throw redirect(302, '/auth/login?redirectTo=/profile/subscriptions');
  }

  try {
    // Get all the user's subscriptions
    const subscriptions = await db.select({
      id: subscription.id,
      status: subscription.status,
      frequency: subscription.frequency,
      preferredDays: subscription.preferredDays,
      monthlyDates: subscription.monthlyDates,
      preferredTimeSlot: subscription.preferredTimeSlot,
      finalPrice: subscription.finalPrice,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      nextBillingDate: subscription.nextBillingDate,
      payFastToken: subscription.payFastToken,
      createdAt: subscription.createdAt,
      service: {
        id: service.id,
        name: service.name,
        description: service.description,
      },
      address: {
        id: address.id,
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
      },
    })
    .from(subscription)
    .innerJoin(service, eq(subscription.serviceId, service.id))
    .leftJoin(address, eq(subscription.addressId, address.id))
    .where(eq(subscription.userId, locals.user.id))
    .orderBy(desc(subscription.createdAt));

    // Get payment history for each subscription
    const subscriptionsWithPayments = await Promise.all(
      subscriptions.map(async (sub) => {
        const payments = await db.select({
          id: subscriptionPayment.id,
          amount: subscriptionPayment.amount,
          status: subscriptionPayment.status,
          billingPeriodStart: subscriptionPayment.billingPeriodStart,
          billingPeriodEnd: subscriptionPayment.billingPeriodEnd,
          processedAt: subscriptionPayment.processedAt,
        })
        .from(subscriptionPayment)
        .where(eq(subscriptionPayment.subscriptionId, sub.id))
        .orderBy(desc(subscriptionPayment.processedAt))
        .limit(5);

        return {
          ...sub,
          payments,
        };
      })
    );

    return {
      subscriptions: subscriptionsWithPayments
    };
  } catch (err) {
    console.error('Error loading subscriptions:', err);
    throw error(500, 'Failed to load subscriptions');
  }
};

export const actions: Actions = {
  pause: async ({ locals, request }) => {
    if (!locals.user) {
      throw redirect(302, '/auth/login');
    }

    const formData = await request.formData();
    const subscriptionId = formData.get('subscriptionId')?.toString();
    const token = formData.get('token')?.toString();

    if (!subscriptionId || !token) {
      return { success: false, error: 'Missing subscription information' };
    }

    // Verify subscription belongs to user
    const [sub] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.id, subscriptionId))
      .limit(1);

    if (!sub || sub.userId !== locals.user.id) {
      return { success: false, error: 'Subscription not found' };
    }

    // Pause subscription via PayFast
    const success = await payFastSubscriptionService.updateSubscriptionStatus(token, 'pause');

    if (success) {
      // Update local database
      await db
        .update(subscription)
        .set({ status: 'PAUSED', updatedAt: new Date() })
        .where(eq(subscription.id, subscriptionId));

      return { success: true };
    }

    return { success: false, error: 'Failed to pause subscription' };
  },

  resume: async ({ locals, request }) => {
    if (!locals.user) {
      throw redirect(302, '/auth/login');
    }

    const formData = await request.formData();
    const subscriptionId = formData.get('subscriptionId')?.toString();
    const token = formData.get('token')?.toString();

    if (!subscriptionId || !token) {
      return { success: false, error: 'Missing subscription information' };
    }

    // Verify subscription belongs to user
    const [sub] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.id, subscriptionId))
      .limit(1);

    if (!sub || sub.userId !== locals.user.id) {
      return { success: false, error: 'Subscription not found' };
    }

    // Resume subscription via PayFast
    const success = await payFastSubscriptionService.updateSubscriptionStatus(token, 'unpause');

    if (success) {
      // Update local database
      await db
        .update(subscription)
        .set({ status: 'ACTIVE', updatedAt: new Date() })
        .where(eq(subscription.id, subscriptionId));

      return { success: true };
    }

    return { success: false, error: 'Failed to resume subscription' };
  },

  cancel: async ({ locals, request }) => {
    if (!locals.user) {
      throw redirect(302, '/auth/login');
    }

    const formData = await request.formData();
    const subscriptionId = formData.get('subscriptionId')?.toString();
    const token = formData.get('token')?.toString();
    const reason = formData.get('reason')?.toString() || 'User requested cancellation';

    if (!subscriptionId || !token) {
      return { success: false, error: 'Missing subscription information' };
    }

    // Verify subscription belongs to user
    const [sub] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.id, subscriptionId))
      .limit(1);

    if (!sub || sub.userId !== locals.user.id) {
      return { success: false, error: 'Subscription not found' };
    }

    // Cancel subscription via PayFast
    const success = await payFastSubscriptionService.updateSubscriptionStatus(token, 'cancel');

    if (success) {
      // Update local database
      await db
        .update(subscription)
        .set({
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: reason,
          updatedAt: new Date()
        })
        .where(eq(subscription.id, subscriptionId));

      return { success: true };
    }

    return { success: false, error: 'Failed to cancel subscription' };
  },
};
