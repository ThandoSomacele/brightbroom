---
paths:
  - "drizzle/**"
  - "drizzle*.config.ts"
  - "src/lib/server/db/**"
  - "scripts/db/**"
  - "netlify/scripts/deploy-db.sh"
---
# Migrations

- Schema changes ship as **hand-written idempotent SQL** in `drizzle/migrations/`. Follow the 0017+ files: `IF NOT EXISTS`, `DO $$ … duplicate_object` guards, `--> statement-breakpoint` between statements, and a hand-added entry in `meta/_journal.json`. Enum value additions go in their own file.
- **Do not run `db:generate`.** The journal history is broken (missing 0007, duplicate 0009s, snapshots frozen at 0016) and can't diff cleanly. `db:push` is for throwaway local databases only.
- Before writing or applying a migration: audit the target read-only with `pnpm db:introspect` (set `DATABASE_URL_PRODUCTION` for prod; the prod ledger must equal the journal), then back up with `pnpm db:backup:full`.
- The journal ends at `0023_add_service_areas` (`when` 1793300000000). New migrations are `0024+`, cleaning-named, with a `when` above that.
- Client databases use `drizzle/fresh` (`pnpm db:fresh:generate`, single baseline). Ship every schema change in **both** trees. Never point `drizzle.fresh.config.ts` at the demo DB.
- Migrations `0023_add_driver_role` to `0026_add_trip_handover` belong to the driver product (tag `split/driver-marketplace`) and must never be applied here.
- Ledger short but schema present: `pnpm db:migrate:rebaseline --apply --through <last-applied-tag>`.
- Netlify's `deploy-db.sh` applies committed migrations on every context, production included; nothing generates them on deploy.
- `scripts/db/*` use no dotenv on purpose: pass `DATABASE_URL` explicitly.
