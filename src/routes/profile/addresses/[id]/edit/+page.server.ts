// src/routes/profile/addresses/[id]/edit/+page.server.ts
import { db } from '$lib/server/db';
import { address } from '$lib/server/db/schema';
import { addressService } from '$lib/server/services/address.service';
import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  // Check if user is logged in
  if (!locals.user) {
    throw redirect(302, '/auth/login?redirectTo=/profile/addresses');
  }
  
  const addressId = params.id;
  
  try {
    // Get the address details
    const addresses = await db.select()
      .from(address)
      .where(and(
        eq(address.id, addressId),
        eq(address.userId, locals.user.id)
      ))
      .limit(1);
    
    if (addresses.length === 0) {
      throw error(404, 'Address not found');
    }
    
    return {
      address: addresses[0]
    };
  } catch (err) {
    console.error('Error loading address:', err);
    throw error(500, 'Failed to load address details');
  }
};

export const actions: Actions = {
  default: async ({ request, params, locals }) => {
    // Check if user is logged in
    if (!locals.user) {
      throw redirect(302, '/auth/login');
    }
    
    const addressId = params.id;
    
    // Process form data
    const formData = await request.formData();
    const street = formData.get('street')?.toString();
    const aptUnit = formData.get('aptUnit')?.toString() || null;
    const city = formData.get('city')?.toString();
    const state = formData.get('state')?.toString();
    const zipCode = formData.get('zipCode')?.toString();
    const instructions = formData.get('instructions')?.toString() || null;
    const isDefault = formData.get('isDefault') === 'on';
    
    // Validate required fields
    if (!street || !city || !state || !zipCode) {
      return fail(400, { 
        error: 'Please fill in all required fields',
        values: { street, aptUnit, city, state, zipCode, instructions, isDefault }
      });
    }
    
    try {
      // Update the address using our service
      const updatedAddress = await addressService.updateAddress(
        locals.user.id,
        addressId,
        {
          street,
          aptUnit,
          city,
          state,
          zipCode,
          instructions,
          isDefault
        }
      );
      
      if (!updatedAddress) {
        return fail(404, { error: 'Address not found' });
      }
      
      // Redirect back to addresses list
      throw redirect(303, '/profile/addresses');
    } catch (err) {
      console.error('Error updating address:', err);
      return fail(500, { 
        error: 'Failed to update address',
        values: { street, aptUnit, city, state, zipCode, instructions, isDefault }
      });
    }
  }
};
