-- Migration: Capture and enforce right to work in South Africa
-- Created: 2026-08-25
--
-- Cleaner intake collected only SOUTH_AFRICAN_ID or PASSPORT, neither of which
-- establishes a right to work. A passport says who someone is, not whether they
-- may be engaged.
--
-- Asylum seekers (Section 22) are deliberately not an option: that permit only
-- permits work if separately endorsed, and an endorsement brings Form 6 filing,
-- visa record-keeping and renewals every few months. Recognised refugees
-- (Section 24) may work without further permission.
--
-- Expiry is enforced where cleaners are matched rather than by a scheduled job,
-- so a lapsed permit cannot quietly keep working.

DO $$ BEGIN
	CREATE TYPE "public"."WorkAuthorisation" AS ENUM('SA_CITIZEN', 'PERMANENT_RESIDENT', 'WORK_PERMIT', 'REFUGEE');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

ALTER TABLE "cleaner_profile" ADD COLUMN IF NOT EXISTS "work_authorisation" "WorkAuthorisation";--> statement-breakpoint
ALTER TABLE "cleaner_profile" ADD COLUMN IF NOT EXISTS "work_auth_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "cleaner_profile" ADD COLUMN IF NOT EXISTS "work_auth_document_url" text;--> statement-breakpoint

ALTER TABLE "cleaner_application" ADD COLUMN IF NOT EXISTS "work_authorisation" "WorkAuthorisation";--> statement-breakpoint
ALTER TABLE "cleaner_application" ADD COLUMN IF NOT EXISTS "work_auth_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "cleaner_application" ADD COLUMN IF NOT EXISTS "work_auth_document_url" text;--> statement-breakpoint

-- Matching filters on expiry on every lookup, so index it
CREATE INDEX IF NOT EXISTS "cleaner_profile_work_auth_expiry_idx" ON "cleaner_profile" ("work_auth_expiry");
