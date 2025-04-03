// src/routes/profile/addresses/new/+page.server.ts
import { addressService } from '$lib/server/services/address.service';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Check if user is logged in
  if (!locals.user) {
    throw redirect(302, '/auth/login?redirectTo=/profile/addresses/new');
  }
  
  // Get redirect URL if it exists
  const redirectTo = locals.redirectTo || '/profile/addresses';
  
  return {
    redirectTo
  };
};

export const actions: Actions = {
  default: async ({ request, locals, url }) => {
    // Check if user is logged in
    if (!locals.user) {
      throw redirect(302, '/auth/login');
    }
    
    // Process form data
    const formData = await request.formData();
    const street = formData.get('street')?.toString();
    const aptUnit = formData.get('aptUnit')?.toString() || null;
    const city = formData.get('city')?.toString();
    const state = formData.get('state')?.toString();
    const zipCode = formData.get('zipCode')?.toString();
    const instructions = formData.get('instructions')?.toString() || null;
    const isDefault = formData.get('isDefault') === 'on';
    
    // Get redirect URL if provided
    const redirectTo = formData.get('redirectTo')?.toString() || 
                      url.searchParams.get('redirectTo') || 
                      '/profile/addresses';
    
    // Validate required fields
    if (!street || !city || !state || !zipCode) {
      return fail(400, { 
        error: 'Please fill in all required fields',
        values: { street, aptUnit, city, state, zipCode, instructions, isDefault, redirectTo }
      });
    }
    
    try {
      // Create the address using our service
      await addressService.createAddress(
        locals.user.id,
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
      
      // Redirect to the appropriate page
      throw redirect(303, redirectTo);
    } catch (err) {
      console.error('Error creating address:', err);
      return fail(500, { 
        error: 'Failed to create address',
        values: { street, aptUnit, city, state, zipCode, instructions, isDefault, redirectTo }
      });
    }
  }
};
