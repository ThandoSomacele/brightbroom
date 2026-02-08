// src/routes/admin/bookings/+page.server.ts
import { db } from '$lib/server/db';
import { booking, user, address, payment } from '$lib/server/db/schema';
import { eq, and, gte, lte, like, or, desc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

// Helper function to fetch bookings with all filters
async function getBookings(
  search: string,
  status: string,
  dateStart: string,
  dateEnd: string,
  page: number,
  limit: number,
  tenantId: string | null
) {
  const offset = (page - 1) * limit;

  try {
    // Build conditions array
    const conditions: SQL[] = [];
    const countConditions: SQL[] = [];

    // Tenant scoping
    if (tenantId) {
      conditions.push(eq(booking.tenantId, tenantId));
      countConditions.push(eq(booking.tenantId, tenantId));
    }

    // Search filter
    if (search) {
      const searchCondition = or(
        like(user.firstName, `%${search}%`),
        like(user.lastName, `%${search}%`),
        like(user.email, `%${search}%`),
        like(address.street, `%${search}%`),
        like(address.city, `%${search}%`)
      )!;
      conditions.push(searchCondition);
      countConditions.push(searchCondition);
    }

    // Status filter
    if (status && status !== 'ALL') {
      conditions.push(eq(booking.status, status));
      countConditions.push(eq(booking.status, status));
    }

    // Date range filters
    if (dateStart) {
      const startDate = new Date(dateStart);
      conditions.push(gte(booking.scheduledDate, startDate));
      countConditions.push(gte(booking.scheduledDate, startDate));
    }

    if (dateEnd) {
      const endDate = new Date(dateEnd);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(booking.scheduledDate, endDate));
      countConditions.push(lte(booking.scheduledDate, endDate));
    }

    // Build query
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

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Count query
    let countQuery = db.select({
      count: sql<number>`count(*)`.mapWith(Number)
    })
    .from(booking)
    .innerJoin(user, eq(booking.userId, user.id))
    .innerJoin(address, eq(booking.addressId, address.id));

    if (countConditions.length > 0) {
      countQuery = countQuery.where(and(...countConditions));
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

export const load: PageServerLoad = async ({ url, locals }) => {
  const search = url.searchParams.get('search') || '';
  const status = url.searchParams.get('status') || '';
  const dateStart = url.searchParams.get('dateStart') || '';
  const dateEnd = url.searchParams.get('dateEnd') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 10;

  // Tenant scoping: tenant admins see only their tenant's bookings
  const tenantId = locals.user?.role === 'TENANT_ADMIN' ? locals.tenant?.id || null : null;

  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  return {
    filters: {
      search,
      status,
      dateStart,
      dateEnd
    },
    statusOptions,
    currentPage: page,
    streamed: {
      bookingsData: getBookings(search, status, dateStart, dateEnd, page, limit, tenantId)
    }
  };
};
