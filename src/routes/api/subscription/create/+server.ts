// src/routes/api/subscription/create/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { subscription, booking, payment, user, address, service } from '$lib/server/db/schema';
import { payFastSubscriptionService } from '$lib/server/services/payfast-subscription';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export const POST: RequestHandler = async ({ request, locals }) => {
  // Check if user is authenticated
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Validate required fields
    const {
      serviceId,
      addressId,
      cleanerId,
      frequency,
      preferredDays,
      preferredTimeSlot,
      monthlyDates,
      basePrice,
      discountPercentage,
      finalPrice,
      startDate,
      notes
    } = data;

    if (!serviceId || !addressId || !frequency || !basePrice || !finalPrice) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user and address details
    const [userData] = await db
      .select()
      .from(user)
      .where(eq(user.id, locals.user.id))
      .limit(1);

    const [addressData] = await db
      .select()
      .from(address)
      .where(eq(address.id, addressId))
      .limit(1);

    if (!userData || !addressData) {
      return json({ error: 'Invalid user or address' }, { status: 400 });
    }

    // Create subscription record
    const subscriptionId = crypto.randomBytes(16).toString('hex');

    const [newSubscription] = await db
      .insert(subscription)
      .values({
        id: subscriptionId,
        userId: locals.user.id,
        addressId,
        serviceId,
        cleanerId: cleanerId || null,
        frequency,
        status: 'PENDING',
        preferredDays: preferredDays || [],
        preferredTimeSlot: preferredTimeSlot || null,
        monthlyDates: monthlyDates || [],
        basePrice: basePrice.toString(),
        discountPercentage: discountPercentage.toString(),
        finalPrice: finalPrice.toString(),
        startDate: new Date(startDate),
        notes: notes || null,
      })
      .returning();

    // Create PayFast subscription
    const { redirectUrl } = await payFastSubscriptionService.createSubscription(
      newSubscription,
      {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone || undefined,
      }
    );

    // Return the redirect URL for PayFast
    return json({
      success: true,
      subscriptionId,
      redirectUrl,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return json({ error: 'Failed to create subscription' }, { status: 500 });
  }
};