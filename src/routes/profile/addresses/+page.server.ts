// src/routes/profile/addresses/+page.server.ts
import { db } from '$lib/server/db';
import { address } from '$lib/server/db/schema';
import { addressService } from '$lib/server/services/address.service';
import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Check if user is logged in
  if (!locals.user) {
    throw redirect(302, '/auth/login?redirectTo=/profile/addresses');
  }
  
  try {
    // Get the user's addresses
    const addresses = await db.select()
      .from(address)
      .where(eq(address.userId, locals.user.id))
      .orderBy(address.isDefault, { direction: 'desc' }); // Default addresses first
    
    return {
      addresses
    };
  } catch (err) {
    console.error('Error loading addresses:', err);
    throw error(500, 'Failed to load addresses');
  }
};

export const actions: Actions = {
  setDefault: async ({ request, locals }) => {
    // Check if user is logged in
    if (!locals.user) {
      return fail(401, { error: 'You must be logged in to perform this action' });
    }
    
    const formData = await request.formData();
    const addressId = formData.get('addressId')?.toString();
    
    if (!addressId) {
      return fail(400, { error: 'Address ID is required' });
    }
    
    try {
      const updatedAddress = await addressService.setDefaultAddress(locals.user.id, addressId);
      
      if (!updatedAddress) {
        return fail(404, { error: 'Address not found' });
      }
      
      return {
        success: 'Default address updated successfully'
      };
    } catch (err) {
      console.error('Error setting default address:', err);
      return fail(500, { error: 'Failed to update default address' });
    }
  },
  
  deleteAddress: async ({ request, locals }) => {
    // Check if user is logged in
    if (!locals.user) {
      return fail(401, { error: 'You must be logged in to perform this action' });
    }
    
    const formData = await request.formData();
    const addressId = formData.get('addressId')?.toString();
    
    if (!addressId) {
      return fail(400, { error: 'Address ID is required' });
    }
    
    try {
      const success = await addressService.deleteAddress(locals.user.id, addressId);
      
      if (!success) {
        return fail(404, { error: 'Address not found or could not be deleted' });
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
