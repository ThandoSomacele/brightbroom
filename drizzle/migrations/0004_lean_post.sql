CREATE TYPE "public"."ApplicationStatus" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "cleaner_application" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"city" text NOT NULL,
	"experience" text NOT NULL,
	"availability" text NOT NULL,
	"own_transport" boolean DEFAULT false NOT NULL,
	"whats_app" boolean DEFAULT false NOT NULL,
	"id_type" text,
	"id_number" text,
	"referral_source" text,
	"documents" text[],
	"status" "ApplicationStatus" DEFAULT 'PENDING' NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
