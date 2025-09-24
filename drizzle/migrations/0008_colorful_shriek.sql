CREATE TYPE "public"."RecurringFrequency" AS ENUM('TWICE_MONTHLY', 'WEEKLY', 'BIWEEKLY', 'TWICE_WEEKLY');--> statement-breakpoint
CREATE TYPE "public"."SubscriptionStatus" AS ENUM('ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED', 'PENDING');--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"address_id" text NOT NULL,
	"service_id" text NOT NULL,
	"cleaner_id" text,
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
--> statement-breakpoint
CREATE TABLE "subscription_payment" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text NOT NULL,
	"booking_id" text,
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
--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "subscription_id" text;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_address_id_address_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."address"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_cleaner_id_user_id_fk" FOREIGN KEY ("cleaner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_payment" ADD CONSTRAINT "subscription_payment_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_payment" ADD CONSTRAINT "subscription_payment_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE no action ON UPDATE no action;