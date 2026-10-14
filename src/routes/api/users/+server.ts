// src/routes/api/users/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { and, eq, like, or, desc, count } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
  // User directory: admins only
  if (!locals.user || locals.user.role !== 'ADMIN') {
    return json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // Get query parameters
    const role = url.searchParams.get('role') as any;
    const search = url.searchParams.get('search') || undefined;
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build filters once; calling .where() twice would replace the first condition
    const conditions = [];
    if (role) conditions.push(eq(user.role, role));
    if (search) {
      conditions.push(
        or(
          like(user.firstName, `%${search}%`),
          like(user.lastName, `%${search}%`),
          like(user.email, `%${search}%`)
        )
      );
    }
    const where = conditions.length ? and(...conditions) : undefined;

    // Execute query with pagination
    const users = await db
      .select()
      .from(user)
      .where(where)
      .limit(limit)
      .offset(skip)
      .orderBy(desc(user.createdAt));

    // Count total for pagination
    const countQuery = db.select({ count: count() }).from(user).where(where);

    const [{ count: totalCount }] = await countQuery;
    const total = Number(totalCount) || 0;

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
