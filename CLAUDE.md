# BrightBroom

Cleaning-service booking marketplace (brightbroom.com): customers book and pay via PayFast, cleaners get assigned. Multi-tenant (cleaning companies onboard as tenants) and white-label: the same code runs single-company client sites (`docs/SELF_HOSTING.md`).

Topic rules load automatically from `.claude/rules/` when you touch matching files: migrations, payments, auth and tenancy, service areas, Netlify and build, magazine. `/new-worktree <name>` sets up a feature worktree.

## Commands
```bash
pnpm dev
pnpm check                 # svelte-check
pnpm lint                  # zero warnings; lint:fix, format, format:check
pnpm test                  # vitest; pnpm test -- path/to/test.ts for one file
pnpm db:start / db:stop    # local Postgres in Docker
pnpm db:migrate            # apply committed migrations
pnpm db:introspect         # read-only audit vs schema.ts (DATABASE_URL_PRODUCTION for prod)
pnpm db:backup:full        # before any migration
pnpm db:seed               # demo data (also :users, :services, :tenants, :coupons, …)
pnpm deploy:check && pnpm deploy:validate-env
```
Data-maintenance scripts (`services:*`, `update:*-coordinates`, `db:deduplicate`, `scripts/db/*`): see `package.json` and each script's header.

## Stack
SvelteKit (Svelte 5), TypeScript strict, Tailwind (primary teal #20C3AF, secondary orange #C2511F), Drizzle + Postgres (Neon), custom session auth on oslo with Argon2id (the `lucia` package is installed but unused), Resend (`src/lib/server/email-templates.ts`, `email-service.ts`), PayFast, Google Maps, AWS S3 via `src/lib/server/s3.ts` (presigned URLs; documents served through `/api/documents`), PostHog (EU, proxied at `/relay-VjWm`), Netlify. Env var names: `.env.example`.

## Rules
- **Never run `pnpm db:generate`.** Schema changes are hand-written idempotent SQL; see `.claude/rules/migrations.md`.
- Two products, two repos: ZapZuba (driver marketplace, self-hosted on Coolify) is remote `driver`. Never `git merge` from it; carry fixes with `git cherry-pick -n <sha>`, review the diff, never take `drizzle/`.
- Roles: CUSTOMER, CLEANER, ADMIN, TENANT_ADMIN. `/admin/*` needs ADMIN, `/cleaner/*` needs CLEANER. Admin actions start with `requireAdmin(locals)` and scope records via `src/lib/server/admin-scope.ts`.
- White-label: business details come from `brand` (`src/lib/config/brand.ts`), never literals. BrightBroom-only pages, platform-only admin areas and menus are listed in `src/lib/config/site-routes.ts`.
- Validate all input on the server (Zod in form actions); honeypot field (`HoneypotField.svelte`) on public forms.
- Money/decimal columns are strings: convert with `Number()`.
- Types from the schema: `$inferSelect` / `$inferInsert`, exported from `src/lib/server/db/schema.ts`.
- `$lib/` imports. Server-only code in `src/lib/server/` or `+page.server.ts`. Client env vars prefixed `VITE_` or `PUBLIC_`.
- Never create a `_redirects` file (breaks the Netlify build).
- Follow existing component patterns (`src/lib/components/<feature>/`) and extend existing email templates.
