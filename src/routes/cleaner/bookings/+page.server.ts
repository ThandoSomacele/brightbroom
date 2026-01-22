// src/routes/cleaner/bookings/+page.server.ts
import { db } from '$lib/server/db';
import { booking, address, user } from '$lib/server/db/schema';
import { eq, like, or, desc, gte, lte, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const cleanerId = locals.user?.id;
  
  // Get query parameters
  const status = url.searchParams.get('status') || '';
  const search = url.searchParams.get('search') || '';
  const dateFrom = url.searchParams.get('from') || '';
  const dateTo = url.searchParams.get('to') || '';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = 10;
  const offset = (page - 1) * limit;
  
  // Build query
  let query = db
    .select({
      id: booking.id,
      status: booking.status,
      scheduledDate: booking.scheduledDate,
      price: booking.price,
      bedroomCount: booking.bedroomCount,
      bathroomCount: booking.bathroomCount,
      address: {
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
      },
      customer: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      }
    })
    .from(booking)
    .innerJoin(address, eq(booking.addressId, address.id))
    .innerJoin(user, eq(booking.userId, user.id))
    .where(eq(booking.cleanerId, cleanerId));
  
  // Apply filters
  if (status) {
    query = query.where(eq(booking.status, status));
  }
  
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
  
  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    query = query.where(gte(booking.scheduledDate, fromDate));
  }
  
  if (dateTo) {
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999); // End of day
    query = query.where(lte(booking.scheduledDate, toDate));
  }
  
  // Count total for pagination
  const countQuery = db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(booking)
    .where(eq(booking.cleanerId, cleanerId));
  
  // Apply the same filters to count query
  if (status) {
    countQuery.where(eq(booking.status, status));
  }
  
  if (search) {
    countQuery.where(
      or(
        like(user.firstName, `%${search}%`),
        like(user.lastName, `%${search}%`),
        like(address.street, `%${search}%`),
        like(address.city, `%${search}%`)
      )
    );
  }
  
  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    countQuery.where(gte(booking.scheduledDate, fromDate));
  }
  
  if (dateTo) {
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    countQuery.where(lte(booking.scheduledDate, toDate));
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
    },
    filters: {
      status,
      search,
      dateFrom,
      dateTo
    }
  };
};
