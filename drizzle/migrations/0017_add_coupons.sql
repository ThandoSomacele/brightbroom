-- Migration: Add coupon system tables and booking coupon fields
-- Created: 2026-01-23

-- Create discount type enum
CREATE TYPE "public"."DiscountType" AS ENUM('PERCENTAGE', 'FIXED_AMOUNT');--> statement-breakpoint

-- Create coupon table
CREATE TABLE IF NOT EXISTS "coupon" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"description" text,
	"discount_type" "DiscountType" NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"minimum_booking_amount" numeric(10, 2) NOT NULL,
	"requires_first_booking" boolean DEFAULT false NOT NULL,
	"max_uses_total" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp NOT NULL,
	"valid_until" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Create coupon usage tracking table
CREATE TABLE IF NOT EXISTS "coupon_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"coupon_id" text NOT NULL,
	"user_id" text NOT NULL,
	"booking_id" text NOT NULL,
	"discount_amount" numeric(10, 2) NOT NULL,
	"used_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Add foreign keys for coupon_usage
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Add coupon fields to booking table
ALTER TABLE "booking" ADD COLUMN "coupon_id" text;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "original_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "discount_amount" numeric(10, 2);
