// src/routes/admin/services/+page.server.ts
import { db } from "$lib/server/db";
import { service } from "$lib/server/db/schema";
import { error, fail } from "@sveltejs/kit";
import { desc, eq } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";

// Helper function to fetch services
async function getServices() {
  try {
    const services = await db
      .select()
      .from(service)
      .orderBy(desc(service.createdAt));
    return services;
  } catch (err) {
    console.error("Error loading services:", err);
    return [];
  }
}

export const load: PageServerLoad = async ({ locals }) => {
  // Check if user is authenticated and is an admin
  if (!locals.user || locals.user.role !== "ADMIN") {
    throw error(403, "Unauthorized");
  }

  // Return streamed data
  return {
    streamed: {
      services: getServices(),
    },
  };
};

export const actions: Actions = {
  // Create a new service
  create: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== "ADMIN") {
      return fail(403, { error: "Unauthorized" });
    }

    const formData = await request.formData();
    const name = formData.get("name")?.toString();
    const description = formData.get("description")?.toString();
    const basePrice = formData.get("basePrice")?.toString();
    const durationHours = formData.get("durationHours")?.toString();

    if (!name || !description || !basePrice || !durationHours) {
      return fail(400, {
        error: "All fields are required",
        data: { name, description, basePrice, durationHours },
      });
    }

    try {
      const parsedBasePrice = parseFloat(basePrice);
      const parsedDurationHours = parseInt(durationHours);

      if (isNaN(parsedBasePrice) || isNaN(parsedDurationHours)) {
        return fail(400, {
          error: "Price and duration must be valid numbers",
          data: { name, description, basePrice, durationHours },
        });
      }

      await db.insert(service).values({
        id: crypto.randomUUID(),
        name,
        description,
        basePrice: parsedBasePrice,
        durationHours: parsedDurationHours,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        success: true,
        message: "Service created successfully",
      };
    } catch (err) {
      console.error("Error creating service:", err);
      return fail(500, {
        error: "Failed to create service",
        data: { name, description, basePrice, durationHours },
      });
    }
  },

  // Update an existing service
  update: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== "ADMIN") {
      return fail(403, { error: "Unauthorized" });
    }

    const formData = await request.formData();
    const id = formData.get("id")?.toString();
    const name = formData.get("name")?.toString();
    const description = formData.get("description")?.toString();
    const basePrice = formData.get("basePrice")?.toString();
    const durationHours = formData.get("durationHours")?.toString();

    if (!id || !name || !description || !basePrice || !durationHours) {
      return fail(400, {
        error: "All fields are required",
        data: { id, name, description, basePrice, durationHours },
      });
    }

    try {
      const parsedBasePrice = parseFloat(basePrice);
      const parsedDurationHours = parseInt(durationHours);

      if (isNaN(parsedBasePrice) || isNaN(parsedDurationHours)) {
        return fail(400, {
          error: "Price and duration must be valid numbers",
          data: { id, name, description, basePrice, durationHours },
        });
      }

      await db
        .update(service)
        .set({
          name,
          description,
          basePrice: parsedBasePrice,
          durationHours: parsedDurationHours,
          updatedAt: new Date(),
        })
        .where(eq(service.id, id));

      return {
        success: true,
        message: "Service updated successfully",
      };
    } catch (err) {
      console.error("Error updating service:", err);
      return fail(500, {
        error: "Failed to update service",
        data: { id, name, description, basePrice, durationHours },
      });
    }
  },

  // Delete a service
  delete: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== "ADMIN") {
      return fail(403, { error: "Unauthorized" });
    }

    const formData = await request.formData();
    const id = formData.get("id")?.toString();

    if (!id) {
      return fail(400, { error: "Service ID is required" });
    }

    try {
      await db.delete(service).where(eq(service.id, id));

      return {
        success: true,
        message: "Service deleted successfully",
      };
    } catch (err) {
      console.error("Error deleting service:", err);
      return fail(500, {
        error: "Failed to delete service",
      });
    }
  },
};
