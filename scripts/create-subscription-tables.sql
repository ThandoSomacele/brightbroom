-- Create subscription related tables manually if they don't exist
-- This script creates the necessary tables for recurring payments

-- Create enum types if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recurringfrequency') THEN
    CREATE TYPE "RecurringFrequency" AS ENUM('TWICE_MONTHLY', 'WEEKLY', 'BIWEEKLY', 'TWICE_WEEKLY');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscriptionstatus') THEN
    CREATE TYPE "SubscriptionStatus" AS ENUM('ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED', 'PENDING');
  END IF;
END $$;

-- Create subscription table if it doesn't exist
CREATE TABLE IF NOT EXISTS "subscription" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "address_id" text NOT NULL REFERENCES "address"("id"),
  "service_id" text NOT NULL REFERENCES "service"("id"),
  "cleaner_id" text REFERENCES "user"("id"),
  "frequency" "RecurringFrequency" NOT NULL,
  "status" "SubscriptionStatus" DEFAULT 'PENDING' NOT NULL,
  "preferred_days" text[],
  "preferred_time_slot" text,
  "monthly_dates" integer[],
  "base_price" numeric(10, 2) NOT NULL,
  "discount_percentage" numeric(5, 2) DEFAULT '0' NOT NULL,
  "final_price" numeric(10, 2) NOT NULL,
  "pay_fast_token" text,
  "pay_fast_subscription_id" text,
  "start_date" timestamp NOT NULL,
  "next_billing_date" timestamp,
  "end_date" timestamp,
  "paused_at" timestamp,
  "cancelled_at" timestamp,
  "notes" text,
  "cancellation_reason" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create subscription_payment table if it doesn't exist
CREATE TABLE IF NOT EXISTS "subscription_payment" (
  "id" text PRIMARY KEY NOT NULL,
  "subscription_id" text NOT NULL REFERENCES "subscription"("id") ON DELETE CASCADE,
  "booking_id" text REFERENCES "booking"("id"),
  "amount" numeric(10, 2) NOT NULL,
  "status" "PaymentStatus" DEFAULT 'PENDING' NOT NULL,
  "payment_method" "PaymentMethod",
  "pay_fast_payment_id" text,
  "pay_fast_reference" text,
  "billing_period_start" timestamp NOT NULL,
  "billing_period_end" timestamp NOT NULL,
  "processed_at" timestamp,
  "failure_reason" text,
  "retry_count" integer DEFAULT 0,
  "next_retry_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Add subscription_id column to booking table if it doesn't exist
ALTER TABLE "booking"
ADD COLUMN IF NOT EXISTS "subscription_id" text;

-- Add foreign key constraint if it doesn't exist (optional, since we have circular dependency)
-- We'll skip the foreign key for now to avoid circular dependency issues

COMMENT ON TABLE "subscription" IS 'Stores recurring booking subscriptions';
COMMENT ON TABLE "subscription_payment" IS 'Tracks payments for subscription bookings';
COMMENT ON COLUMN "booking"."subscription_id" IS 'Reference to subscription if this is a recurring booking';