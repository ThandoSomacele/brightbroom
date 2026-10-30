CREATE TABLE "service_area" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lat" numeric(10, 6) NOT NULL,
	"lng" numeric(10, 6) NOT NULL,
	"radius_km" numeric(5, 2) DEFAULT '15.00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_area_name_unique" UNIQUE("name")
);
