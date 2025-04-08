ALTER TABLE "cleaner_application" ADD COLUMN "profile_image_url" text;--> statement-breakpoint
ALTER TABLE "cleaner_profile" ADD COLUMN "profile_image_url" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;