// src/routes/api/bookings/[id]/assign-cleaner/+server.ts
import { json } from '@sveltejs/kit';
import { cleanerAssignmentService } from '$lib/server/services/cleaner-assignment.service';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
  // Check authentication
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  // Check authorization (only admin can auto-assign)
  if (locals.user.role !== 'ADMIN') {
    return json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Get the booking ID from route params
  const bookingId = params.id;
  
  if (!bookingId) {
    return json({ error: 'Booking ID is required' }, { status: 400 });
  }

  try {
    // Auto-assign the cleaner
    const result = await cleanerAssignmentService.autoAssignCleaner(bookingId);
    
    if (!result.success) {
      return json({ 
        success: false,
        message: result.message || 'Failed to assign cleaner'
      }, { status: 400 });
    }

    return json({
      success: true,
      cleanerId: result.cleanerId,
      message: result.message
    });
  } catch (error) {
    console.error('Error auto-assigning cleaner:', error);
    
    return json({ 
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
};
