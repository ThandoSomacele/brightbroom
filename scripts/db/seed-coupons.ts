// scripts/db/seed-coupons.ts
// Seeds default coupon codes for the booking system
import crypto from "crypto";
import { eq } from "drizzle-orm";
import {
  createDbConnection,
  closeConnection,
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
BrightBroom Coupons Seeder
==========================

Usage: npx tsx scripts/db/seed-coupons.ts [options]

Options:
  --overwrite, -o   Overwrite existing coupons with same code
  --confirm, -y     Skip confirmation prompts
  --help, -h        Show this help text

This script seeds:
  - FIRST50: 15% off first booking (min R350)
  - BIGCLEAN: R75 off bookings over R500
  `);
  process.exit(0);
}

// Default coupons as specified in the plan
const DEFAULT_COUPONS = [
  {
    code: "FIRST50",
    name: "First Booking Discount",
    description: "Welcome discount for first-time customers. Get 15% off your first booking!",
    discountType: "PERCENTAGE" as const,
    discountValue: "15.00", // 15%
    minimumBookingAmount: "350.00", // R350 minimum
    requiresFirstBooking: true,
    maxUsesTotal: null, // Unlimited (but single-use per customer)
    validFrom: new Date(),
    validUntil: null, // No expiry
    isActive: true,
  },
  {
    code: "BIGCLEAN",
    name: "High-Value Booking Discount",
    description: "Save R75 on larger cleaning jobs. Applicable to bookings of R500 or more.",
    discountType: "FIXED_AMOUNT" as const,
    discountValue: "75.00", // R75 off
    minimumBookingAmount: "500.00", // R500 minimum
    requiresFirstBooking: false,
    maxUsesTotal: null, // Unlimited (but single-use per customer)
    validFrom: new Date(),
    validUntil: null, // No expiry
    isActive: true,
  },
];

async function seedCoupons() {
  const { isProduction } = logDbInfo();

  if (isProduction) {
    console.error(
      "\x1b[31m%s\x1b[0m",
      "Warning: You are seeding coupon data in production!"
    );
    if (!options.confirm) {
      console.log("Use --confirm or -y to proceed with production seeding.");
      process.exit(1);
    }
  }

  const { client, db } = createDbConnection();

  try {
    console.log("Starting coupon seeding...\n");

    // Check existing coupons
    const existingCoupons = await db.select().from(schema.coupon);
    console.log(`Found ${existingCoupons.length} existing coupons.`);

    let insertedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    for (const couponData of DEFAULT_COUPONS) {
      const existingCoupon = existingCoupons.find(
        (c) => c.code === couponData.code
      );

      if (existingCoupon && !options.overwrite) {
        console.log(`  Skipping existing coupon: ${couponData.code}`);
        skippedCount++;
        continue;
      }

      if (existingCoupon && options.overwrite) {
        console.log(`  Updating existing coupon: ${couponData.code}`);
        await db
          .update(schema.coupon)
          .set({
            name: couponData.name,
            description: couponData.description,
            discountType: couponData.discountType,
            discountValue: couponData.discountValue,
            minimumBookingAmount: couponData.minimumBookingAmount,
            requiresFirstBooking: couponData.requiresFirstBooking,
            maxUsesTotal: couponData.maxUsesTotal,
            validFrom: couponData.validFrom,
            validUntil: couponData.validUntil,
            isActive: couponData.isActive,
            updatedAt: new Date(),
          })
          .where(eq(schema.coupon.id, existingCoupon.id));
        updatedCount++;
        continue;
      }

      // Insert new coupon
      console.log(`  Inserting new coupon: ${couponData.code}`);
      await db.insert(schema.coupon).values({
        id: crypto.randomUUID(),
        code: couponData.code,
        name: couponData.name,
        description: couponData.description,
        discountType: couponData.discountType,
        discountValue: couponData.discountValue,
        minimumBookingAmount: couponData.minimumBookingAmount,
        requiresFirstBooking: couponData.requiresFirstBooking,
        maxUsesTotal: couponData.maxUsesTotal,
        usedCount: 0,
        validFrom: couponData.validFrom,
        validUntil: couponData.validUntil,
        isActive: couponData.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      insertedCount++;
    }

    console.log("\n=== Summary ===");
    console.log(`Inserted: ${insertedCount} coupons`);
    console.log(`Updated: ${updatedCount} coupons`);
    console.log(`Skipped: ${skippedCount} coupons`);
    console.log("\nSeeded coupons:");

    // Display seeded coupons info
    const allCoupons = await db.select().from(schema.coupon);
    for (const coupon of allCoupons) {
      const discountDisplay =
        coupon.discountType === "PERCENTAGE"
          ? `${parseFloat(coupon.discountValue as unknown as string)}% off`
          : `R${parseFloat(coupon.discountValue as unknown as string).toFixed(2)} off`;

      const restrictions = [];
      if (coupon.requiresFirstBooking) restrictions.push("First booking only");
      if (coupon.maxUsesTotal) restrictions.push(`Max ${coupon.maxUsesTotal} uses`);

      console.log(`  - ${coupon.code}: ${discountDisplay} (min R${parseFloat(coupon.minimumBookingAmount as unknown as string).toFixed(2)})`);
      console.log(`    ${coupon.name}`);
      if (restrictions.length > 0) {
        console.log(`    Restrictions: ${restrictions.join(", ")}`);
      }
      console.log(`    Status: ${coupon.isActive ? "Active" : "Inactive"}`);
      console.log();
    }

    console.log("Coupon seeding completed successfully!");
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  } finally {
    await closeConnection(client);
  }
}

seedCoupons().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
