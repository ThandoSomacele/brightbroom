-- Migration: Vet cleaning companies before they can trade
-- Created: 2026-08-25
--
-- A company could sign up at /join/company and be operating in about two
-- minutes, with bank details it typed in itself and a share of every booking
-- owed to that account. This gates a company on document review.
--
-- tenant.is_active already existed but was enforced nowhere — only read by
-- getAllActive(). It now means "vetted and allowed to trade", and its default
-- flips to false so a new company starts inactive.

CREATE TYPE "public"."TenantVerificationStatus" AS ENUM('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."TenantDocumentType" AS ENUM('COMPANY_REGISTRATION', 'DIRECTOR_ID', 'PROOF_OF_ADDRESS', 'BANK_LETTER');--> statement-breakpoint

ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "verification_status" "TenantVerificationStatus" DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "verification_notes" text;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "verified_by" text;--> statement-breakpoint

DO $$ BEGIN
	ALTER TABLE "tenant" ADD CONSTRAINT "tenant_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- Companies that already exist predate vetting. Grandfather the ones that were
-- active so the platform owner and anyone already trading is not switched off
-- by this migration.
UPDATE "tenant" SET "verification_status" = 'APPROVED', "verified_at" = now()
  WHERE "is_active" = true;--> statement-breakpoint

-- New companies start inactive from here on
ALTER TABLE "tenant" ALTER COLUMN "is_active" SET DEFAULT false;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "tenant_document" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"type" "TenantDocumentType" NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_tenant_document" UNIQUE("tenant_id","type")
);--> statement-breakpoint

DO $$ BEGIN
	ALTER TABLE "tenant_document" ADD CONSTRAINT "tenant_document_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- The review queue reads by status
CREATE INDEX IF NOT EXISTS "tenant_verification_status_idx" ON "tenant" ("verification_status");
