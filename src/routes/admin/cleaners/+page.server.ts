// src/routes/admin/cleaners/+page.server.ts
import { db } from "$lib/server/db";
import {
  cleanerProfile,
  cleanerSpecialisation,
  service,
  user,
} from "$lib/server/db/schema";
import { error, redirect } from "@sveltejs/kit";
import { and, desc, eq, ilike, inArray, like, or, sql } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url, locals }) => {
  // Verify admin role
  if (!locals.user || locals.user.role !== "ADMIN") {
    throw redirect(302, "/auth/login?redirectTo=/admin/cleaners");
  }

  // Get query parameters for filtering and pagination
  const search = url.searchParams.get("search") || "";
  const availability = url.searchParams.get("availability") || "";
  const specialisation = url.searchParams.get("specialisation") || "";
  const status = url.searchParams.get("status") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 10; // Number of items per page
  const offset = (page - 1) * limit;

  try {
    // Get all services for the specialisation filter dropdown
    const services = await db
      .select({
        id: service.id,
        name: service.name,
      })
      .from(service);

    // Build the query with filters
    let query = db
      .select({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
        isActive: user.isActive, // Ensure we select the isActive field
        cleanerProfile: {
          id: cleanerProfile.id,
          rating: cleanerProfile.rating,
          isAvailable: cleanerProfile.isAvailable,
          workRadius: cleanerProfile.workRadius,
          bio: cleanerProfile.bio,
          petCompatibility: cleanerProfile.petCompatibility,
        },
        // We'll fetch specialisations separately
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

    // Apply specialisation filter if provided
    // Note: For specialisation filtering, we'll need to adjust our approach after the initial query

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

    // Fetch specialisation data for each cleaner
    const cleanerIds = cleaners.map((c) => c.id);

    // If we have cleaners, fetch their specialisations
    let specialisationsMap = new Map();

    if (cleanerIds.length > 0) {
      const specialisationsData = await db
        .select({
          cleanerProfileId: cleanerSpecialisation.cleanerProfileId,
          serviceId: cleanerSpecialisation.serviceId,
          serviceName: service.name,
        })
        .from(cleanerSpecialisation)
        .innerJoin(service, eq(cleanerSpecialisation.serviceId, service.id))
        .innerJoin(
          cleanerProfile,
          eq(cleanerSpecialisation.cleanerProfileId, cleanerProfile.id),
        )
        .where(inArray(cleanerProfile.userId, cleanerIds));

      // Group specialisations by cleaner
      for (const spec of specialisationsData) {
        const profileId = spec.cleanerProfileId;
        if (!specialisationsMap.has(profileId)) {
          specialisationsMap.set(profileId, []);
        }
        specialisationsMap.get(profileId).push({
          id: spec.serviceId,
          name: spec.serviceName,
        });
      }
    }

    // If specialisation filter is applied, we need to filter the results
    if (specialisation) {
      // Fetch all cleaners with this specialisation
      const cleanersWithSpecialisation = await db
        .select({
          userId: cleanerProfile.userId,
        })
        .from(cleanerSpecialisation)
        .innerJoin(
          cleanerProfile,
          eq(cleanerSpecialisation.cleanerProfileId, cleanerProfile.id),
        )
        .where(eq(cleanerSpecialisation.serviceId, specialisation));

      const validCleanerIds = new Set(
        cleanersWithSpecialisation.map((c) => c.userId),
      );

      // Filter the cleaner list
      cleaners = cleaners.filter((c) => validCleanerIds.has(c.id));
    }

    // Add specialisations to each cleaner
    const cleanersWithSpecialisations = cleaners.map((cleaner) => {
      // Find cleaner's profile ID
      const profileId = cleaner.cleanerProfile?.id;
      const specs = profileId ? specialisationsMap.get(profileId) || [] : [];

      return {
        ...cleaner,
        specialisations: specs,
      };
    });

    // Get total count
    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      cleaners: cleanersWithSpecialisations,
      specialisations: services, // For the filter dropdown
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      filters: {
        search,
        availability,
        specialisation,
        status, // Include the status filter in returned data
      },
    };
  } catch (error) {
    console.error("Error loading cleaners:", error);
    return {
      cleaners: [],
      specialisations: [],
      pagination: {
        page: 1,
        limit,
        total: 0,
        totalPages: 0,
      },
      filters: {
        search,
        availability,
        specialisation,
        status,
      },
    };
  }
};
