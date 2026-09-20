// src/routes/cleaner/bookings/+page.server.ts
import { db } from '$lib/server/db';
import { booking, address, user } from '$lib/server/db/schema';
import { eq, like, or, desc, gte, lte, sql, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

interface FilterParams {
  cleanerId: string;
  status: string;
  search: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  limit: number;
}

// Helper function to fetch bookings data
async function getBookingsData(params: FilterParams) {
  const { cleanerId, status, search, dateFrom, dateTo, page, limit } = params;
  const offset = (page - 1) * limit;

  // Build where conditions array
  const conditions = [eq(booking.cleanerId, cleanerId)];

  if (status) {
    conditions.push(eq(booking.status, status));
  }

  if (dateFrom) {
    conditions.push(gte(booking.scheduledDate, `${dateFrom} 00:00:00`));
  }

  if (dateTo) {
    conditions.push(lte(booking.scheduledDate, `${dateTo} 23:59:59`));
  }

  // Build main query
  let query = db
    .select({
      id: booking.id,
      status: booking.status,
      scheduledDate: booking.scheduledDate,
      price: booking.price,
      bedroomCount: booking.bedroomCount,
      bathroomCount: booking.bathroomCount,
      address: {
        // Guest bookings keep their address in the guestAddress JSON
        street: sql<string>`coalesce(${address.street}, ${booking.guestAddress}->>'street', '(guest address)')`,
        city: sql<string>`coalesce(${address.city}, ${booking.guestAddress}->>'city', '')`,
        state: sql<string>`coalesce(${address.state}, ${booking.guestAddress}->>'state', '')`,
        zipCode: sql<string>`coalesce(${address.zipCode}, ${booking.guestAddress}->>'zipCode', '')`,
      },
      customer: {
        firstName: sql<string>`coalesce(${user.firstName}, 'Guest')`,
        lastName: sql<string>`coalesce(${user.lastName}, '')`,
        email: user.email,
        phone: user.phone,
      }
    })
    .from(booking)
    .leftJoin(address, eq(booking.addressId, address.id))
    .leftJoin(user, eq(booking.userId, user.id))
    .where(and(...conditions));

  // Apply search filter
  if (search) {
    query = query.where(
      or(
        like(user.firstName, `%${search}%`),
        like(user.lastName, `%${search}%`),
        like(address.street, `%${search}%`),
        like(address.city, `%${search}%`)
      )
    );
  }

  // Build count query with same conditions
  let countQuery = db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(booking)
    .leftJoin(address, eq(booking.addressId, address.id))
    .leftJoin(user, eq(booking.userId, user.id))
    .where(and(...conditions));

  if (search) {
    countQuery = countQuery.where(
      or(
        like(user.firstName, `%${search}%`),
        like(user.lastName, `%${search}%`),
        like(address.street, `%${search}%`),
        like(address.city, `%${search}%`)
      )
    );
  }

  // Execute queries
  const [bookings, countResult] = await Promise.all([
    query.orderBy(desc(booking.scheduledDate)).limit(limit).offset(offset),
    countQuery
  ]);

  const total = countResult[0]?.count || 0;

  return {
    bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const cleanerId = locals.user?.id;

  if (!cleanerId) {
    return {
      filters: {
        status: '',
        search: '',
        dateFrom: '',
        dateTo: ''
      },
      streamed: {
        bookingsData: Promise.resolve({
          bookings: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
          }
        })
      }
    };
  }

  // Get query parameters
  const status = url.searchParams.get('status') || '';
  const search = url.searchParams.get('search') || '';
  const dateFrom = url.searchParams.get('from') || '';
  const dateTo = url.searchParams.get('to') || '';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = 10;

  return {
    filters: {
      status,
      search,
      dateFrom,
      dateTo
    },
    streamed: {
      bookingsData: getBookingsData({
        cleanerId,
        status,
        search,
        dateFrom,
        dateTo,
        page,
        limit
      })
    }
  };
};
