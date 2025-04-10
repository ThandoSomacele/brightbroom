ALTER TABLE "cleaner_application" RENAME COLUMN "experience" TO "experience_types";--> statement-breakpoint
ALTER TABLE "cleaner_application" ADD COLUMN "latitude" numeric(10, 6);--> statement-breakpoint
ALTER TABLE "cleaner_application" ADD COLUMN "longitude" numeric(10, 6);--> statement-breakpoint
ALTER TABLE "cleaner_application" ADD COLUMN "formatted_address" text;--> statement-breakpoint
ALTER TABLE "cleaner_profile" ADD COLUMN "experience_types" json DEFAULT '[]'::json;