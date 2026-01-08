// scripts/db/seed-pricing.ts
// Seeds the pricing configuration and addons for the room-based pricing model
import crypto from "crypto";
import { eq } from "drizzle-orm";
import {
  createDbConnection,
  closeConnection,
  confirmAction,
  logDbInfo,
} from "./utils";

import * as schema from "../../src/lib/server/db/schema";

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  overwrite: args.includes("--overwrite") || args.includes("-o"),
  confirm: args.includes("--confirm") || args.includes("-y"),
  help: args.includes("--help") || args.includes("-h"),
};

if (options.help) {
  console.log(`
BrightBroom Pricing & Addons Seeder
===================================

Usage: npx tsx scripts/db/seed-pricing.ts [options]

Options:
  --overwrite, -o   Overwrite existing pricing config and addons
  --confirm, -y     Skip confirmation prompts
  --help, -h        Show this help text

This script seeds:
  - Default pricing configuration (base, bedroom, bathroom prices)
  - Default addons (Laundry & Ironing, Inside Fridge, etc.)
  `);
  process.exit(0);
}

// Default addons from the CSV file
const DEFAULT_ADDONS = [
  {
    name: "Laundry & Ironing",
    description:
      "Use of household laundry machine. Collection of clothes allowed to go into the laundry machine. Relevant washing option selected. Ironing all washed and dried clothes.",
    price: "100.00",
    durationMinutes: 90, // 1.5 hours
    sortOrder: 1,
  },
  {
    name: "Inside Fridge",
    description:
      "Unpacking, washing/wiping, drying and repacking inside fridge.",
    price: "35.00",
    durationMinutes: 30, // 0.5 hours
    sortOrder: 2,
  },
  {
    name: "Inside Oven",
    description: "Washing and drying inside oven and microwave.",
    price: "35.00",
    durationMinutes: 30, // 0.5 hours
    sortOrder: 3,
  },
  {
    name: "Inside Cabinets",
    description:
      "Unpacking, washing/wiping, drying and repacking inside kitchen cabinets.",
    price: "70.00",
    durationMinutes: 60, // 1 hour
    sortOrder: 4,
  },
  {
    name: "Interior Walls",
    description:
      "Removal of visible spots/spatter/smudges. Wiping and drying of section of interior walls.",
    price: "70.00",
    durationMinutes: 60, // 1 hour
    sortOrder: 5,
  },
  {
    name: "Interior Windows",
    description:
      "Removal of visible smudges/dirt. Wiping and drying of interior windows.",
    price: "70.00",
    durationMinutes: 60, // 1 hour
    sortOrder: 6,
  },
];

async function seedPricing() {
  const { isProduction } = logDbInfo();

  if (isProduction && !options.confirm) {
    const proceed = await confirmAction(
      "You are about to seed pricing data in what appears to be a production database. Continue?"
    );
    if (!proceed) {
      console.log("Operation cancelled");
      process.exit(0);
    }
  }

  const { client, db } = createDbConnection();

  try {
    console.log("Starting pricing and addons seeding...\n");

    // 1. Seed Pricing Config
    console.log("=== Pricing Configuration ===");

    const existingConfig = await db
      .select()
      .from(schema.pricingConfig)
      .where(eq(schema.pricingConfig.id, "default"));

    if (existingConfig.length > 0 && !options.overwrite) {
      console.log("Pricing config already exists. Use --overwrite to replace.");
      console.log(`  Base Price: R${existingConfig[0].basePrice}`);
      console.log(`  Bedroom Price: R${existingConfig[0].bedroomPrice}`);
      console.log(`  Bathroom Price: R${existingConfig[0].bathroomPrice}`);
    } else {
      if (existingConfig.length > 0) {
        console.log("Deleting existing pricing config...");
        await db
          .delete(schema.pricingConfig)
          .where(eq(schema.pricingConfig.id, "default"));
      }

      console.log("Inserting default pricing configuration...");
      await db.insert(schema.pricingConfig).values({
        id: "default",
        // Base price (Living Room + Kitchen)
        basePrice: "130.00",
        baseDurationMinutes: 120, // 2 hours
        baseDescription: "Living Room and Kitchen cleaning included",
        // Bedroom pricing
        bedroomPrice: "50.00",
        bedroomDurationMinutes: 60, // 1 hour
        bedroomMin: 1,
        bedroomMax: 10,
        // Bathroom pricing
        bathroomPrice: "50.00",
        bathroomDurationMinutes: 60, // 1 hour
        bathroomMin: 1,
        bathroomMax: 6,
      });

      console.log("Pricing configuration seeded:");
      console.log("  Base (Living Room + Kitchen): R130.00 (2 hours)");
      console.log("  Per Bedroom: R50.00 (1 hour)");
      console.log("  Per Bathroom: R50.00 (1 hour)");
      console.log("  Bedroom range: 1-10");
      console.log("  Bathroom range: 1-6");
    }

    // 2. Seed Addons
    console.log("\n=== Addons ===");

    const existingAddons = await db.select().from(schema.addon);

    if (existingAddons.length > 0 && !options.overwrite) {
      console.log(
        `Found ${existingAddons.length} existing addons. Use --overwrite to replace.`
      );
      existingAddons.forEach((a) => {
        console.log(`  - ${a.name}: R${a.price} (${a.durationMinutes} min)`);
      });
    } else {
      if (existingAddons.length > 0) {
        console.log(`Deleting ${existingAddons.length} existing addons...`);

        // Check for booking_addon references first
        const bookingAddons = await db.select().from(schema.bookingAddon);
        if (bookingAddons.length > 0) {
          console.log(
            `  Warning: ${bookingAddons.length} booking addons will be orphaned`
          );
          await db.delete(schema.bookingAddon);
        }

        await db.delete(schema.addon);
      }

      console.log("Inserting default addons...");

      const addonsToInsert = DEFAULT_ADDONS.map((addon) => ({
        id: crypto.randomUUID(),
        name: addon.name,
        description: addon.description,
        price: addon.price,
        durationMinutes: addon.durationMinutes,
        isActive: true,
        sortOrder: addon.sortOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await db.insert(schema.addon).values(addonsToInsert);

      console.log(`Inserted ${addonsToInsert.length} addons:`);
      addonsToInsert.forEach((a) => {
        const hours = a.durationMinutes / 60;
        console.log(
          `  - ${a.name}: R${a.price} (${hours}${hours === 1 ? " hour" : " hours"})`
        );
      });
    }

    // 3. Create a placeholder "General Clean" service for backward compatibility
    console.log("\n=== General Clean Service ===");

    const existingGeneralClean = await db
      .select()
      .from(schema.service)
      .where(eq(schema.service.id, "general-clean"));

    if (existingGeneralClean.length > 0) {
      console.log("General Clean service already exists.");
    } else {
      console.log("Creating General Clean service for new bookings...");
      await db.insert(schema.service).values({
        id: "general-clean",
        name: "General Clean",
        description:
          "Customizable room-based cleaning. Includes Living Room and Kitchen with every clean. Add bedrooms, bathrooms, and optional addons.",
        basePrice: "130.00", // Base price only (customers select rooms)
        durationHours: 2, // Base duration only
        isActive: true,
        sortOrder: 0, // First in list
        details: JSON.stringify({
          type: "room-based",
          standardIncludes: ["Living Room", "Kitchen"],
          description:
            "Build your perfect clean by selecting bedrooms, bathrooms, and optional addons.",
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("General Clean service created.");
    }

    console.log("\n=== Summary ===");
    console.log("Pricing and addons seeding completed successfully!");
    console.log("\nExample pricing calculations:");
    console.log("  1 bed, 1 bath: R130 + R50 + R50 = R230 (4 hours)");
    console.log("  2 bed, 1 bath: R130 + R100 + R50 = R280 (5 hours)");
    console.log("  3 bed, 2 bath: R130 + R150 + R100 = R380 (7 hours)");
    console.log("  + Laundry & Ironing: +R100 (+1.5 hours)");
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  } finally {
    await closeConnection(client);
  }
}

seedPricing().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
