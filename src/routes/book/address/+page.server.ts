// src/routes/book/address/+page.server.ts
import { serviceAreaService } from "$lib/server/services/service-area.service";
import { MAX_ADDRESSES } from '$lib/constants/address';
import { db } from '$lib/server/db';
import { address } from '$lib/server/db/schema';
import { addressService } from '$lib/server/services/address.service'; // Import the service
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const serviceAreas = await serviceAreaService.listActive();
  // For authenticated users, load their saved addresses
  if (locals.user) {
    try {
      const addresses = await addressService.getUserAddresses(locals.user.id);
      
      return {
        serviceAreas,
        addresses,
        maxAddresses: MAX_ADDRESSES,
        hasReachedLimit: addresses.length >= MAX_ADDRESSES,
        remainingAddresses: Math.max(0, MAX_ADDRESSES - addresses.length),
        isAuthenticated: true
      };
    } catch (err) {
      console.error('Error loading addresses:', err);
      return {
        serviceAreas,
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
    serviceAreas,
    addresses: [],
    maxAddresses: MAX_ADDRESSES,
    hasReachedLimit: false,
    remainingAddresses: MAX_ADDRESSES,
    isAuthenticated: false
  };
};
