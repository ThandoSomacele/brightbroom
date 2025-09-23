// src/routes/account/subscriptions/+page.server.ts

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { subscription, service, address, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
  // Check if user is authenticated
  if (!locals.user) {
    throw redirect(302, '/auth/login');
  }

  // Fetch user's subscriptions with related data
  const subscriptions = await db
    .select({
      id: subscription.id,
      status: subscription.status,
      frequency: subscription.frequency,
      preferredDays: subscription.preferredDays,
      preferredTimeSlot: subscription.preferredTimeSlot,
      monthlyDates: subscription.monthlyDates,
      basePrice: subscription.basePrice,
      discountPercentage: subscription.discountPercentage,
      finalPrice: subscription.finalPrice,
      startDate: subscription.startDate,
      nextBillingDate: subscription.nextBillingDate,
      endDate: subscription.endDate,
      pausedAt: subscription.pausedAt,
      cancelledAt: subscription.cancelledAt,
      notes: subscription.notes,
      cancellationReason: subscription.cancellationReason,
      service: {
        id: service.id,
        name: service.name,
        description: service.description,
      },
      address: {
        id: address.id,
        street: address.street,
        city: address.city,
        postalCode: address.postalCode,
      },
      cleaner: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    })
    .from(subscription)
    .leftJoin(service, eq(subscription.serviceId, service.id))
    .leftJoin(address, eq(subscription.addressId, address.id))
    .leftJoin(user, eq(subscription.cleanerId, user.id))
    .where(eq(subscription.userId, locals.user.id))
    .orderBy(subscription.createdAt);

  return {
    subscriptions,
  };
};