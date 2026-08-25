-- Migration: Give cleaning companies a share of each booking
-- Created: 2026-08-25
--
-- Until now a booking split two ways: platform commission and cleaner payout.
-- The tenant that brought the cleaners received nothing and had nowhere to be
-- paid. This adds the company as a payee.
--
-- Written by hand rather than generated: the drizzle snapshot chain under
-- meta/ still stops at 0016, so `drizzle-kit generate` cannot diff cleanly and
-- prompts for input no CI runner can answer. The ledger repair in
-- db:migrate:rebaseline fixed `migrate`, which is a separate concern.

-- Where a company's share is paid out to
ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "payout_method" "PayoutMethod" DEFAULT 'EFT';--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "bank_name" text;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "bank_account_number" text;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "bank_branch_code" text;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "bank_account_type" "BankAccountType";--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "bank_account_holder" text;--> statement-breakpoint

-- The company's share of a booking. Stays null on platform-owner bookings,
-- where there is no third party between the platform and the cleaner.
ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "tenant_payout_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "is_paid_to_tenant" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN IF NOT EXISTS "tenant_payout_date" timestamp;--> statement-breakpoint

-- Payouts are settled per company, so index the way that query reads
CREATE INDEX IF NOT EXISTS "payment_is_paid_to_tenant_idx" ON "payment" ("is_paid_to_tenant");
