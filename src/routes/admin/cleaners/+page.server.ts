// src/routes/admin/cleaners/+page.server.ts
import { db } from "$lib/server/db";
import {
  cleanerProfile,
  user,
} from "$lib/server/db/schema";
import { redirect } from "@sveltejs/kit";
import { desc, eq, like, or, sql } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url, locals }) => {
  // Verify admin role
  if (!locals.user || locals.user.role !== "ADMIN") {
    throw redirect(302, "/auth/login?redirectTo=/admin/cleaners");
  }

  // Get query parameters for filtering and pagination
  const search = url.searchParams.get("search") || "";
  const availability = url.searchParams.get("availability") || "";
  const training = url.searchParams.get("training") || ""; // HOME, OFFICE, or NONE
  const status = url.searchParams.get("status") || "";
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
        createdAt: user.createdAt,
        isActive: user.isActive,
        cleanerProfile: {
          id: cleanerProfile.id,
          profileImageUrl: cleanerProfile.profileImageUrl,
          rating: cleanerProfile.rating,
          isAvailable: cleanerProfile.isAvailable,
          workRadius: cleanerProfile.workRadius,
          bio: cleanerProfile.bio,
          petCompatibility: cleanerProfile.petCompatibility,
          trainingCompleted: cleanerProfile.trainingCompleted,
        },
      })
      .from(user)
      .leftJoin(cleanerProfile, eq(user.id, cleanerProfile.userId))
      .where(eq(user.role, "CLEANER"));

    // Apply search filter if provided
    if (search) {
      query = query.where(
        or(
          like(user.firstName, `%${search}%`),
          like(user.lastName, `%${search}%`),
          like(user.email, `%${search}%`),
          like(user.phone || "", `%${search}%`),
          like(cleanerProfile.bio || "", `%${search}%`),
        ),
      );
    }

    // Apply availability filter if provided
    if (availability === "AVAILABLE") {
      query = query.where(eq(cleanerProfile.isAvailable, true));
    } else if (availability === "UNAVAILABLE") {
      query = query.where(eq(cleanerProfile.isAvailable, false));
    }

    // Apply status filter if provided
    if (status === "ACTIVE") {
      query = query.where(eq(user.isActive, true));
    } else if (status === "PENDING") {
      query = query.where(eq(user.isActive, false));
    }

    // Clone the query for counting total
    const countQuery = db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(user)
      .leftJoin(cleanerProfile, eq(user.id, cleanerProfile.userId))
      .where(eq(user.role, "CLEANER"));

    // Apply the same filters to the count query
    if (search) {
      countQuery.where(
        or(
          like(user.firstName, `%${search}%`),
          like(user.lastName, `%${search}%`),
          like(user.email, `%${search}%`),
          like(user.phone || "", `%${search}%`),
          like(cleanerProfile.bio || "", `%${search}%`),
        ),
      );
    }

    if (availability === "AVAILABLE") {
      countQuery.where(eq(cleanerProfile.isAvailable, true));
    } else if (availability === "UNAVAILABLE") {
      countQuery.where(eq(cleanerProfile.isAvailable, false));
    }

    if (status === "ACTIVE") {
      countQuery.where(eq(user.isActive, true));
    } else if (status === "PENDING") {
      countQuery.where(eq(user.isActive, false));
    }

    // Execute initial queries
    let cleaners = await query
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);
    const countResult = await countQuery;

    // Apply training filter if provided (filter in-memory since it's an array field)
    if (training) {
      if (training === "NONE") {
        // Filter for cleaners with no training completed
        cleaners = cleaners.filter((c) => {
          const trainingArr = c.cleanerProfile?.trainingCompleted || [];
          return trainingArr.length === 0;
        });
      } else {
        // Filter for cleaners with specific training (HOME or OFFICE)
        cleaners = cleaners.filter((c) => {
          const trainingArr = c.cleanerProfile?.trainingCompleted || [];
          return trainingArr.includes(training);
        });
      }
    }

    // Get total count
    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      cleaners,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      filters: {
        search,
        availability,
        training,
        status,
      },
    };
  } catch (error) {
    console.error("Error loading cleaners:", error);
    return {
      cleaners: [],
      pagination: {
        page: 1,
        limit,
        total: 0,
        totalPages: 0,
      },
      filters: {
        search,
        availability,
        training,
        status,
      },
    };
  }
};
