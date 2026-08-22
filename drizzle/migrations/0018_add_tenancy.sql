-- Migration: Add multi-tenancy (marketplace) support
-- Created: 2026-08-19
--
-- Adds the tenant + tenant_member tables, the TENANT_ADMIN user role and the
-- tenant_id foreign keys that scope existing data to a cleaning company.
-- Written by hand (like 0017_add_coupons.sql) because the drizzle snapshot
-- chain stops at 0016 and an auto-generated diff would re-create the coupon
-- tables that 0017 already applied.
--
-- Backfill of existing rows to the BrightBroom platform tenant is handled by
-- `pnpm db:seed:tenants --backfill`, which must be run after this migration.

-- Add TENANT_ADMIN to the existing UserRole enum
ALTER TYPE "public"."UserRole" ADD VALUE IF NOT EXISTS 'TENANT_ADMIN';--> statement-breakpoint

-- Create tenant member role enum
DO $$ BEGIN
	CREATE TYPE "public"."TenantMemberRole" AS ENUM('OWNER', 'ADMIN', 'MANAGER');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- Create tenant table (one row per cleaning company on the marketplace)
CREATE TABLE IF NOT EXISTS "tenant" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"logo_url" text,
	"contact_email" text,
	"contact_phone" text,
	"province" text,
	"service_areas" json,
	"commission_rate" numeric(5, 2) DEFAULT '15.00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_platform_owner" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Create tenant membership table (links users to tenants with a scoped role)
CREATE TABLE IF NOT EXISTS "tenant_member" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "TenantMemberRole" DEFAULT 'ADMIN' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_tenant_user" UNIQUE("tenant_id","user_id")
);--> statement-breakpoint

-- Foreign keys for tenant_member
DO $$ BEGIN
	ALTER TABLE "tenant_member" ADD CONSTRAINT "tenant_member_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "tenant_member" ADD CONSTRAINT "tenant_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- Scope existing data to a tenant (nullable: null = platform-wide / unassigned)
ALTER TABLE "service" ADD COLUMN IF NOT EXISTS "tenant_id" text;--> statement-breakpoint
ALTER TABLE "pricing_config" ADD COLUMN IF NOT EXISTS "tenant_id" text;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "tenant_id" text;--> statement-breakpoint
ALTER TABLE "cleaner_profile" ADD COLUMN IF NOT EXISTS "tenant_id" text;--> statement-breakpoint
ALTER TABLE "cleaner_application" ADD COLUMN IF NOT EXISTS "tenant_id" text;--> statement-breakpoint

-- Foreign keys for the tenant_id columns
DO $$ BEGIN
	ALTER TABLE "service" ADD CONSTRAINT "service_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "pricing_config" ADD CONSTRAINT "pricing_config_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "booking" ADD CONSTRAINT "booking_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "cleaner_profile" ADD CONSTRAINT "cleaner_profile_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "cleaner_application" ADD CONSTRAINT "cleaner_application_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- Indexes for the tenant-scoped queries the admin pages run
CREATE INDEX IF NOT EXISTS "booking_tenant_id_idx" ON "booking" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cleaner_profile_tenant_id_idx" ON "cleaner_profile" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cleaner_application_tenant_id_idx" ON "cleaner_application" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tenant_member_user_id_idx" ON "tenant_member" ("user_id");
