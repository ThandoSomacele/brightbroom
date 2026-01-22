CREATE TYPE "public"."BankAccountType" AS ENUM('SAVINGS', 'CHEQUE', 'TRANSMISSION');--> statement-breakpoint
CREATE TYPE "public"."PayoutMethod" AS ENUM('EFT', 'INSTANT_MONEY');--> statement-breakpoint
ALTER TABLE "cleaner_profile" ADD COLUMN "payout_method" "PayoutMethod" DEFAULT 'INSTANT_MONEY';--> statement-breakpoint
ALTER TABLE "cleaner_profile" ADD COLUMN "bank_name" text;--> statement-breakpoint
ALTER TABLE "cleaner_profile" ADD COLUMN "bank_account_number" text;--> statement-breakpoint
ALTER TABLE "cleaner_profile" ADD COLUMN "bank_branch_code" text;--> statement-breakpoint
ALTER TABLE "cleaner_profile" ADD COLUMN "bank_account_type" "BankAccountType";--> statement-breakpoint
ALTER TABLE "cleaner_profile" ADD COLUMN "bank_account_holder" text;