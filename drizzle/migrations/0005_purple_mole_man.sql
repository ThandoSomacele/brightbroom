ALTER TABLE "booking" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ALTER COLUMN "address_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "guest_name" text;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "guest_email" text;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "guest_phone" text;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "guest_address" json;