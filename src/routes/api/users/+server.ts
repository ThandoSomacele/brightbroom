import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { userService } from '$lib/server/services/user.service';

export const GET: RequestHandler = async ({ url }) => {
  try {
    // Get query parameters
    const role = url.searchParams.get('role') as any;
    const search = url.searchParams.get('search') || undefined;
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get users with pagination
    const users = await userService.getUsers({
      role,
      search,
      skip,
      take: limit
    });

    // Get total count for pagination
    const total = await userService.countUsers({ role, search });

    // Remove passwordHash from user objects for security
    const safeUsers = users.map(user => {
      const { passwordHash, ...safeUser } = user;
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
