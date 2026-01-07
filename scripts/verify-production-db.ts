// scripts/verify-production-db.ts
import { db } from "../src/lib/server/db/index.js";
import { address, booking, subscription } from "../src/lib/server/db/schema.js";
import { sql, eq } from "drizzle-orm";

async function verifyDatabase() {
  console.log("\n" + "=".repeat(80));
  console.log("PRODUCTION DATABASE INTEGRITY VERIFICATION");
  console.log("=".repeat(80) + "\n");

  try {
    // 1. Check for duplicate addresses
    console.log("1️⃣  Checking for duplicate addresses...");
    const duplicates = await db.execute(sql`
      SELECT user_id, LOWER(TRIM(street)) as street, LOWER(TRIM(city)) as city,
             LOWER(TRIM(state)) as state, LOWER(TRIM(zip_code)) as zip_code,
             COALESCE(LOWER(TRIM(apt_unit)), '') as apt_unit, COUNT(*) as count
      FROM address
      WHERE is_active = true
      GROUP BY user_id, LOWER(TRIM(street)), LOWER(TRIM(city)),
               LOWER(TRIM(state)), LOWER(TRIM(zip_code)), COALESCE(LOWER(TRIM(apt_unit)), '')
      HAVING COUNT(*) > 1
    `);

    const duplicateRows = Array.isArray(duplicates) ? duplicates : [];
    if (duplicateRows.length === 0) {
      console.log("   ✅ No duplicate addresses found\n");
    } else {
      console.log(`   ❌ Found ${duplicateRows.length} duplicate groups:\n`);
      console.log(duplicateRows);
      console.log();
    }

    // 2. Check unique constraint exists
    console.log("2️⃣  Verifying unique constraint...");
    const constraints = await db.execute(sql`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'address'
        AND constraint_name = 'unique_user_address'
    `);

    const constraintRows = Array.isArray(constraints) ? constraints : [];
    if (constraintRows.length > 0) {
      console.log("   ✅ Unique constraint 'unique_user_address' is in place\n");
    } else {
      console.log("   ❌ Unique constraint 'unique_user_address' NOT found\n");
    }

    // 3. Check booking references
    console.log("3️⃣  Checking booking references...");
    const invalidBookings = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM booking
      WHERE address_id IS NOT NULL
        AND address_id NOT IN (SELECT id FROM address WHERE is_active = true)
    `);

    const bookingRows = Array.isArray(invalidBookings) ? invalidBookings : [];
    const invalidCount = Number(bookingRows[0]?.count || 0);
    if (invalidCount === 0) {
      console.log("   ✅ All booking references are valid\n");
    } else {
      console.log(`   ⚠️  Found ${invalidCount} bookings with invalid address references\n`);
    }

    // 4. Check subscription references
    console.log("4️⃣  Checking subscription references...");
    const invalidSubscriptions = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM subscription
      WHERE address_id IS NOT NULL
        AND address_id NOT IN (SELECT id FROM address WHERE is_active = true)
    `);

    const subscriptionRows = Array.isArray(invalidSubscriptions) ? invalidSubscriptions : [];
    const invalidSubCount = Number(subscriptionRows[0]?.count || 0);
    if (invalidSubCount === 0) {
      console.log("   ✅ All subscription references are valid\n");
    } else {
      console.log(`   ⚠️  Found ${invalidSubCount} subscriptions with invalid address references\n`);
    }

    // 5. Summary statistics
    console.log("5️⃣  Database statistics:");
    const [totalAddresses] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(address)
      .where(eq(address.isActive, true));

    const [totalBookings] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(booking);

    const [totalSubscriptions] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(subscription);

    console.log(`   📊 Active addresses: ${totalAddresses.count}`);
    console.log(`   📊 Total bookings: ${totalBookings.count}`);
    console.log(`   📊 Total subscriptions: ${totalSubscriptions.count}\n`);

    console.log("=".repeat(80));
    console.log("✅ VERIFICATION COMPLETE");
    console.log("=".repeat(80) + "\n");
  } catch (error) {
    console.error("\n❌ Verification failed:", error);
    process.exit(1);
  }
}

verifyDatabase().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
