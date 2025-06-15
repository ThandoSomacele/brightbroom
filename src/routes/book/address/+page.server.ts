// src/routes/book/address/+page.server.ts
import { db } from '$lib/server/db';
import { address } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { addressService } from '$lib/server/services/address.service';
import { MAX_ADDRESSES } from '$lib/constants/address';

export const load: PageServerLoad = async ({ locals }) => {
  // For guest users, return minimal data
  if (!locals.user) {
    return {
      isGuest: true,
      addresses: [],
      maxAddresses: MAX_ADDRESSES,
      hasReachedLimit: false,
      remainingAddresses: MAX_ADDRESSES,
      user: null
    };
  }

  // For authenticated users, load their saved addresses
  try {
    const addresses = await addressService.getUserAddresses(locals.user.id);
    const hasReachedLimit = addresses.length >= MAX_ADDRESSES;
    const remainingAddresses = Math.max(0, MAX_ADDRESSES - addresses.length);

    return {
      isGuest: false,
      addresses,
      maxAddresses: MAX_ADDRESSES,
      hasReachedLimit,
      remainingAddresses,
      user: locals.user
    };
  } catch (error) {
    console.error('Error loading user addresses:', error);
    // Return guest-like data if there's an error
    return {
      isGuest: false,
      addresses: [],
      maxAddresses: MAX_ADDRESSES,
      hasReachedLimit: false,
      remainingAddresses: MAX_ADDRESSES,
      user: locals.user
    };
  }
};
