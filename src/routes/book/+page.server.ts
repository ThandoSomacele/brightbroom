// src/routes/book/+page.server.ts
import { db } from "$lib/server/db";
import { pricingConfig, addon } from "$lib/server/db/schema";
import { eq, asc } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  // Allow both authenticated and guest users to access service selection
  // Authentication will be handled at payment step

  try {
    // Load pricing configuration
    const [config] = await db
      .select()
      .from(pricingConfig)
      .where(eq(pricingConfig.id, "default"));

    // Load active addons ordered by sortOrder
    const addons = await db
      .select()
      .from(addon)
      .where(eq(addon.isActive, true))
      .orderBy(asc(addon.sortOrder));

    // If no pricing config exists, use defaults
    const pricingData = config || {
      id: "default",
      basePrice: "130.00",
      baseDurationMinutes: 120,
      baseDescription: "Living Room and Kitchen cleaning included",
      bedroomPrice: "50.00",
      bedroomDurationMinutes: 60,
      bedroomMin: 1,
      bedroomMax: 10,
      bathroomPrice: "50.00",
      bathroomDurationMinutes: 60,
      bathroomMin: 1,
      bathroomMax: 6,
    };

    return {
      pricingConfig: pricingData,
      addons,
      user: locals.user,
      isAuthenticated: !!locals.user,
    };
  } catch (err) {
    console.error("Error loading pricing config:", err);
    // Return defaults on error
    return {
      pricingConfig: {
        id: "default",
        basePrice: "130.00",
        baseDurationMinutes: 120,
        baseDescription: "Living Room and Kitchen cleaning included",
        bedroomPrice: "50.00",
        bedroomDurationMinutes: 60,
        bedroomMin: 1,
        bedroomMax: 10,
        bathroomPrice: "50.00",
        bathroomDurationMinutes: 60,
        bathroomMin: 1,
        bathroomMax: 6,
      },
      addons: [],
      user: locals.user,
      isAuthenticated: !!locals.user,
    };
  }
};
