ALTER TABLE "payment" ALTER COLUMN "platform_commission_rate" SET DEFAULT '15.00';--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "pay_fast_fee_amount" numeric(10, 2);