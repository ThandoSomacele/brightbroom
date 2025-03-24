// src/routes/profile/addresses/+page.server.ts
import { db } from '$lib/server/db';
import { address } from '$lib/server/db/schema';
import { error, fail, redirect } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Check if the user is logged in
  if (!locals.user) {
    throw redirect(302, '/auth/login?redirectTo=/profile/addresses');
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

export const actions: Actions = {
  // Set an address as default
  setDefault: async ({ request, locals }) => {
    if (!locals.user) {
      return fail(401, { error: 'You must be logged in to update addresses' });
    }
    
    const formData = await request.formData();
    const addressId = formData.get('id')?.toString();
    
    if (!addressId) {
      return fail(400, { error: 'Address ID is required' });
    }
    
    try {
      // Check if the address belongs to the user
      const addresses = await db.select()
        .from(address)
        .where(
          and(
            eq(address.id, addressId),
            eq(address.userId, locals.user.id)
          )
        )
        .limit(1);
      
      if (addresses.length === 0) {
        return fail(404, { error: 'Address not found' });
      }
      
      // First, set all addresses to non-default
      await db.update(address)
        .set({ isDefault: false })
        .where(eq(address.userId, locals.user.id));
      
      // Then set the selected address as default
      await db.update(address)
        .set({ isDefault: true })
        .where(eq(address.id, addressId));
      
      return {
        success: 'Default address updated successfully'
      };
    } catch (err) {
      console.error('Error setting default address:', err);
      return fail(500, { error: 'Failed to set default address' });
    }
  },
  
  // Delete an address
  deleteAddress: async ({ request, locals }) => {
    if (!locals.user) {
      return fail(401, { error: 'You must be logged in to delete addresses' });
    }
    
    const formData = await request.formData();
    const addressId = formData.get('id')?.toString();
    
    if (!addressId) {
      return fail(400, { error: 'Address ID is required' });
    }
    
    try {
      // Check if the address belongs to the user
      const addresses = await db.select()
        .from(address)
        .where(
          and(
            eq(address.id, addressId),
            eq(address.userId, locals.user.id)
          )
        )
        .limit(1);
      
      if (addresses.length === 0) {
        return fail(404, { error: 'Address not found' });
      }
      
      // Delete the address
      await db.delete(address)
        .where(eq(address.id, addressId));
      
      // If the deleted address was the default, set a new default if possible
      if (addresses[0].isDefault) {
        const remainingAddresses = await db.select()
          .from(address)
          .where(eq(address.userId, locals.user.id))
          .limit(1);
        
        if (remainingAddresses.length > 0) {
          await db.update(address)
            .set({ isDefault: true })
            .where(eq(address.id, remainingAddresses[0].id));
        }
      }
      
      return {
        success: 'Address deleted successfully'
      };
    } catch (err) {
      console.error('Error deleting address:', err);
      return fail(500, { error: 'Failed to delete address' });
    }
  }
};
