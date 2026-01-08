CREATE TABLE "subscription_addon" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text NOT NULL,
	"addon_id" text NOT NULL,
	"price_at_subscription" numeric(10, 2) NOT NULL,
	"duration_at_subscription" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscription_addon" ADD CONSTRAINT "subscription_addon_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_addon" ADD CONSTRAINT "subscription_addon_addon_id_addon_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."addon"("id") ON DELETE no action ON UPDATE no action;