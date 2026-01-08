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
CREATE TABLE "booking_addon" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"addon_id" text NOT NULL,
	"price_at_booking" numeric(10, 2) NOT NULL,
	"duration_at_booking" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_config" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
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
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "bedroom_count" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "bathroom_count" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "bedroom_count" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "bathroom_count" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "booking_addon" ADD CONSTRAINT "booking_addon_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_addon" ADD CONSTRAINT "booking_addon_addon_id_addon_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."addon"("id") ON DELETE no action ON UPDATE no action;