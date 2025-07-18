// src/routes/book/address/+page.server.ts
import { MAX_ADDRESSES } from '$lib/constants/address';
import { db } from '$lib/server/db';
import { address } from '$lib/server/db/schema';
import { addressService } from '$lib/server/services/address.service'; // Import the service
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // For authenticated users, load their saved addresses
  if (locals.user) {
    try {
      const addresses = await addressService.getUserAddresses(locals.user.id);
      
      return {
        addresses,
        maxAddresses: MAX_ADDRESSES,
        hasReachedLimit: addresses.length >= MAX_ADDRESSES,
        remainingAddresses: Math.max(0, MAX_ADDRESSES - addresses.length),
        isAuthenticated: true
      };
    } catch (err) {
      console.error('Error loading addresses:', err);
      return {
        addresses: [],
        maxAddresses: MAX_ADDRESSES,
        hasReachedLimit: false,
        remainingAddresses: MAX_ADDRESSES,
        isAuthenticated: true
      };
    }
  }
  
  // For guest users, return empty state - they'll enter address manually
  return {
    addresses: [],
    maxAddresses: MAX_ADDRESSES,
    hasReachedLimit: false,
    remainingAddresses: MAX_ADDRESSES,
    isAuthenticated: false
  };
};
