// src/routes/api/addresses/[id]/default/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addressService } from '$lib/server/services/address.service';

export const POST: RequestHandler = async ({ params, locals }) => {
  // Check authentication
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const addressId = params.id;
  
  try {
    const updatedAddress = await addressService.setDefaultAddress(locals.user.id, addressId);
    
    if (!updatedAddress) {
      return json({ error: 'Address not found' }, { status: 404 });
    }
    
    return json({ address: updatedAddress });
  } catch (error) {
    console.error('Error setting default address:', error);
    return json({ error: 'Failed to set default address' }, { status: 500 });
  }
};
