// src/routes/profile/bookings/[id]/cancel/+page.server.ts
import { db } from '$lib/server/db';
import { booking } from '$lib/server/db/schema';
import { error, fail, redirect } from '@sveltejs/kit';
import { eq, and, or } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

// Redirect if accessed directly
export const load: PageServerLoad = async ({ params, locals }) => {
  throw redirect(302, `/profile/bookings/${params.id}`);
};

export const actions: Actions = {
  default: async ({ params, locals }) => {
    // Check if the user is logged in
    if (!locals.user) {
      return fail(401, { error: 'You must be logged in to cancel a booking' });
    }
    
    const bookingId = params.id;
    
    try {
      // Get the booking
      const bookings = await db.select()
        .from(booking)
        .where(
          and(
            eq(booking.id, bookingId),
            eq(booking.userId, locals.user.id),
            or(
              eq(booking.status, 'PENDING'),
              eq(booking.status, 'CONFIRMED')
            )
          )
        )
        .limit(1);
      
      if (bookings.length === 0) {
        return fail(404, { error: 'Booking not found or cannot be cancelled' });
      }
      
      const currentBooking = bookings[0];
      
      // Check if booking is in the past
      const now = new Date();
      if (currentBooking.scheduledDate < now) {
        return fail(400, { error: 'Cannot cancel a past booking' });
      }
      
      // Update booking status to CANCELLED
      await db.update(booking)
        .set({
          status: 'CANCELLED',
          updatedAt: new Date()
        })
        .where(eq(booking.id, bookingId));
      
      // Redirect to booking details page
      throw redirect(302, `/profile/bookings/${bookingId}?cancelled=true`);
    } catch (err) {
      console.error('Error cancelling booking:', err);
      return fail(500, { error: 'Failed to cancel booking' });
    }
  }
};
