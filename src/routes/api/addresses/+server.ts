// src/routes/api/addresses/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addressService, MAX_ADDRESSES } from '$lib/server/services/address.service';

export const GET: RequestHandler = async ({ locals }) => {
  // Check authentication
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get user's addresses
    const addresses = await addressService.getUserAddresses(locals.user.id);
    
    // Return address count info too
    return json({ 
      addresses,
      count: addresses.length,
      limit: MAX_ADDRESSES,
      remaining: Math.max(0, MAX_ADDRESSES - addresses.length)
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  // Check authentication
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Check if user has reached address limit
  const hasReachedLimit = await addressService.hasReachedAddressLimit(locals.user.id);
  if (hasReachedLimit) {
    return json({ 
      error: `You have reached the maximum limit of ${MAX_ADDRESSES} addresses` 
    }, { status: 400 });
  }
  
  try {
    const data = await request.json();
    
    // Create new address using service
    const newAddress = await addressService.createAddress(locals.user.id, data);
    
    return json({ address: newAddress }, { status: 201 });
  } catch (error) {
    console.error('Error creating address:', error);
    
    // Check if this is a limit error
    const errorMessage = error instanceof Error && error.message.includes('Maximum limit') 
      ? error.message 
      : 'Failed to create address';
    
    return json({ error: errorMessage }, { status: 500 });
  }
};

// We need to add this method to the addressService
// Add this to src/lib/server/services/address.service.ts
/*
async getUserAddresses(userId: string): Promise<typeof address.$inferSelect[]> {
  try {
    return await db.select()
      .from(address)
      .where(eq(address.userId, userId))
      .orderBy(address.isDefault, { direction: 'desc' });
  } catch (error) {
    console.error('Error fetching user addresses:', error);
    return [];
  }
}
*/
