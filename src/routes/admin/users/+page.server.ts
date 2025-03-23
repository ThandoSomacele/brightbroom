// src/routes/admin/users/+page.server.ts
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { user, booking } from '$lib/server/db/schema';
import { eq, like, or, and, desc, count, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
  // Get query parameters for filtering and pagination
  const search = url.searchParams.get('search') || '';
  const role = url.searchParams.get('role') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 10; // Number of items per page
  const offset = (page - 1) * limit;
  
  try {
    // Build the query with filters
    let query = db.select({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      // Count related bookings for each user (as a subquery)
      bookingsCount: db.select({
        value: count()
      })
      .from(booking)
      .where(eq(booking.userId, user.id))
      .as('bookings_count')
    })
    .from(user);
    
    // Apply search filter if provided
    if (search) {
      query = query.where(
        or(
          like(user.firstName, `%${search}%`),
          like(user.lastName, `%${search}%`),
          like(user.email, `%${search}%`),
          like(user.phone || '', `%${search}%`)
        )
      );
    }
    
    // Apply role filter if provided
    if (role && role !== 'ALL') {
      query = query.where(eq(user.role, role));
    }
    
    // Clone the query for counting total
    const countQuery = db.select({
      count: sql<number>`count(*)`.mapWith(Number)
    })
    .from(user);
    
    // Apply the same filters to the count query
    if (search) {
      countQuery.where(
        or(
          like(user.firstName, `%${search}%`),
          like(user.lastName, `%${search}%`),
          like(user.email, `%${search}%`),
          like(user.phone || '', `%${search}%`)
        )
      );
    }
    
    if (role && role !== 'ALL') {
      countQuery.where(eq(user.role, role));
    }
    
    // Execute both queries
    const [users, countResult] = await Promise.all([
      query
        .orderBy(desc(user.createdAt))
        .limit(limit)
        .offset(offset),
      countQuery
    ]);
    
    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);
    
    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      filters: {
        search,
        role
      }
    };
  } catch (error) {
    console.error('Error loading users:', error);
    return {
      users: [],
      pagination: {
        page: 1,
        limit,
        total: 0,
        totalPages: 0
      },
      filters: {
        search,
        role
      }
    };
  }
};
