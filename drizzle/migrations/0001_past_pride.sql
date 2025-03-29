ALTER TABLE "service" ADD COLUMN "details" text;--> statement-breakpoint
ALTER TABLE "service" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;