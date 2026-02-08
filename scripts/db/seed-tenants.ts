// scripts/db/seed-tenants.ts
// Seeds BrightBroom as the default platform tenant and backfills existing data
import crypto from "crypto";
import { eq, isNull } from "drizzle-orm";
import {
  createDbConnection,
  closeConnection,
  confirmAction,
  logDbInfo,
} from "./utils";

import * as schema from "../../src/lib/server/db/schema";

const BRIGHTBROOM_TENANT_ID = "bb-platform-tenant";

const args = process.argv.slice(2);
const options = {
  backfill: args.includes("--backfill") || args.includes("-b"),
  confirm: args.includes("--confirm") || args.includes("-y"),
  help: args.includes("--help") || args.includes("-h"),
};

if (options.help) {
  console.log(`
BrightBroom Tenant Seeder
=========================

Usage: npx tsx scripts/db/seed-tenants.ts [options]

Options:
  --backfill, -b   Backfill existing data with BrightBroom tenant ID
  --confirm, -y    Skip confirmation prompts
  --help, -h       Show this help message

This script:
1. Creates BrightBroom as the default platform tenant
2. Optionally backfills existing cleanerProfiles, bookings, services,
   pricingConfig, and applications with BrightBroom's tenant ID
`);
  process.exit(0);
}

async function seedTenants() {
  logDbInfo();

  const { client, db } = createDbConnection();

  try {
    // Check if BrightBroom tenant already exists
    const existing = await db
      .select()
      .from(schema.tenant)
      .where(eq(schema.tenant.id, BRIGHTBROOM_TENANT_ID))
      .limit(1);

    if (existing.length > 0) {
      console.log("\n✓ BrightBroom tenant already exists");
      console.log(`  ID: ${existing[0].id}`);
      console.log(`  Name: ${existing[0].name}`);
      console.log(`  Slug: ${existing[0].slug}`);
    } else {
      if (!options.confirm) {
        const proceed = await confirmAction(
          "Create BrightBroom as the platform tenant?"
        );
        if (!proceed) {
          console.log("Aborted.");
          await closeConnection(client);
          return;
        }
      }

      const [brightBroom] = await db
        .insert(schema.tenant)
        .values({
          id: BRIGHTBROOM_TENANT_ID,
          name: "BrightBroom",
          slug: "brightbroom",
          contactEmail: "info@brightbroom.com",
          province: "Gauteng",
          commissionRate: "15.00",
          isActive: true,
          isPlatformOwner: true,
        })
        .returning();

      console.log("\n✓ Created BrightBroom tenant");
      console.log(`  ID: ${brightBroom.id}`);
      console.log(`  Slug: ${brightBroom.slug}`);
      console.log(`  Platform owner: ${brightBroom.isPlatformOwner}`);
    }

    // Link existing ADMIN users to BrightBroom tenant
    const adminUsers = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.role, "ADMIN"));

    if (adminUsers.length > 0) {
      console.log(`\nFound ${adminUsers.length} existing admin user(s)`);

      for (const admin of adminUsers) {
        // Check if already a member
        const existingMember = await db
          .select()
          .from(schema.tenantMember)
          .where(
            eq(schema.tenantMember.userId, admin.id)
          )
          .limit(1);

        if (existingMember.length === 0) {
          await db.insert(schema.tenantMember).values({
            id: crypto.randomUUID(),
            tenantId: BRIGHTBROOM_TENANT_ID,
            userId: admin.id,
            role: "OWNER",
          });
          console.log(`  ✓ Linked admin ${admin.email} to BrightBroom as OWNER`);
        } else {
          console.log(`  - Admin ${admin.email} already linked to a tenant`);
        }
      }
    }

    // Backfill existing data
    if (options.backfill) {
      console.log("\nBackfilling existing data with BrightBroom tenant ID...");

      // Backfill cleaner profiles
      const profileResult = await db
        .update(schema.cleanerProfile)
        .set({ tenantId: BRIGHTBROOM_TENANT_ID })
        .where(isNull(schema.cleanerProfile.tenantId));
      console.log(`  ✓ Cleaner profiles updated: ${profileResult.length ?? 0}`);

      // Backfill bookings
      const bookingResult = await db
        .update(schema.booking)
        .set({ tenantId: BRIGHTBROOM_TENANT_ID })
        .where(isNull(schema.booking.tenantId));
      console.log(`  ✓ Bookings updated: ${bookingResult.length ?? 0}`);

      // Backfill services
      const serviceResult = await db
        .update(schema.service)
        .set({ tenantId: BRIGHTBROOM_TENANT_ID })
        .where(isNull(schema.service.tenantId));
      console.log(`  ✓ Services updated: ${serviceResult.length ?? 0}`);

      // Backfill pricing config
      const pricingResult = await db
        .update(schema.pricingConfig)
        .set({ tenantId: BRIGHTBROOM_TENANT_ID })
        .where(isNull(schema.pricingConfig.tenantId));
      console.log(`  ✓ Pricing configs updated: ${pricingResult.length ?? 0}`);

      // Backfill applications
      const appResult = await db
        .update(schema.cleanerApplication)
        .set({ tenantId: BRIGHTBROOM_TENANT_ID })
        .where(isNull(schema.cleanerApplication.tenantId));
      console.log(`  ✓ Applications updated: ${appResult.length ?? 0}`);
    }

    console.log("\nDone!");
  } catch (error) {
    console.error("Error seeding tenants:", error);
  } finally {
    await closeConnection(client);
  }
}

seedTenants();
