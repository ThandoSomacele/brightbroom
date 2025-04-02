// src/routes/api/services/+server.ts
import { db } from "$lib/server/db";
import { service } from "$lib/server/db/schema";
import { parseServiceDetails } from "$lib/services";
import { json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
  try {
    // Get filter parameters
    const category = url.searchParams.get("category");
    const active = url.searchParams.get("active");

    // Build query
    let query = db.select().from(service);

    // Apply filters
    if (category) {
      // Filter by category as before
    }

    if (active === "true") {
      query = query.where(eq(service.isActive, true));
    }

    // Change this line to order by sortOrder first, then name
    const services = await query
      .orderBy(service.sortOrder, { direction: "asc" }) // Primary sort
      .orderBy(service.name); // Secondary sort for equal sortOrder values

    // Process services to add parsed details and type information
    const processedServices = services.map((s) => {
      // Parse the details JSON if available
      const details = s.details ? parseServiceDetails(s.details) : null;

      // Determine the service type and icon type based on the name
      const type = s.name.toLowerCase().includes("extended")
        ? "extended"
        : "regular";

      let iconType = "home";
      if (s.name.includes("Office")) {
        iconType = "office";
      } else if (s.name.includes("Laundry")) {
        iconType = "laundry";
      } else if (type === "extended") {
        iconType = "deep";
      }

      // Determine category
      const category = s.name.includes("Office") ? "commercial" : "residential";

      return {
        ...s,
        details,
        type,
        iconType,
        category,
      };
    });

    return json({ services: processedServices });
  } catch (error) {
    console.error("Error fetching services:", error);
    return json({ error: "Failed to fetch services" }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  // Check if user is admin
  if (!locals.user || locals.user.role !== "ADMIN") {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Process details if provided
    let details = null;
    if (data.details) {
      details =
        typeof data.details === "string"
          ? data.details
          : JSON.stringify(data.details);
    }

    // Create service
    const [newService] = await db
      .insert(service)
      .values({
        id: crypto.randomUUID(),
        name: data.name,
        description: data.description,
        basePrice: data.basePrice,
        durationHours: data.durationHours,
        details,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return json({ service: newService }, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return json({ error: "Failed to create service" }, { status: 500 });
  }
};
