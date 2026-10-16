// scripts/db/seed-client.ts
//
// First-run seed for a self-hosted client database (see docs/SELF_HOSTING.md),
// run after the fresh migrations (./drizzle/fresh). Idempotent: run it as often
// as you like; it only creates what is missing and never changes a password.
//
//   SEED_ADMIN_EMAIL=owner@company.co.za SEED_ADMIN_PASSWORD='…' pnpm db:seed:client
//   (in the container: node_modules/.bin/tsx scripts/db/seed-client.ts)
//
// What it does:
//   1. Fills the platform-owner tenant (created by 0001_seed_defaults.sql) with
//      the company's PUBLIC_BRAND_NAME / PUBLIC_SUPPORT_EMAIL / PUBLIC_SUPPORT_PHONE
//      / PUBLIC_BRAND_LOGO_URL, when those are set.
//   2. Creates the first ADMIN user from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
//      (optional SEED_ADMIN_FIRST_NAME / SEED_ADMIN_LAST_NAME) and links it to
//      that tenant as OWNER. Skipped when SEED_ADMIN_EMAIL is unset.
//   3. Adds the default booking add-ons when the addon table is empty
//      (SEED_DEFAULT_ADDONS=false to skip). Prices are editable in /admin.
//
// Not for the demo database (brightbroom.com): that has its own data.
import crypto from "crypto";
import fs from "fs";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { Argon2id } from "oslo/password";
import postgres from "postgres";
import * as schema from "../../src/lib/server/db/schema";

// No dotenv on purpose: a local .env may point at the demo database. The
// target must be given explicitly, and is checked below.

const env = (name: string) => process.env[name]?.trim() || "";

// Same list scripts/db/seed-pricing.ts seeds for the demo.
const DEFAULT_ADDONS = [
  {
    name: "Laundry & Ironing",
    description:
      "Use of household laundry machine. Collection of clothes allowed to go into the laundry machine. Relevant washing option selected. Ironing all washed and dried clothes.",
    price: "100.00",
    durationMinutes: 90,
  },
  {
    name: "Inside Fridge",
    description: "Unpacking, washing/wiping, drying and repacking inside fridge.",
    price: "35.00",
    durationMinutes: 30,
  },
  {
    name: "Inside Oven",
    description: "Washing and drying inside oven and microwave.",
    price: "35.00",
    durationMinutes: 30,
  },
  {
    name: "Inside Cabinets",
    description: "Unpacking, washing/wiping, drying and repacking inside kitchen cabinets.",
    price: "70.00",
    durationMinutes: 60,
  },
  {
    name: "Interior Walls",
    description:
      "Removal of visible spots/spatter/smudges. Wiping and drying of section of interior walls.",
    price: "70.00",
    durationMinutes: 60,
  },
  {
    name: "Interior Windows",
    description: "Removal of visible smudges/dirt. Wiping and drying of interior windows.",
    price: "70.00",
    durationMinutes: 60,
  },
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "platform";

async function main() {
  const databaseUrl = env("DATABASE_URL");
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const client = postgres(databaseUrl, { max: 1, onnotice: () => {} });
  const db = drizzle(client, { schema });

  try {
    // Refuse any database not built from ./drizzle/fresh (e.g. the demo's),
    // recognised by the baseline's entry in drizzle's migration ledger.
    const journal = JSON.parse(fs.readFileSync("drizzle/fresh/meta/_journal.json", "utf8"));
    const baselineWhen = journal.entries[0].when as number;
    const [ledger] = await client`
      select 1 as ok from drizzle.__drizzle_migrations where created_at = ${baselineWhen}
    `.catch(() => []);
    if (!ledger) {
      throw new Error(
        "This database was not created from ./drizzle/fresh. Run the fresh migrations on a NEW database first (pnpm db:fresh:migrate).",
      );
    }

    // 1. Platform-owner tenant ------------------------------------------------
    const [platform] = await db
      .select()
      .from(schema.tenant)
      .where(eq(schema.tenant.isPlatformOwner, true))
      .limit(1);
    if (!platform) {
      throw new Error(
        "No platform-owner tenant found. Run the fresh migrations first (pnpm db:fresh:migrate).",
      );
    }

    const brandName = env("PUBLIC_BRAND_NAME");
    const updates: Partial<typeof schema.tenant.$inferInsert> = {};
    if (brandName && platform.name !== brandName) {
      updates.name = brandName;
      // Only claim the slug if no other tenant already uses it.
      const slug = slugify(brandName);
      const [taken] = await db
        .select({ id: schema.tenant.id })
        .from(schema.tenant)
        .where(eq(schema.tenant.slug, slug))
        .limit(1);
      if (!taken || taken.id === platform.id) updates.slug = slug;
    }
    const contactEmail = env("PUBLIC_SUPPORT_EMAIL");
    if (contactEmail && platform.contactEmail !== contactEmail) updates.contactEmail = contactEmail;
    const contactPhone = env("PUBLIC_SUPPORT_PHONE");
    if (contactPhone && platform.contactPhone !== contactPhone) updates.contactPhone = contactPhone;
    const logoUrl = env("PUBLIC_BRAND_LOGO_URL");
    if (logoUrl && platform.logoUrl !== logoUrl) updates.logoUrl = logoUrl;

    if (Object.keys(updates).length > 0) {
      await db
        .update(schema.tenant)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(schema.tenant.id, platform.id));
      console.log(`Tenant: updated ${Object.keys(updates).join(", ")}`);
    } else {
      console.log(`Tenant: "${platform.name}" up to date`);
    }

    // 2. First admin -------------------------------------------------------------
    const adminEmail = env("SEED_ADMIN_EMAIL").toLowerCase(); // login lower-cases too
    if (!adminEmail) {
      console.log("Admin: SEED_ADMIN_EMAIL not set, skipped");
    } else {
      let [admin] = await db
        .select()
        .from(schema.user)
        .where(eq(schema.user.email, adminEmail))
        .limit(1);

      if (admin) {
        // Never touch an existing account's password or role.
        if (admin.role !== "ADMIN") {
          console.warn(
            `Admin: ${adminEmail} already exists with role ${admin.role}; left unchanged`,
          );
        } else {
          console.log(`Admin: ${adminEmail} already exists`);
        }
      } else {
        const password = process.env.SEED_ADMIN_PASSWORD || "";
        if (password.length < 12) {
          throw new Error("SEED_ADMIN_PASSWORD must be set and at least 12 characters");
        }
        // Same hasher the login action verifies with (oslo/password Argon2id).
        const passwordHash = await new Argon2id().hash(password);
        [admin] = await db
          .insert(schema.user)
          .values({
            id: crypto.randomUUID(),
            email: adminEmail,
            passwordHash,
            firstName: env("SEED_ADMIN_FIRST_NAME") || "Admin",
            lastName: env("SEED_ADMIN_LAST_NAME") || brandName || "User",
            role: "ADMIN",
            isActive: true,
          })
          .returning();
        console.log(`Admin: created ${adminEmail}`);
      }

      if (admin.role === "ADMIN") {
        const [membership] = await db
          .select({ id: schema.tenantMember.id })
          .from(schema.tenantMember)
          .where(
            and(
              eq(schema.tenantMember.userId, admin.id),
              eq(schema.tenantMember.tenantId, platform.id),
            ),
          )
          .limit(1);
        if (!membership) {
          await db.insert(schema.tenantMember).values({
            id: crypto.randomUUID(),
            tenantId: platform.id,
            userId: admin.id,
            role: "OWNER",
          });
          console.log("Admin: linked to the platform tenant as OWNER");
        }
      }
    }

    // 3. Default add-ons --------------------------------------------------------
    if (env("SEED_DEFAULT_ADDONS") === "false") {
      console.log("Add-ons: skipped (SEED_DEFAULT_ADDONS=false)");
    } else {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.addon);
      if (count > 0) {
        console.log(`Add-ons: ${count} already present`);
      } else {
        await db.insert(schema.addon).values(
          DEFAULT_ADDONS.map((a, i) => ({
            id: crypto.randomUUID(),
            ...a,
            isActive: true,
            sortOrder: i + 1,
          })),
        );
        console.log(`Add-ons: created ${DEFAULT_ADDONS.length} defaults`);
      }
    }

    console.log("Seed complete");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
