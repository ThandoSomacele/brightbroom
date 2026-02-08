// src/routes/admin/cleaners/+page.server.ts
import { db } from "$lib/server/db";
import {
  cleanerProfile,
  user,
} from "$lib/server/db/schema";
import { redirect } from "@sveltejs/kit";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

// Helper function to fetch cleaners with filters
async function getCleaners(
  search: string,
  availability: string,
  training: string,
  status: string,
  page: number,
  limit: number,
  tenantId: string | null
) {
  const offset = (page - 1) * limit;

  try {
    // Build conditions array
    const conditions: SQL[] = [eq(user.role, "CLEANER")];
    const countConditions: SQL[] = [eq(user.role, "CLEANER")];

    // Tenant scoping - filter by cleanerProfile.tenantId
    if (tenantId) {
      conditions.push(eq(cleanerProfile.tenantId, tenantId));
      countConditions.push(eq(cleanerProfile.tenantId, tenantId));
    }

    // Search filter
    if (search) {
      const searchCondition = or(
        like(user.firstName, `%${search}%`),
        like(user.lastName, `%${search}%`),
        like(user.email, `%${search}%`),
        like(user.phone || "", `%${search}%`),
        like(cleanerProfile.bio || "", `%${search}%`),
      )!;
      conditions.push(searchCondition);
      countConditions.push(searchCondition);
    }

    // Availability filter
    if (availability === "AVAILABLE") {
      conditions.push(eq(cleanerProfile.isAvailable, true));
      countConditions.push(eq(cleanerProfile.isAvailable, true));
    } else if (availability === "UNAVAILABLE") {
      conditions.push(eq(cleanerProfile.isAvailable, false));
      countConditions.push(eq(cleanerProfile.isAvailable, false));
    }

    // Status filter
    if (status === "ACTIVE") {
      conditions.push(eq(user.isActive, true));
      countConditions.push(eq(user.isActive, true));
    } else if (status === "PENDING") {
      conditions.push(eq(user.isActive, false));
      countConditions.push(eq(user.isActive, false));
    }

    // Build query
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
      .where(and(...conditions));

    // Count query
    const countQuery = db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(user)
      .leftJoin(cleanerProfile, eq(user.id, cleanerProfile.userId))
      .where(and(...countConditions));

    // Execute queries
    let cleaners = await query
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);
    const countResult = await countQuery;

    // Apply training filter in-memory (array field)
    if (training) {
      if (training === "NONE") {
        cleaners = cleaners.filter((c) => {
          const trainingArr = c.cleanerProfile?.trainingCompleted || [];
          return trainingArr.length === 0;
        });
      } else {
        cleaners = cleaners.filter((c) => {
          const trainingArr = c.cleanerProfile?.trainingCompleted || [];
          return trainingArr.includes(training);
        });
      }
    }

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
    };
  }
}

export const load: PageServerLoad = async ({ url, locals }) => {
  if (!locals.user || (locals.user.role !== "ADMIN" && locals.user.role !== "TENANT_ADMIN")) {
    throw redirect(302, "/auth/login?redirectTo=/admin/cleaners");
  }

  const search = url.searchParams.get("search") || "";
  const availability = url.searchParams.get("availability") || "";
  const training = url.searchParams.get("training") || "";
  const status = url.searchParams.get("status") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 10;

  // Tenant scoping
  const tenantId = locals.user.role === 'TENANT_ADMIN' ? locals.tenant?.id || null : null;

  return {
    filters: {
      search,
      availability,
      training,
      status,
    },
    currentPage: page,
    streamed: {
      cleanersData: getCleaners(search, availability, training, status, page, limit, tenantId),
    },
  };
};
