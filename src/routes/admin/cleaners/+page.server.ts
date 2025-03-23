// src/routes/admin/cleaners/+page.server.ts
import { db } from "$lib/server/db";
import { 
  user, 
  cleanerProfile, 
  cleanerSpecialization, 
  service 
} from "$lib/server/db/schema";
import { desc, eq, like, or, and, sql, inArray } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
  // Get query parameters for filtering and pagination
  const search = url.searchParams.get("search") || "";
  const availability = url.searchParams.get("availability") || "";
  const specialization = url.searchParams.get("specialization") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 10; // Number of items per page
  const offset = (page - 1) * limit;

  try {
    // Get all services for the specialization filter dropdown
    const services = await db.select({
      id: service.id,
      name: service.name,
    }).from(service);

    // Build the query with filters
    let query = db
      .select({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
        cleanerProfile: {
          id: cleanerProfile.id,
          rating: cleanerProfile.rating,
          isAvailable: cleanerProfile.isAvailable,
          workRadius: cleanerProfile.workRadius,
          bio: cleanerProfile.bio,
          petCompatibility: cleanerProfile.petCompatibility,
        },
        // We'll fetch specializations separately
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
          like(cleanerProfile.bio || "", `%${search}%`)
        )
      );
    }

    // Apply availability filter if provided
    if (availability === "AVAILABLE") {
      query = query.where(eq(cleanerProfile.isAvailable, true));
    } else if (availability === "UNAVAILABLE") {
      query = query.where(eq(cleanerProfile.isAvailable, false));
    }

    // Apply specialization filter if provided
    // Note: For specialization filtering, we'll need to adjust our approach after the initial query

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
          like(cleanerProfile.bio || "", `%${search}%`)
        )
      );
    }

    if (availability === "AVAILABLE") {
      countQuery.where(eq(cleanerProfile.isAvailable, true));
    } else if (availability === "UNAVAILABLE") {
      countQuery.where(eq(cleanerProfile.isAvailable, false));
    }

    // Execute initial queries
    let cleaners = await query.orderBy(desc(user.createdAt)).limit(limit).offset(offset);
    const countResult = await countQuery;

    // Fetch specialization data for each cleaner
    const cleanerIds = cleaners.map((c) => c.id);
    
    // If we have cleaners, fetch their specializations
    let specializationsMap = new Map();
    
    if (cleanerIds.length > 0) {
      const specializationsData = await db
        .select({
          cleanerProfileId: cleanerSpecialization.cleanerProfileId,
          serviceId: cleanerSpecialization.serviceId,
          serviceName: service.name,
        })
        .from(cleanerSpecialization)
        .innerJoin(service, eq(cleanerSpecialization.serviceId, service.id))
        .innerJoin(cleanerProfile, eq(cleanerSpecialization.cleanerProfileId, cleanerProfile.id))
        .where(inArray(cleanerProfile.userId, cleanerIds));
      
      // Group specializations by cleaner
      for (const spec of specializationsData) {
        const profileId = spec.cleanerProfileId;
        if (!specializationsMap.has(profileId)) {
          specializationsMap.set(profileId, []);
        }
        specializationsMap.get(profileId).push({
          id: spec.serviceId,
          name: spec.serviceName,
        });
      }
    }
    
    // If specialization filter is applied, we need to filter the results
    if (specialization) {
      // Fetch all cleaners with this specialization
      const cleanersWithSpecialization = await db
        .select({
          userId: cleanerProfile.userId,
        })
        .from(cleanerSpecialization)
        .innerJoin(cleanerProfile, eq(cleanerSpecialization.cleanerProfileId, cleanerProfile.id))
        .where(eq(cleanerSpecialization.serviceId, specialization));
      
      const validCleanerIds = new Set(cleanersWithSpecialization.map(c => c.userId));
      
      // Filter the cleaner list
      cleaners = cleaners.filter(c => validCleanerIds.has(c.id));
    }
    
    // Add specializations to each cleaner
    const cleanersWithSpecializations = cleaners.map(cleaner => {
      // Find cleaner's profile ID
      const profileId = cleaner.cleanerProfile?.id;
      const specs = profileId ? specializationsMap.get(profileId) || [] : [];
      
      return {
        ...cleaner,
        specializations: specs
      };
    });

    // Get total count
    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      cleaners: cleanersWithSpecializations,
      specializations: services, // For the filter dropdown
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      filters: {
        search,
        availability,
        specialization,
      },
    };
  } catch (error) {
    console.error("Error loading cleaners:", error);
    return {
      cleaners: [],
      specializations: [],
      pagination: {
        page: 1,
        limit,
        total: 0,
        totalPages: 0,
      },
      filters: {
        search,
        availability,
        specialization,
      },
    };
  }
};
