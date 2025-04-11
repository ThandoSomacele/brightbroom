-- Migration to add payment commission fields and cleaner payout summary table
-- File: drizzle/migrations/0005_payment_commission_fields.sql

-- Add new columns to the payment table
ALTER TABLE "payment" 
  ADD COLUMN IF NOT EXISTS "platform_commission_rate" DECIMAL(5, 2) DEFAULT 25.00 NOT NULL,
  ADD COLUMN IF NOT EXISTS "platform_commission_amount" DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS "cleaner_payout_amount" DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS "is_paid_to_provider" BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "provider_payout_date" TIMESTAMP;

-- Add cleaner_payout_summary table
CREATE TABLE IF NOT EXISTS "cleaner_payout_summary" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "cleaner_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "total_earnings" DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  "total_commission" DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  "total_payout" DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  "pending_payout" DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  "last_updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "total_earnings_current_month" DECIMAL(10, 2) DEFAULT 0.00,
  "total_earnings_last_month" DECIMAL(10, 2) DEFAULT 0.00,
  "total_earnings_this_year" DECIMAL(10, 2) DEFAULT 0.00,
  "last_payout_amount" DECIMAL(10, 2),
  "last_payout_date" TIMESTAMP
);

-- Update the existing payments with commission data
UPDATE "payment" 
SET 
  "platform_commission_rate" = 25.00,
  "platform_commission_amount" = ("amount" * 0.25),
  "cleaner_payout_amount" = ("amount" * 0.75),
  "is_paid_to_provider" = false
WHERE
  "platform_commission_amount" IS NULL;

-- Create an index on cleaner_id for faster lookups
CREATE INDEX IF NOT EXISTS "idx_cleaner_payout_summary_cleaner_id" ON "cleaner_payout_summary"("cleaner_id");

-- Create indices on payment table for better query performance
CREATE INDEX IF NOT EXISTS "idx_payment_booking_id" ON "payment"("booking_id");
CREATE INDEX IF NOT EXISTS "idx_payment_is_paid_to_provider" ON "payment"("is_paid_to_provider");
