// src/routes/api/addresses/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addressService } from '$lib/server/services/address.service';

export const POST: RequestHandler = async ({ request, locals }) => {
  // Check authentication
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    
    // Create new address using service
    const newAddress = await addressService.createAddress(locals.user.id, data);
    
    return json({ address: newAddress }, { status: 201 });
  } catch (error) {
    console.error('Error creating address:', error);
    return json({ error: 'Failed to create address' }, { status: 500 });
  }
};

// Similar implementations for PUT/PATCH endpoints for updating addresses
