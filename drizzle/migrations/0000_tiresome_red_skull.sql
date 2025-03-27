CREATE TYPE "public"."BookingStatus" AS ENUM('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."CommunicationDirection" AS ENUM('INCOMING', 'OUTGOING');--> statement-breakpoint
CREATE TYPE "public"."CommunicationType" AS ENUM('EMAIL', 'SMS', 'NOTE');--> statement-breakpoint
CREATE TYPE "public"."DayOfWeek" AS ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');--> statement-breakpoint
CREATE TYPE "public"."IdType" AS ENUM('SOUTH_AFRICAN_ID', 'PASSPORT');--> statement-breakpoint
CREATE TYPE "public"."PaymentMethod" AS ENUM('CREDIT_CARD', 'DEBIT_CARD', 'EFT', 'MOBICRED', 'SNAPSCAN', 'ZAPPER', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."PaymentStatus" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."PetCompatibility" AS ENUM('NONE', 'DOGS', 'CATS', 'BOTH');--> statement-breakpoint
CREATE TYPE "public"."UserRole" AS ENUM('CUSTOMER', 'CLEANER', 'ADMIN');--> statement-breakpoint
CREATE TABLE "address" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"street" text NOT NULL,
	"apt_unit" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip_code" text NOT NULL,
	"instructions" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "booking" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"address_id" text NOT NULL,
	"service_id" text NOT NULL,
	"cleaner_id" text,
	"status" "BookingStatus" DEFAULT 'PENDING' NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cleaner_profile" (
	"id" text PRIMARY KEY NOT NULL,
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
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cleaner_profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "cleaner_specialisation" (
	"id" text PRIMARY KEY NOT NULL,
	"cleaner_profile_id" text NOT NULL,
	"service_id" text NOT NULL,
	"experience" integer NOT NULL
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
	"pay_fast_id" text,
	"pay_fast_token" text,
	"merchant_reference" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "service" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"duration_hours" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL
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
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_note" ADD CONSTRAINT "admin_note_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_address_id_address_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."address"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_cleaner_id_user_id_fk" FOREIGN KEY ("cleaner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleaner_profile" ADD CONSTRAINT "cleaner_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleaner_specialisation" ADD CONSTRAINT "cleaner_specialisation_cleaner_profile_id_cleaner_profile_id_fk" FOREIGN KEY ("cleaner_profile_id") REFERENCES "public"."cleaner_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleaner_specialisation" ADD CONSTRAINT "cleaner_specialisation_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_log" ADD CONSTRAINT "communication_log_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "key" ADD CONSTRAINT "key_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;