// src/routes/admin/users/+page.server.ts
import { db } from "$lib/server/db";
import { booking, user, userRoleEnum } from "$lib/server/db/schema";
import { error } from "@sveltejs/kit";
import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { PageServerLoad } from "./$types";
import { requireAdmin } from "$lib/server/route-guards";

type UserRole = (typeof userRoleEnum.enumValues)[number];

function isUserRole(value: string): value is UserRole {
  return (userRoleEnum.enumValues as readonly string[]).includes(value);
}

// Helper function to fetch users with filters
async function getUsers(
  search: string,
  role: string,
  page: number,
  limit: number
) {
  const offset = (page - 1) * limit;

  try {
    // Collect every filter and apply them in ONE .where(): calling .where()
    // twice replaces the first condition, which silently dropped the search
    // filter whenever a role filter was also chosen.
    const conditions: SQL[] = [];

    // Apply search filter if provided
    if (search) {
      const searchCondition = or(
        like(user.firstName, `%${search}%`),
        like(user.lastName, `%${search}%`),
        like(user.email, `%${search}%`),
        like(user.phone, `%${search}%`),
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    // Apply role filter if provided
    if (role && role !== "ALL" && isUserRole(role)) {
      conditions.push(eq(user.role, role));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build the query with filters
    const query = db
      .select({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(whereClause);

    // Count query with the same filters
    const countQuery = db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(user)
      .where(whereClause);

    // Execute both queries
    const [users, countResult] = await Promise.all([
      query.orderBy(desc(user.createdAt)).limit(limit).offset(offset),
      countQuery,
    ]);

    // Get all user IDs to fetch booking counts
    const userIds = users.map((u) => u.id);

    // Get booking counts in a separate query
    const bookingCounts =
      userIds.length > 0
        ? await db
            .select({
              userId: booking.userId,
              count: sql<number>`count(*)`.mapWith(Number),
            })
            .from(booking)
            .where(inArray(booking.userId, userIds))
            .groupBy(booking.userId)
        : [];

    // Map booking counts to users
    const usersWithBookingCount = users.map((u) => ({
      ...u,
      bookingsCount: bookingCounts.find((bc) => bc.userId === u.id)?.count || 0,
    }));

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      users: usersWithBookingCount,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Error loading users:", error);
    return {
      users: [],
      pagination: {
        page: 1,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  }
}

export const load: PageServerLoad = async ({ url, locals }) => {
  requireAdmin(locals, { platformOnly: true });
  // The platform user directory spans every tenant, so it is platform-admin
  // only. hooks.server.ts blocks the route too; this is defence in depth.
  if (locals.user?.role !== "ADMIN") {
    throw error(403, "This area is restricted to platform administrators");
  }

  // Get query parameters for filtering and pagination
  const search = url.searchParams.get("search") || "";
  const role = url.searchParams.get("role") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 10;

  // Return filters immediately, stream the data
  return {
    filters: {
      search,
      role,
    },
    currentPage: page,
    // Stream the users data
    streamed: {
      usersData: getUsers(search, role, page, limit),
    },
  };
};
