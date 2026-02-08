// src/routes/admin/bookings/+page.server.ts
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { booking, service, user, address } from '$lib/server/db/schema';
import { eq, and, gte, lte, like, or, desc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url, locals }) => {
  // Get search and filter parameters
  const search = url.searchParams.get('search') || '';
  const status = url.searchParams.get('status') || '';
  const dateStart = url.searchParams.get('dateStart') || '';
  const dateEnd = url.searchParams.get('dateEnd') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 10; // Number of items per page
  const offset = (page - 1) * limit;

  // Tenant scoping
  const tenantId = locals.user?.role === 'TENANT_ADMIN' ? locals.tenant?.id || null : null;
  
  try {
    // Build conditions array
    const conditions: any[] = [];
    const countConditions: any[] = [];

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
        like(service.name, `%${search}%`),
        like(address.street, `%${search}%`),
        like(address.city, `%${search}%`)
      )!;
      conditions.push(searchCondition);
      countConditions.push(searchCondition);
    }

    if (status && status !== 'ALL') {
      conditions.push(eq(booking.status, status));
      countConditions.push(eq(booking.status, status));
    }

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

    // Build the query with filters
    let query = db.select({
      id: booking.id,
      status: booking.status,
      scheduledDate: booking.scheduledDate,
      price: booking.price,
      service: {
        id: service.id,
        name: service.name,
      },
      customer: {
        id: user.id,
        name: sql`${user.firstName} || ' ' || ${user.lastName}`,
        email: user.email,
      },
      address: {
        street: address.street,
        city: address.city,
      }
    })
    .from(booking)
    .innerJoin(service, eq(booking.serviceId, service.id))
    .innerJoin(user, eq(booking.userId, user.id))
    .innerJoin(address, eq(booking.addressId, address.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Count query
    let countQuery = db.select({
      count: sql<number>`count(*)`.mapWith(Number)
    })
    .from(booking)
    .innerJoin(service, eq(booking.serviceId, service.id))
    .innerJoin(user, eq(booking.userId, user.id))
    .innerJoin(address, eq(booking.addressId, address.id));

    if (countConditions.length > 0) {
      countQuery = countQuery.where(and(...countConditions));
    }

    // Execute both queries
    const [bookings, countResult] = await Promise.all([
      query
        .orderBy(desc(booking.scheduledDate))
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
      },
      filters: {
        search,
        status,
        dateStart,
        dateEnd
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
      },
      filters: {
        search,
        status,
        dateStart,
        dateEnd
      }
    };
  }
};
