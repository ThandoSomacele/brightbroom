// src/routes/api/users/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq, like, or, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  try {
    // Get query parameters
    const role = url.searchParams.get('role') as any;
    const search = url.searchParams.get('search') || undefined;
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query
    let query = db.select().from(user);
    
    // Apply filters
    if (role) {
      query = query.where(eq(user.role, role));
    }
    
    if (search) {
      query = query.where(
        or(
          like(user.firstName, `%${search}%`),
          like(user.lastName, `%${search}%`),
          like(user.email, `%${search}%`)
        )
      );
    }
    
    // Execute query with pagination
    const users = await query
      .limit(limit)
      .offset(skip)
      .orderBy(desc(user.createdAt));

    // Count total for pagination
    const countQuery = db.select({ count: db.fn.count() }).from(user);
    
    if (role) {
      countQuery.where(eq(user.role, role));
    }
    
    if (search) {
      countQuery.where(
        or(
          like(user.firstName, `%${search}%`),
          like(user.lastName, `%${search}%`),
          like(user.email, `%${search}%`)
        )
      );
    }
    
    const [{ count }] = await countQuery;
    const total = Number(count) || 0;

    // Remove passwordHash from user objects for security
    const safeUsers = users.map(u => {
      const { passwordHash, ...safeUser } = u;
      return safeUser;
    });

    return json({
      users: safeUsers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return json({ error: 'Failed to fetch users' }, { status: 500 });
  }
};
