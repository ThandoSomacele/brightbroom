// src/routes/api/subscription/create/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { subscription, booking, payment, user, address, service } from '$lib/server/db/schema';
import { payFastSubscriptionService } from '$lib/server/services/payfast-subscription';
import { getGuestBookingData } from '$lib/server/guest-booking';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export const POST: RequestHandler = async ({ request, locals, ...event }) => {
  // Check if user is authenticated
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Try to get data from request body first
    let data = await request.json();
    console.log('Subscription create - request body:', data);

    // If no data in body, get from guest booking session (for users who just logged in)
    if (!data || Object.keys(data).length === 0) {
      const guestBookingData = getGuestBookingData(event);
      console.log('Subscription create - guest booking data:', guestBookingData);

      if (!guestBookingData.serviceId || !guestBookingData.isRecurring) {
        console.error('Missing required booking data:', {
          serviceId: guestBookingData.serviceId,
          isRecurring: guestBookingData.isRecurring
        });
        return json({ error: 'No booking data found' }, { status: 400 });
      }

      // Map guest booking data to subscription data
      data = {
        serviceId: guestBookingData.serviceId,
        addressId: guestBookingData.addressId,
        cleanerId: guestBookingData.cleanerId || null,
        frequency: guestBookingData.recurringFrequency,
        preferredDays: guestBookingData.recurringDays || guestBookingData.preferredDays || [],
        preferredTimeSlot: guestBookingData.recurringTimeSlot || guestBookingData.preferredTimeSlot,
        monthlyDates: guestBookingData.recurringMonthlyDates || guestBookingData.monthlyDates || [],
        basePrice: guestBookingData.basePrice || 0,
        discountPercentage: guestBookingData.discountPercentage || 0,
        finalPrice: guestBookingData.finalPrice || 0,
        startDate: new Date(), // Start immediately
        notes: guestBookingData.notes || null,
        guestAddress: guestBookingData.guestAddress // Include guest address for creation
      };
    }

    // Validate required fields
    let {
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
      notes,
      guestAddress
    } = data;

    console.log('Subscription create - validation:', {
      serviceId,
      addressId,
      frequency,
      basePrice,
      finalPrice,
      hasGuestAddress: !!guestAddress
    });

    // If no addressId but we have guestAddress, create the address first
    if (!addressId && guestAddress) {
      console.log('Creating address from guest data:', guestAddress);
      try {
        const newAddress = await db.insert(address).values({
          id: crypto.randomBytes(16).toString('hex'),
          userId: locals.user.id,
          street: guestAddress.street || '',
          streetNumber: guestAddress.streetNumber || null,
          aptUnit: guestAddress.aptUnit || null,
          city: guestAddress.city,
          state: guestAddress.state,
          zipCode: guestAddress.zipCode,
          country: 'South Africa',
          instructions: guestAddress.instructions || null,
          lat: guestAddress.lat || null,
          lng: guestAddress.lng || null,
          isPrimary: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();

        addressId = newAddress[0].id;
        console.log('Created address with ID:', addressId);
      } catch (error) {
        console.error('Failed to create address:', error);
        return json({ error: 'Failed to create address' }, { status: 500 });
      }
    }

    if (!serviceId || !addressId || !frequency || !basePrice || !finalPrice) {
      console.error('Missing required fields:', {
        serviceId: !!serviceId,
        addressId: !!addressId,
        frequency: !!frequency,
        basePrice: !!basePrice,
        finalPrice: !!finalPrice
      });
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