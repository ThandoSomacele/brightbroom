ALTER TABLE "cleaner_application" ADD COLUMN "work_radius" numeric(10, 2) DEFAULT '20';--> statement-breakpoint
ALTER TABLE "cleaner_application" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "cleaner_application" ADD COLUMN "tax_number" text;--> statement-breakpoint
ALTER TABLE "cleaner_application" ADD COLUMN "bank_account" text;--> statement-breakpoint
ALTER TABLE "cleaner_application" ADD COLUMN "pet_compatibility" text DEFAULT 'NONE';