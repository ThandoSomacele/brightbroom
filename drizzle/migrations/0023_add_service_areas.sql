-- Migration: Add service_area, so each site manages its own service areas
-- Created: 2026-10-30
--
-- Service areas were a hard-coded list (BrightBroom's suburbs) and then an
-- env setting. They now live in this table and are edited in
-- /admin/service-areas. Each area is a circle: a centre and a radius in km.
-- Additive and safe to run on a live database; re-running changes nothing.
--
-- The rows are BrightBroom's own areas, exactly as the code had them (15 km
-- each). This migration only runs on the demo database (brightbroom.com);
-- client databases are built from drizzle/fresh, which creates the table
-- empty for the company to fill in.

CREATE TABLE IF NOT EXISTS "service_area" (
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
);--> statement-breakpoint

-- No conflict target: a row is skipped if either its id or its name exists
INSERT INTO "service_area" ("id", "name", "lat", "lng", "radius_km", "is_active", "sort_order") VALUES
  ('sa-fourways', 'Fourways', -26.0274, 28.0106, 15.00, true, 10),
  ('sa-bryanston', 'Bryanston', -26.0525, 28.0074, 15.00, true, 20),
  ('sa-randburg', 'Randburg', -26.1063, 27.9947, 15.00, true, 30),
  ('sa-midrand', 'Midrand', -25.9992, 28.1182, 15.00, true, 40),
  ('sa-north-riding', 'North Riding', -26.0469, 27.951, 15.00, true, 50),
  ('sa-sandton', 'Sandton', -26.1076, 28.0567, 15.00, true, 60),
  ('sa-alexandra', 'Alexandra', -26.1044, 28.1, 15.00, true, 70),
  ('sa-cosmo-city', 'Cosmo City, Roodepoort', -26.0212639, 27.9289995, 15.00, true, 80),
  ('sa-diepsloot', 'Diepsloot', -25.9412555, 27.96671, 15.00, true, 90),
  ('sa-honeydew', 'Honeydew', -26.0225, 27.9475, 15.00, true, 100),
  ('sa-monaghan-farm', 'Monaghan Farm, Centurion', -25.904442, 27.454882, 15.00, true, 110)
ON CONFLICT DO NOTHING;
