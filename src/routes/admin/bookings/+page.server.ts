// src/routes/admin/bookings/+page.server.ts
import { db } from '$lib/server/db';
import { booking, user, address, payment } from '$lib/server/db/schema';
import { eq, and, gte, lte, like, or, desc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

// Helper function to fetch bookings with all filters
async function getBookings(
  search: string,
  status: string,
  dateStart: string,
  dateEnd: string,
  page: number,
  limit: number
) {
  const offset = (page - 1) * limit;

  try {
    // Build the query with filters
    let query = db.select({
      id: booking.id,
      status: booking.status,
      scheduledDate: booking.scheduledDate,
      createdAt: booking.createdAt,
      price: booking.price,
      cleanerId: booking.cleanerId,
      bedroomCount: booking.bedroomCount,
      bathroomCount: booking.bathroomCount,
      customer: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      address: {
        street: address.street,
        city: address.city,
      },
      paymentStatus: payment.status
    })
    .from(booking)
    .innerJoin(user, eq(booking.userId, user.id))
    .innerJoin(address, eq(booking.addressId, address.id))
    .leftJoin(payment, eq(booking.id, payment.bookingId));

    // Apply search filter
    if (search) {
      query = query.where(
        or(
          like(user.firstName, `%${search}%`),
          like(user.lastName, `%${search}%`),
          like(user.email, `%${search}%`),
          like(address.street, `%${search}%`),
          like(address.city, `%${search}%`)
        )
      );
    }

    // Apply status filter
    if (status && status !== 'ALL') {
      query = query.where(eq(booking.status, status));
    }

    // Apply date range filters
    if (dateStart) {
      const startDate = new Date(dateStart);
      query = query.where(gte(booking.scheduledDate, startDate));
    }

    if (dateEnd) {
      const endDate = new Date(dateEnd);
      endDate.setHours(23, 59, 59, 999);
      query = query.where(lte(booking.scheduledDate, endDate));
    }

    // Clone the query for counting total
    const countQuery = db.select({
      count: sql<number>`count(*)`.mapWith(Number)
    })
    .from(booking)
    .innerJoin(user, eq(booking.userId, user.id))
    .innerJoin(address, eq(booking.addressId, address.id));

    // Apply the same filters to the count query
    if (search) {
      countQuery.where(
        or(
          like(user.firstName, `%${search}%`),
          like(user.lastName, `%${search}%`),
          like(user.email, `%${search}%`),
          like(address.street, `%${search}%`),
          like(address.city, `%${search}%`)
        )
      );
    }

    if (status && status !== 'ALL') {
      countQuery.where(eq(booking.status, status));
    }

    if (dateStart) {
      const startDate = new Date(dateStart);
      countQuery.where(gte(booking.scheduledDate, startDate));
    }

    if (dateEnd) {
      const endDate = new Date(dateEnd);
      endDate.setHours(23, 59, 59, 999);
      countQuery.where(lte(booking.scheduledDate, endDate));
    }

    // Execute both queries
    const [bookings, countResult] = await Promise.all([
      query
        .orderBy(desc(booking.createdAt))
        .limit(limit)
        .offset(offset),
      countQuery
    ]);

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  } catch (error) {
    console.error('Error loading bookings:', error);
    return {
      bookings: [],
      pagination: {
        page: 1,
        limit,
        total: 0,
        totalPages: 0
      }
    };
  }
}

export const load: PageServerLoad = async ({ url }) => {
  // Get search and filter parameters - these are synchronous
  const search = url.searchParams.get('search') || '';
  const status = url.searchParams.get('status') || '';
  const dateStart = url.searchParams.get('dateStart') || '';
  const dateEnd = url.searchParams.get('dateEnd') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 10;

  // Status options are static, no need to stream
  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  // Return filters immediately, stream the data
  return {
    filters: {
      search,
      status,
      dateStart,
      dateEnd
    },
    statusOptions,
    currentPage: page,
    // Stream the bookings data
    streamed: {
      bookingsData: getBookings(search, status, dateStart, dateEnd, page, limit)
    }
  };
};
