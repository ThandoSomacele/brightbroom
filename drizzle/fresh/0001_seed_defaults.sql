-- Fresh-install defaults for a self-hosted client database (./drizzle/fresh only).
-- Written by hand. Every statement is idempotent, so a re-run changes nothing,
-- and nothing here overwrites a value an admin has since edited.
--
-- 1. Indexes the demo database has from hand-written migrations
--    (0012, 0018, 0019, 0020, 0021) but that schema.ts does not declare, so the
--    generated baseline lacks them. Kept here for query-plan parity. If one
--    is later declared in schema.ts, keep the same name and make the generated
--    CREATE INDEX "IF NOT EXISTS", or it fails on databases built from this file.
-- 2. Rows the application expects to exist.

-- 1. Indexes -----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_cleaner_payout_summary_cleaner_id" ON "cleaner_payout_summary" ("cleaner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_booking_id" ON "payment" ("booking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_is_paid_to_provider" ON "payment" ("is_paid_to_provider");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_is_paid_to_tenant_idx" ON "payment" ("is_paid_to_tenant");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "booking_tenant_id_idx" ON "booking" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cleaner_profile_tenant_id_idx" ON "cleaner_profile" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cleaner_profile_work_auth_expiry_idx" ON "cleaner_profile" ("work_auth_expiry");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cleaner_application_tenant_id_idx" ON "cleaner_application" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tenant_member_user_id_idx" ON "tenant_member" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tenant_verification_status_idx" ON "tenant" ("verification_status");--> statement-breakpoint

-- 2. Default rows ------------------------------------------------------------

-- Room-based pricing. The booking flow, /admin/pricing and the payout maths all
-- read the row with id 'default'. Same figures as the code's own fallbacks
-- (src/routes/book/+page.server.ts) and scripts/db/seed-pricing.ts. Commission
-- and PayFast fees keep their column defaults (payfast_fees NULL = the
-- application defaults in payout-calculator.ts). Adjust in /admin/pricing.
INSERT INTO "pricing_config" (
	"id", "base_price", "base_duration_minutes", "base_description",
	"bedroom_price", "bedroom_duration_minutes", "bedroom_min", "bedroom_max",
	"bathroom_price", "bathroom_duration_minutes", "bathroom_min", "bathroom_max"
) VALUES (
	'default', '130.00', 120, 'Living Room and Kitchen cleaning included',
	'50.00', 60, 1, 10,
	'50.00', 60, 1, 6
) ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint

-- Every booking from /book references service 'general-clean' (booking.service_id
-- is a foreign key), so it must exist before the first booking.
INSERT INTO "service" ("id", "name", "description", "base_price", "duration_hours", "is_active", "sort_order", "details")
VALUES (
	'general-clean',
	'General Clean',
	'Customizable room-based cleaning. Includes Living Room and Kitchen with every clean. Add bedrooms, bathrooms, and optional addons.',
	'130.00', 2, true, 0,
	'{"type":"room-based","standardIncludes":["Living Room","Kitchen"],"description":"Build your perfect clean by selecting bedrooms, bathrooms, and optional addons."}'
) ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint

-- The company running this deployment, as the platform-owner tenant. Payouts,
-- approved cleaners and applications attach to the platform owner. Created
-- with placeholder details; scripts/db/seed-client.ts fills in the name and
-- contact details from the PUBLIC_BRAND_* settings. Skipped if a platform
-- owner already exists. commission_rate keeps its column default (15.00, as on
-- the demo's own tenant): the company's share of its own bookings before the
-- cleaner's payout; editable later.
INSERT INTO "tenant" ("id", "name", "slug", "is_active", "is_platform_owner", "verification_status", "verified_at")
SELECT 'platform-tenant', 'Platform', 'platform', true, true, 'APPROVED', now()
WHERE NOT EXISTS (SELECT 1 FROM "tenant" WHERE "is_platform_owner" = true)
ON CONFLICT DO NOTHING;
