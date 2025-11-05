ALTER TABLE "subscription" DROP COLUMN "monthly_dates";--> statement-breakpoint
ALTER TABLE "public"."subscription" ALTER COLUMN "frequency" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."RecurringFrequency";--> statement-breakpoint
CREATE TYPE "public"."RecurringFrequency" AS ENUM('WEEKLY', 'BIWEEKLY', 'TWICE_MONTHLY');--> statement-breakpoint
ALTER TABLE "public"."subscription" ALTER COLUMN "frequency" SET DATA TYPE "public"."RecurringFrequency" USING "frequency"::"public"."RecurringFrequency";