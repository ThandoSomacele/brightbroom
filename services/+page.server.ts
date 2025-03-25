// src/routes/admin/services/+page.server.ts
import { db } from "$lib/server/db";
import { service } from "$lib/server/db/schema";
import { error, fail } from "@sveltejs/kit";
import { desc, eq } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";

/**
 * Server load function that fetches all available services
 * This function runs on the server when the page is requested
 */
export const load: PageServerLoad = async ({ locals }) => {
  // Check if user is authenticated and is an admin
  if (!locals.user || locals.user.role !== "ADMIN") {
    throw error(403, "Unauthorized");
  }

  try {
    // Fetch all services from the database, ordered by creation date
    const services = await db
      .select()
      .from(service)
      .orderBy(desc(service.createdAt));

    return {
      services,
    };
  } catch (err) {
    console.error("Error loading services:", err);
    throw error(500, "Failed to load services");
  }
};

/**
 * Form actions to handle service creation, updates, and deletion
 */
export const actions: Actions = {
  // Create a new service
  create: async ({ request, locals }) => {
    // Check if user is authenticated and is an admin
    if (!locals.user || locals.user.role !== "ADMIN") {
      return fail(403, { error: "Unauthorized" });
    }

    const formData = await request.formData();
    const name = formData.get("name")?.toString();
    const description = formData.get("description")?.toString();
    const basePrice = formData.get("basePrice")?.toString();
    const durationHours = formData.get("durationHours")?.toString();

    // Validate the form data
    if (!name || !description || !basePrice || !durationHours) {
      return fail(400, {
        error: "All fields are required",
        data: { name, description, basePrice, durationHours },
      });
    }

    try {
      // Parse numeric values
      const parsedBasePrice = parseFloat(basePrice);
      const parsedDurationHours = parseInt(durationHours);

      if (isNaN(parsedBasePrice) || isNaN(parsedDurationHours)) {
        return fail(400, {
          error: "Price and duration must be valid numbers",
          data: { name, description, basePrice, durationHours },
        });
      }

      // Create a new service record
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
    // Check if user is authenticated and is an admin
    if (!locals.user || locals.user.role !== "ADMIN") {
      return fail(403, { error: "Unauthorized" });
    }

    const formData = await request.formData();
    const id = formData.get("id")?.toString();
    const name = formData.get("name")?.toString();
    const description = formData.get("description")?.toString();
    const basePrice = formData.get("basePrice")?.toString();
    const durationHours = formData.get("durationHours")?.toString();

    // Validate the form data
    if (!id || !name || !description || !basePrice || !durationHours) {
      return fail(400, {
        error: "All fields are required",
        data: { id, name, description, basePrice, durationHours },
      });
    }

    try {
      // Parse numeric values
      const parsedBasePrice = parseFloat(basePrice);
      const parsedDurationHours = parseInt(durationHours);

      if (isNaN(parsedBasePrice) || isNaN(parsedDurationHours)) {
        return fail(400, {
          error: "Price and duration must be valid numbers",
          data: { id, name, description, basePrice, durationHours },
        });
      }

      // Update the service record
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
    // Check if user is authenticated and is an admin
    if (!locals.user || locals.user.role !== "ADMIN") {
      return fail(403, { error: "Unauthorized" });
    }

    const formData = await request.formData();
    const id = formData.get("id")?.toString();

    if (!id) {
      return fail(400, { error: "Service ID is required" });
    }

    try {
      // Delete the service record
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
