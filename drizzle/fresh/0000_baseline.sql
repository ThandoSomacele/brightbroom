CREATE TYPE "public"."ApplicationStatus" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."BankAccountType" AS ENUM('SAVINGS', 'CHEQUE', 'TRANSMISSION');--> statement-breakpoint
CREATE TYPE "public"."BookingStatus" AS ENUM('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."CommunicationDirection" AS ENUM('INCOMING', 'OUTGOING');--> statement-breakpoint
CREATE TYPE "public"."CommunicationType" AS ENUM('EMAIL', 'SMS', 'NOTE');--> statement-breakpoint
CREATE TYPE "public"."DayOfWeek" AS ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');--> statement-breakpoint
CREATE TYPE "public"."DiscountType" AS ENUM('PERCENTAGE', 'FIXED_AMOUNT');--> statement-breakpoint
CREATE TYPE "public"."IdType" AS ENUM('SOUTH_AFRICAN_ID', 'PASSPORT');--> statement-breakpoint
CREATE TYPE "public"."PaymentMethod" AS ENUM('CREDIT_CARD', 'DEBIT_CARD', 'EFT', 'MOBICRED', 'SNAPSCAN', 'ZAPPER', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."PaymentStatus" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."PayoutMethod" AS ENUM('EFT', 'INSTANT_MONEY');--> statement-breakpoint
CREATE TYPE "public"."PetCompatibility" AS ENUM('NONE', 'DOGS', 'CATS', 'BOTH');--> statement-breakpoint
CREATE TYPE "public"."RecurringFrequency" AS ENUM('WEEKLY', 'BIWEEKLY', 'TWICE_WEEKLY', 'TWICE_MONTHLY');--> statement-breakpoint
CREATE TYPE "public"."SubscriptionStatus" AS ENUM('ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED', 'PENDING');--> statement-breakpoint
CREATE TYPE "public"."TenantDocumentType" AS ENUM('COMPANY_REGISTRATION', 'DIRECTOR_ID', 'PROOF_OF_ADDRESS', 'BANK_LETTER');--> statement-breakpoint
CREATE TYPE "public"."TenantMemberRole" AS ENUM('OWNER', 'ADMIN', 'MANAGER');--> statement-breakpoint
CREATE TYPE "public"."TenantVerificationStatus" AS ENUM('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."UserRole" AS ENUM('CUSTOMER', 'CLEANER', 'ADMIN', 'TENANT_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."WorkAuthorisation" AS ENUM('SA_CITIZEN', 'PERMANENT_RESIDENT', 'WORK_PERMIT', 'REFUGEE');--> statement-breakpoint
CREATE TABLE "addon" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"duration_minutes" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 999,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "address" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"street" text NOT NULL,
	"apt_unit" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip_code" text NOT NULL,
	"lat" numeric(10, 6),
	"lng" numeric(10, 6),
	"instructions" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_address" UNIQUE("user_id","street","apt_unit","city","state","zip_code")
);
--> statement-breakpoint
CREATE TABLE "admin_note" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"content" text NOT NULL,
	"added_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_note" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"content" text NOT NULL,
	"added_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text,
	"user_id" text,
	"address_id" text,
	"service_id" text NOT NULL,
	"cleaner_id" text,
	"status" "BookingStatus" DEFAULT 'PENDING' NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"notes" text,
	"guest_address" json,
	"bedroom_count" integer DEFAULT 1,
	"bathroom_count" integer DEFAULT 1,
	"subscription_id" text,
	"coupon_id" text,
	"original_price" numeric(10, 2),
	"discount_amount" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_addon" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"addon_id" text NOT NULL,
	"price_at_booking" numeric(10, 2) NOT NULL,
	"duration_at_booking" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cleaner_application" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"city" text NOT NULL,
	"latitude" numeric(10, 6),
	"longitude" numeric(10, 6),
	"formatted_address" text,
	"work_radius" numeric(10, 2) DEFAULT '20',
	"bio" text,
	"tax_number" text,
	"pet_compatibility" text DEFAULT 'NONE',
	"bank_name" text,
	"bank_account_number" text,
	"bank_branch_code" text,
	"bank_account_type" text,
	"bank_account_holder" text,
	"documents_pending" boolean DEFAULT true NOT NULL,
	"availability" text NOT NULL,
	"own_transport" boolean DEFAULT false NOT NULL,
	"whats_app" boolean DEFAULT false NOT NULL,
	"id_type" text,
	"id_number" text,
	"referral_source" text,
	"documents" text[],
	"work_authorisation" "WorkAuthorisation",
	"work_auth_expiry" timestamp,
	"work_auth_document_url" text,
	"profile_image_url" text,
	"status" "ApplicationStatus" DEFAULT 'PENDING' NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cleaner_payout_summary" (
	"id" text PRIMARY KEY NOT NULL,
	"cleaner_id" text NOT NULL,
	"total_earnings" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"total_commission" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"total_payout" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"pending_payout" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"total_earnings_current_month" numeric(10, 2) DEFAULT '0.00',
	"total_earnings_last_month" numeric(10, 2) DEFAULT '0.00',
	"total_earnings_this_year" numeric(10, 2) DEFAULT '0.00',
	"last_payout_amount" numeric(10, 2),
	"last_payout_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "cleaner_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text,
	"user_id" text NOT NULL,
	"id_type" "IdType" NOT NULL,
	"id_number" text NOT NULL,
	"tax_number" text,
	"bank_account" text,
	"work_location_lat" numeric(10, 6) NOT NULL,
	"work_location_lng" numeric(10, 6) NOT NULL,
	"work_address" text NOT NULL,
	"work_radius" numeric(10, 2) NOT NULL,
	"bio" text,
	"pet_compatibility" "PetCompatibility" DEFAULT 'NONE' NOT NULL,
	"available_days" text[],
	"rating" numeric(3, 1),
	"training_completed" text[] DEFAULT '{}',
	"experience_types" text[] DEFAULT '{}',
	"is_available" boolean DEFAULT true NOT NULL,
	"profile_image_url" text,
	"work_authorisation" "WorkAuthorisation",
	"work_auth_expiry" timestamp,
	"work_auth_document_url" text,
	"payout_method" "PayoutMethod" DEFAULT 'INSTANT_MONEY',
	"bank_name" text,
	"bank_account_number" text,
	"bank_branch_code" text,
	"bank_account_type" "BankAccountType",
	"bank_account_holder" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cleaner_profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "communication_log" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"type" "CommunicationType" NOT NULL,
	"content" text NOT NULL,
	"subject" text,
	"sent_to" text,
	"sent_by" text NOT NULL,
	"direction" "CommunicationDirection" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
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
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupon_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "coupon_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"coupon_id" text NOT NULL,
	"user_id" text NOT NULL,
	"booking_id" text NOT NULL,
	"discount_amount" numeric(10, 2) NOT NULL,
	"used_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "key" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"hashed_password" text
);
--> statement-breakpoint
CREATE TABLE "password_reset_token" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"user_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "PaymentStatus" DEFAULT 'PENDING' NOT NULL,
	"payment_method" "PaymentMethod" DEFAULT 'CREDIT_CARD' NOT NULL,
	"platform_commission_rate" numeric(5, 2) DEFAULT '20.00' NOT NULL,
	"platform_commission_amount" numeric(10, 2),
	"pay_fast_fee_amount" numeric(10, 2),
	"cleaner_payout_amount" numeric(10, 2),
	"tenant_payout_amount" numeric(10, 2),
	"is_paid_to_provider" boolean DEFAULT false NOT NULL,
	"provider_payout_date" timestamp,
	"is_paid_to_tenant" boolean DEFAULT false NOT NULL,
	"tenant_payout_date" timestamp,
	"pay_fast_id" text,
	"pay_fast_token" text,
	"merchant_reference" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "pricing_config" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"tenant_id" text,
	"base_price" numeric(10, 2) DEFAULT '72.00' NOT NULL,
	"base_duration_minutes" integer DEFAULT 120 NOT NULL,
	"base_description" text DEFAULT 'Living Room and Kitchen cleaning included',
	"bedroom_price" numeric(10, 2) DEFAULT '36.00' NOT NULL,
	"bedroom_duration_minutes" integer DEFAULT 60 NOT NULL,
	"bedroom_min" integer DEFAULT 1 NOT NULL,
	"bedroom_max" integer DEFAULT 10 NOT NULL,
	"bathroom_price" numeric(10, 2) DEFAULT '36.00' NOT NULL,
	"bathroom_duration_minutes" integer DEFAULT 60 NOT NULL,
	"bathroom_min" integer DEFAULT 1 NOT NULL,
	"bathroom_max" integer DEFAULT 6 NOT NULL,
	"platform_commission_rate" numeric(5, 2) DEFAULT '20.00' NOT NULL,
	"payfast_fees" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"duration_hours" integer NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 999
);
--> statement-breakpoint
CREATE TABLE "user_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"address_id" text NOT NULL,
	"service_id" text NOT NULL,
	"cleaner_id" text,
	"frequency" "RecurringFrequency" NOT NULL,
	"status" "SubscriptionStatus" DEFAULT 'PENDING' NOT NULL,
	"preferred_days" text[],
	"monthly_dates" integer[],
	"preferred_time_slot" text,
	"bedroom_count" integer DEFAULT 1,
	"bathroom_count" integer DEFAULT 1,
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
CREATE TABLE "subscription_addon" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text NOT NULL,
	"addon_id" text NOT NULL,
	"price_at_subscription" numeric(10, 2) NOT NULL,
	"duration_at_subscription" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "tenant" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text,
	"contact_email" text,
	"contact_phone" text,
	"province" text,
	"service_areas" json,
	"commission_rate" numeric(5, 2) DEFAULT '15.00' NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"is_platform_owner" boolean DEFAULT false NOT NULL,
	"verification_status" "TenantVerificationStatus" DEFAULT 'PENDING' NOT NULL,
	"verification_notes" text,
	"verified_at" timestamp,
	"verified_by" text,
	"payout_method" "PayoutMethod" DEFAULT 'EFT',
	"bank_name" text,
	"bank_account_number" text,
	"bank_branch_code" text,
	"bank_account_type" "BankAccountType",
	"bank_account_holder" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tenant_document" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"type" "TenantDocumentType" NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_tenant_document" UNIQUE("tenant_id","type")
);
--> statement-breakpoint
CREATE TABLE "tenant_member" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "TenantMemberRole" DEFAULT 'ADMIN' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_tenant_user" UNIQUE("tenant_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"phone" text,
	"role" "UserRole" DEFAULT 'CUSTOMER' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_note" ADD CONSTRAINT "admin_note_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_note" ADD CONSTRAINT "application_note_application_id_cleaner_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."cleaner_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_address_id_address_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."address"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_cleaner_id_user_id_fk" FOREIGN KEY ("cleaner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_addon" ADD CONSTRAINT "booking_addon_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_addon" ADD CONSTRAINT "booking_addon_addon_id_addon_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."addon"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleaner_application" ADD CONSTRAINT "cleaner_application_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleaner_payout_summary" ADD CONSTRAINT "cleaner_payout_summary_cleaner_id_user_id_fk" FOREIGN KEY ("cleaner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleaner_profile" ADD CONSTRAINT "cleaner_profile_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleaner_profile" ADD CONSTRAINT "cleaner_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_log" ADD CONSTRAINT "communication_log_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "key" ADD CONSTRAINT "key_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_config" ADD CONSTRAINT "pricing_config_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service" ADD CONSTRAINT "service_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_address_id_address_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."address"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_cleaner_id_user_id_fk" FOREIGN KEY ("cleaner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_addon" ADD CONSTRAINT "subscription_addon_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_addon" ADD CONSTRAINT "subscription_addon_addon_id_addon_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."addon"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_payment" ADD CONSTRAINT "subscription_payment_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_payment" ADD CONSTRAINT "subscription_payment_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant" ADD CONSTRAINT "tenant_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_document" ADD CONSTRAINT "tenant_document_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_member" ADD CONSTRAINT "tenant_member_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_member" ADD CONSTRAINT "tenant_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;