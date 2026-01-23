// src/routes/admin/applications/+page.server.ts
import { db } from "$lib/server/db";
import { cleanerApplication, user } from "$lib/server/db/schema";
import { error, fail, redirect } from "@sveltejs/kit";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";

// Helper function to fetch applications with filters
async function getApplications(
  search: string,
  status: string,
  page: number,
  limit: number
) {
  const offset = (page - 1) * limit;

  try {
    // Build the query with filters
    let query = db.select().from(cleanerApplication);

    // Apply search filter if provided
    if (search) {
      query = query.where(
        or(
          ilike(cleanerApplication.firstName, `%${search}%`),
          ilike(cleanerApplication.lastName, `%${search}%`),
          ilike(cleanerApplication.email, `%${search}%`),
          ilike(cleanerApplication.phone || "", `%${search}%`),
          ilike(cleanerApplication.city, `%${search}%`),
        ),
      );
    }

    // Apply status filter if provided (except ALL)
    if (status && status !== "ALL") {
      query = query.where(eq(cleanerApplication.status, status as any));
    }

    // Clone the query for counting total
    const countQuery = db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(cleanerApplication);

    // Apply the same filters to the count query
    if (search) {
      countQuery.where(
        or(
          ilike(cleanerApplication.firstName, `%${search}%`),
          ilike(cleanerApplication.lastName, `%${search}%`),
          ilike(cleanerApplication.email, `%${search}%`),
          ilike(cleanerApplication.phone || "", `%${search}%`),
          ilike(cleanerApplication.city, `%${search}%`),
        ),
      );
    }

    if (status && status !== "ALL") {
      countQuery.where(eq(cleanerApplication.status, status as any));
    }

    // Execute queries
    const [applications, countResult] = await Promise.all([
      query
        .orderBy(desc(cleanerApplication.createdAt))
        .limit(limit)
        .offset(offset),
      countQuery,
    ]);

    const total = countResult[0]?.count || 0;

    return {
      applications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (err) {
    console.error("Error loading cleaner applications:", err);
    return {
      applications: [],
      pagination: {
        total: 0,
        page: 1,
        limit,
        totalPages: 0,
      },
    };
  }
}

export const load: PageServerLoad = async ({ url, locals }) => {
  // Verify admin role
  if (!locals.user || locals.user.role !== "ADMIN") {
    throw redirect(302, "/auth/login?redirectTo=/admin/applications");
  }

  // Get query parameters for filtering and pagination
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "PENDING";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 10;

  // Return filters immediately, stream the data
  return {
    filters: {
      search,
      status,
    },
    currentPage: page,
    // Stream the applications data
    streamed: {
      applicationsData: getApplications(search, status, page, limit),
    },
  };
};

export const actions: Actions = {
  // View application details
  viewApplication: async ({ request, url }) => {
    const formData = await request.formData();
    const id = formData.get("id")?.toString();

    if (!id) {
      return fail(400, { error: "Application ID is required" });
    }

    throw redirect(302, `/admin/applications/${id}`);
  },

  // Approve application
  approveApplication: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id")?.toString();

    if (!id) {
      return fail(400, { error: "Application ID is required" });
    }

    try {
      const [application] = await db
        .select()
        .from(cleanerApplication)
        .where(eq(cleanerApplication.id, id))
        .limit(1);

      if (!application) {
        return fail(404, { error: "Application not found" });
      }

      await db
        .update(cleanerApplication)
        .set({
          status: "APPROVED",
          updatedAt: new Date(),
        })
        .where(eq(cleanerApplication.id, id));

      const userId = crypto.randomUUID();
      await db.insert(user).values({
        id: userId,
        email: application.email,
        passwordHash: await hash("temporaryPassword123"),
        firstName: application.firstName,
        lastName: application.lastName,
        phone: application.phone,
        role: "CLEANER",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        success: true,
        message: "Application approved and cleaner account created",
      };
    } catch (err) {
      console.error("Error approving application:", err);
      return fail(500, { error: "Failed to approve application" });
    }
  },

  // Reject application
  rejectApplication: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id")?.toString();

    if (!id) {
      return fail(400, { error: "Application ID is required" });
    }

    try {
      await db
        .update(cleanerApplication)
        .set({
          status: "REJECTED",
          updatedAt: new Date(),
        })
        .where(eq(cleanerApplication.id, id));

      return {
        success: true,
        message: "Application rejected",
      };
    } catch (err) {
      console.error("Error rejecting application:", err);
      return fail(500, { error: "Failed to reject application" });
    }
  },
};

async function hash(password: string): Promise<string> {
  return `hashed_${password}`;
}
