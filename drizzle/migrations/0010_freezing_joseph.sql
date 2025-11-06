ALTER TYPE "public"."RecurringFrequency" ADD VALUE 'TWICE_MONTHLY';--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "monthly_dates" integer[];