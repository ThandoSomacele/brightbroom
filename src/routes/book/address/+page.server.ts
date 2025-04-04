// src/routes/book/address/+page.server.ts
import { db } from '$lib/server/db';
import { address } from '$lib/server/db/schema';
import { MAX_ADDRESSES } from '$lib/server/services/address.service';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Check if the user is logged in
  if (!locals.user) {
    throw redirect(302, '/auth/login?redirectTo=/book/address');
  }
  
  try {
    // Get the user's addresses
    const addresses = await db.select()
      .from(address)
      .where(eq(address.userId, locals.user.id))
      .orderBy(address.isDefault, { direction: 'desc' });
    
    return {
      addresses,
      maxAddresses: MAX_ADDRESSES,
      hasReachedLimit: addresses.length >= MAX_ADDRESSES,
      remainingAddresses: Math.max(0, MAX_ADDRESSES - addresses.length)
    };
  } catch (err) {
    console.error('Error loading addresses:', err);
    return {
      addresses: [],
      maxAddresses: MAX_ADDRESSES,
      hasReachedLimit: false,
      remainingAddresses: MAX_ADDRESSES
    };
  }
};
