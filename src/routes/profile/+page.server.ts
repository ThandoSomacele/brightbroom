// src/routes/profile/+page.server.ts
import { db } from '$lib/server/db';
import { address, booking, service } from '$lib/server/db/schema';
import { error, redirect } from '@sveltejs/kit';
import { and, eq, gte, sql } from 'drizzle-orm';
import { instantToSASTString } from '$lib/utils/date-utils';
import type { PageServerLoad } from './$types';

// Helper function to fetch upcoming bookings
async function getUpcomingBookings(userId: string) {
  const now = instantToSASTString();
  return db.select({
    id: booking.id,
    status: booking.status,
    scheduledDate: booking.scheduledDate,
    price: booking.price,
    service: {
      id: service.id,
      name: service.name,
    },
    address: {
      id: address.id,
      street: sql<string>`coalesce(${address.street}, ${booking.guestAddress}->>'street', '(guest address)')`,
      city: sql<string>`coalesce(${address.city}, ${booking.guestAddress}->>'city', '')`,
    }
  })
  .from(booking)
  .innerJoin(service, eq(booking.serviceId, service.id))
  .leftJoin(address, eq(booking.addressId, address.id))
  .where(
    and(
      eq(booking.userId, userId),
      gte(booking.scheduledDate, now)
    )
  )
  .orderBy(booking.scheduledDate)
  .limit(3);
}

export const load: PageServerLoad = async ({ locals }) => {
  // Check if the user is logged in
  if (!locals.user) {
    throw redirect(302, '/auth/login?redirectTo=/profile');
  }

  return {
    user: locals.user,
    streamed: {
      upcomingBookings: getUpcomingBookings(locals.user.id)
    }
  };
};
