// src/routes/book/address/+page.server.ts
import { db } from '$lib/server/db';
import { address } from '$lib/server/db/schema';
import { error, redirect } from '@sveltejs/kit';
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
      addresses
    };
  } catch (err) {
    console.error('Error loading addresses:', err);
    throw error(500, 'Failed to load addresses');
  }
};