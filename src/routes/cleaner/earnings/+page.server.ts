// src/routes/cleaner/earnings/+page.server.ts
import { db } from '$lib/server/db';
import { booking, cleanerPayoutSummary, service, address, user } from '$lib/server/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

// Helper function to get monthly earnings for the last 6 months
async function getMonthlyEarnings(cleanerId: string) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      month: date.toLocaleString('default', { month: 'long' }),
      year: date.getFullYear(),
      startDate: new Date(date.getFullYear(), date.getMonth(), 1),
      endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0)
    };
  }).reverse();

  const monthlyData = await Promise.all(
    months.map(async ({ month, year, startDate, endDate }) => {
      const result = await db
        .select({
          total: sql`SUM(${booking.price} * 0.75)`.mapWith(Number)
        })
        .from(booking)
        .where(
          and(
            eq(booking.cleanerId, cleanerId),
            eq(booking.status, 'COMPLETED'),
            gte(booking.scheduledDate, startDate),
            lte(booking.scheduledDate, endDate)
          )
        );

      return {
        month,
        year,
        earnings: result[0]?.total || 0
      };
    })
  );

  return monthlyData;
}

// Helper function to fetch all earnings data
async function getEarningsData(cleanerId: string) {
  // Get payout summary
  const payoutSummary = await db
    .select()
    .from(cleanerPayoutSummary)
    .where(eq(cleanerPayoutSummary.cleanerId, cleanerId))
    .limit(1);

  // If no summary exists, create default values
  const summary = payoutSummary.length > 0 ? payoutSummary[0] : {
    totalEarnings: 0,
    totalCommission: 0,
    totalPayout: 0,
    pendingPayout: 0,
    lastPayoutAmount: 0,
    lastPayoutDate: null,
    totalEarningsCurrentMonth: 0,
    totalEarningsLastMonth: 0
  };

  // Get payment schedule
  const nextThursday = new Date();
  nextThursday.setDate(nextThursday.getDate() + ((4 - nextThursday.getDay() + 7) % 7));

  // Get next 4 Thursdays
  const payoutDates = Array.from({ length: 4 }, (_, i) => {
    const date = new Date(nextThursday);
    date.setDate(date.getDate() + (i * 7));
    return date;
  });

  // Get last payout date for determining paid status
  const lastPayoutDate = summary.lastPayoutDate;

  // Get recent completed bookings
  const completedBookings = await db
    .select({
      id: booking.id,
      scheduledDate: booking.scheduledDate,
      price: booking.price,
      status: booking.status,
      service: {
        name: service.name,
      },
      address: {
        street: address.street,
        city: address.city,
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
        eq(booking.status, 'COMPLETED')
      )
    )
    .orderBy(desc(booking.scheduledDate))
    .limit(10);

  // Add isPaid flag to completed bookings
  const bookingsWithPaidStatus = completedBookings.map(b => ({
    ...b,
    isPaid: lastPayoutDate ? new Date(b.scheduledDate) < new Date(lastPayoutDate) : false
  }));

  // Calculate monthly breakdown for a chart
  const monthlyEarnings = await getMonthlyEarnings(cleanerId);

  return {
    summary,
    payoutDates,
    completedBookings: bookingsWithPaidStatus,
    monthlyEarnings
  };
}

export const load: PageServerLoad = async ({ locals }) => {
  const cleanerId = locals.user?.id;

  if (!cleanerId) {
    return {
      streamed: {
        earningsData: Promise.resolve({
          summary: {
            totalEarnings: 0,
            totalCommission: 0,
            totalPayout: 0,
            pendingPayout: 0,
            lastPayoutAmount: 0,
            lastPayoutDate: null,
            totalEarningsCurrentMonth: 0,
            totalEarningsLastMonth: 0
          },
          payoutDates: [],
          completedBookings: [],
          monthlyEarnings: []
        })
      }
    };
  }

  return {
    streamed: {
      earningsData: getEarningsData(cleanerId)
    }
  };
};
