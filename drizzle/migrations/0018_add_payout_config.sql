-- Migration: Add payout configuration (commission rate + PayFast fees) to pricing_config
-- Created: 2026-06-23
--
-- Powers the "Fees & Commission" section in /admin/pricing. Both columns are
-- additive and safe to run on a live database. platform_commission_rate is a
-- percentage (20.00 = 20%); payfast_fees holds the per-method fee schedule as
-- JSON ({ CREDIT_CARD: { percent, fixed, min? }, ... }). A null payfast_fees
-- falls back to the application defaults in payout-calculator.ts.

ALTER TABLE "pricing_config"
  ADD COLUMN IF NOT EXISTS "platform_commission_rate" numeric(5, 2) NOT NULL DEFAULT '20.00';--> statement-breakpoint

ALTER TABLE "pricing_config"
  ADD COLUMN IF NOT EXISTS "payfast_fees" json;
