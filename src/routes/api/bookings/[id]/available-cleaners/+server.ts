// src/routes/api/bookings/[id]/available-cleaners/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { cleanerAssignmentService } from '$lib/server/services/cleaner-assignment.service';

export const GET: RequestHandler = async ({ params, locals }) => {
  // Check if user is admin
  if (!locals.user || locals.user.role !== 'ADMIN') {
    return json({ error: 'Unauthorized' }, { status: 403 });
  }

  const bookingId = params.id;
  
  if (!bookingId) {
    return json({ error: 'Booking ID is required' }, { status: 400 });
  }

  try {
    // Get available cleaners for this booking
    const result = await cleanerAssignmentService.findAvailableCleaners(bookingId);
    
    return json({
      cleaners: result.cleaners,
      bookingData: result.bookingData
    });
  } catch (error) {
    console.error('Error finding available cleaners:', error);
    
    return json({ 
      error: 'Failed to find available cleaners',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
