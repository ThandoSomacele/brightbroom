// src/routes/admin/users/+page.server.ts
import { db } from "$lib/server/db";
import { booking, user } from "$lib/server/db/schema";
import { desc, eq, like, or, sql } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
  // Get query parameters for filtering and pagination
  const search = url.searchParams.get("search") || "";
  const role = url.searchParams.get("role") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 10; // Number of items per page
  const offset = (page - 1) * limit;

  try {
    // Build the query with filters
    let query = db
      .select({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user);

    // Apply search filter if provided
    if (search) {
      query = query.where(
        or(
          like(user.firstName, `%${search}%`),
          like(user.lastName, `%${search}%`),
          like(user.email, `%${search}%`),
          like(user.phone || "", `%${search}%`),
        ),
      );
    }

    // Apply role filter if provided
    if (role && role !== "ALL") {
      query = query.where(eq(user.role, role));
    }

    // Clone the query for counting total
    const countQuery = db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(user);

    // Apply the same filters to the count query
    if (search) {
      countQuery.where(
        or(
          like(user.firstName, `%${search}%`),
          like(user.lastName, `%${search}%`),
          like(user.email, `%${search}%`),
          like(user.phone || "", `%${search}%`),
        ),
      );
    }

    if (role && role !== "ALL") {
      countQuery.where(eq(user.role, role));
    }

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
            .where(sql`${booking.userId} IN (${userIds.join(",")})`)
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
      filters: {
        search,
        role,
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
      filters: {
        search,
        role,
      },
    };
  }
};
