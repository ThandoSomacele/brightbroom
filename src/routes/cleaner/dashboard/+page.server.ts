// src/routes/cleaner/dashboard/+page.server.ts
import { db } from '$lib/server/db';
import { booking, payment, user, service, address } from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const cleanerId = locals.user?.id;
  const now = new Date();
  
  // Get upcoming bookings (next 7 days)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const upcomingBookings = await db
    .select({
      id: booking.id,
      status: booking.status,
      scheduledDate: booking.scheduledDate,
      price: booking.price,
      service: {
        name: service.name,
      },
      address: {
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
      },
      customer: {
        firstName: user.firstName,
        lastName: user.lastName,
      }
    })
    .from(booking)
    .innerJoin(service, eq(booking.serviceId, service.id))
    .innerJoin(address, eq(booking.addressId, address.id))
    .innerJoin(user, eq(booking.userId, user.id))
    .where(
      and(
        eq(booking.cleanerId, cleanerId),
        eq(booking.status, 'CONFIRMED'),
        gt(booking.scheduledDate, now)
      )
    )
    .orderBy(booking.scheduledDate)
    .limit(5);
    
  // Get earnings summary
  const currentMonth = new Date();
  currentMonth.setDate(1); // First day of current month
  currentMonth.setHours(0, 0, 0, 0);
  
  const lastMonth = new Date(currentMonth);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const totalEarnings = await db
    .select({
      total: sql`SUM(${booking.price} * 0.75)`.mapWith(Number), // Assuming 75% of booking price
    })
    .from(booking)
    .where(
      and(
        eq(booking.cleanerId, cleanerId),
        eq(booking.status, 'COMPLETED')
      )
    );
    
  const currentMonthEarnings = await db
    .select({
      total: sql`SUM(${booking.price} * 0.75)`.mapWith(Number),
    })
    .from(booking)
    .where(
      and(
        eq(booking.cleanerId, cleanerId),
        eq(booking.status, 'COMPLETED'),
        gt(booking.scheduledDate, currentMonth)
      )
    );
    
  // Get next payout date (next Thursday)
  const nextThursday = new Date();
  nextThursday.setDate(nextThursday.getDate() + ((4 - nextThursday.getDay() + 7) % 7));
  
  // Get payout amount (completed bookings since last Thursday that haven't been paid)
  const lastThursday = new Date(nextThursday);
  lastThursday.setDate(lastThursday.getDate() - 7);
  
  const pendingPayoutAmount = await db
    .select({
      total: sql`SUM(${booking.price} * 0.75)`.mapWith(Number),
    })
    .from(booking)
    .where(
      and(
        eq(booking.cleanerId, cleanerId),
        eq(booking.status, 'COMPLETED'),
        gt(booking.scheduledDate, lastThursday),
        lt(booking.scheduledDate, nextThursday)
      )
    );
    
  return {
    upcomingBookings,
    earnings: {
      total: totalEarnings[0]?.total || 0,
      currentMonth: currentMonthEarnings[0]?.total || 0,
      nextPayout: {
        date: nextThursday,
        amount: pendingPayoutAmount[0]?.total || 0
      }
    }
  };
};
