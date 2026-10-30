# Self-hosting a client on Coolify

One deployment per cleaning company: its own app container, PostgreSQL and
Redis, on a VPS managed by [Coolify](https://coolify.io). The Netlify demo
(brightbroom.com) is unaffected: it builds with adapter-netlify whenever
`DEPLOY_TARGET` is unset and keeps using `drizzle/migrations`.

How the pieces fit:

- `Dockerfile` builds with `DEPLOY_TARGET=node` (adapter-node) and runs
  `scripts/docker/start.sh` as a non-root user on port 3000.
- On every start, `start.sh` applies `drizzle/fresh` (a baseline of the current
  schema plus default rows), then runs `node build`. Applied migrations are
  skipped. Set `RUN_MIGRATIONS=false` to turn this off.
- `GET /api/health` returns 200 when the database answers and 503 when it
  doesn't. The Docker `HEALTHCHECK` uses it, and Coolify can too.
- `scripts/cron.mjs` runs the two daily jobs from inside the container.

> `drizzle/fresh` is only for **new** client databases. Never run it against
> the demo database. `scripts/db/seed-client.ts` refuses any database that
> wasn't built from it.

## 1. Create the resources (in one Coolify project per client)

1. **PostgreSQL** (16 or newer). Copy its *internal* connection URL.
2. **Redis**. Copy its *internal* URL.
3. **Application**: point it at this repository (the release branch) and set:
   - Build pack: **Dockerfile**. Port: **3000**.
   - Domain: the client's domain, e.g. `https://book.company.co.za`.
   - Health check: path `/api/health`, port 3000.
   - Environment variables: see section 2. Tick **Build Variable** only on the
     variables marked *build*.

## 2. Environment variables

**Required**

| Variable | Value |
|---|---|
| `DATABASE_URL` | Internal URL of the client's PostgreSQL |
| `ORIGIN` | Public URL, e.g. `https://book.company.co.za`. If this is missing or wrong, every form post is refused. |
| `PUBLIC_URL` | Same public URL, used in emails and PayFast return/notify URLs |
| `PUBLIC_PLATFORM_MODE` | `single` (one company: the marketplace sign-up and vetting are off) |
| `CRON_SECRET_TOKEN` | Long random string (`openssl rand -hex 32`). Required by both cron endpoints. |

**Brand (runtime, `PUBLIC_*`; see `src/lib/config/brand.ts`)**. In single mode
nothing falls back to BrightBroom's details: an unset value shows blank, and the
server logs `[brand] Single-company mode is missing: …` at startup. Set them all:
`PUBLIC_BRAND_NAME`, `PUBLIC_BRAND_LEGAL_NAME`, `PUBLIC_BRAND_REG_NUMBER`,
`PUBLIC_BRAND_TAGLINE`, `PUBLIC_SUPPORT_EMAIL`, `PUBLIC_HELP_EMAIL` (optional:
defaults to the support email), `PUBLIC_SUPPORT_PHONE`, `PUBLIC_BRAND_ADDRESS`,
`PUBLIC_INFORMATION_OFFICER`, `PUBLIC_BRAND_LOGO_URL`.

Optional: `PUBLIC_SUPPORT_HOURS` (shown on the contact page, e.g.
`Monday–Friday: 8am – 5pm`), `PUBLIC_BRAND_OG_IMAGE` (the picture shown when a
page is shared; absolute or site-relative URL) and `PUBLIC_VAT_NUMBER`. Set the
VAT number only if the company is VAT-registered: prices are then described as
including VAT and receipts show the VAT in them. Without it, VAT is not
mentioned anywhere.

**Build variables**. These are compiled into the bundle, so a change only takes
effect after a rebuild.

| Variable | Value |
|---|---|
| `VITE_SITE_URL` | Public URL (canonical/SEO links; defaults to brightbroom.com) |
| `VITE_GOOGLE_MAPS_API_KEY` | Browser Maps key, restricted to the client's domain |
| `BRAND_PRIMARY`, `BRAND_SECONDARY` | Hex colours, e.g. `#1E6091`. Also set them at runtime so emails match. |

**Analytics (optional, runtime)**: `PUBLIC_POSTHOG_KEY` and
`PUBLIC_POSTHOG_UI_HOST` for PostHog, `PUBLIC_GTM_ID` for Google Tag Manager.
Leave them unset for none; a client never inherits BrightBroom's containers.

**PayFast**: `PAYFAST_MERCHANT_ID` and `PAYFAST_MERCHANT_KEY` (required),
`PAYFAST_PASSPHRASE` (if the account has one), `PAYFAST_API_KEY` (subscription
API) and `PAYFAST_SANDBOX_MODE=false` for live payments. **Sandbox is the
default** when this is unset.

**Email (Resend)**: `RESEND_API_KEY` and `EMAIL_FROM` (required; on a domain
verified in Resend, e.g. `Company <bookings@company.co.za>`; the server logs
`[email] Single-company mode is missing: …` until both are set), plus
`ADMIN_BOOKINGS_EMAIL` and `RECRUITMENT_EMAIL` for the internal notifications
(both default to `PUBLIC_SUPPORT_EMAIL`; nothing goes to BrightBroom).

**File storage (S3 or S3-compatible: MinIO, R2, Wasabi)**: `S3_BUCKET_NAME`,
`AWS_S3_ACCESS_KEY_ID`, `AWS_S3_SECRET_ACCESS_KEY`, `AWS_S3_REGION`. For a
non-AWS provider, also set `S3_ENDPOINT` and `S3_FORCE_PATH_STYLE=true` (MinIO).
Use one private bucket per client.

**Redis**: `REDIS_URL` (internal URL) and `REDIS_KEY_PREFIX` (default `bb:`).
The prefix must be unique per client if several clients share one Redis.

**Already set in the image (override only if needed)**: `NODE_ENV=production`
(required: PayFast signature checks depend on it), `PORT=3000`,
`ADDRESS_HEADER=X-Forwarded-For`, `XFF_DEPTH=1` (use 2 if Cloudflare proxies in
front of Coolify), `BODY_SIZE_LIMIT=12M` (document uploads).

**Optional**: `RUN_MIGRATIONS=false`, `PUBLIC_BOOKINGS_PAUSED=true`.

## 3. Scheduled tasks

In the application's **Scheduled Tasks**, add two tasks that run in the app
container. They use the same times as `netlify.toml`, assuming the server's
timezone is UTC (Coolify's default):

| Name | Command | Frequency |
|---|---|---|
| recurring-charges | `node scripts/cron.mjs recurring` | `0 2 * * *` (02:00 UTC) |
| booking-reminders | `node scripts/cron.mjs reminders` | `0 6 * * *` (06:00 UTC = 08:00 SAST) |

Each task calls the app on `127.0.0.1:$PORT` with `CRON_SECRET_TOKEN`, logs the
response and exits non-zero on failure, so Coolify shows the run as failed.

## 4. First run

1. Deploy. The first start creates the schema and default rows: pricing,
   the `general-clean` service, and the company as the platform-owner tenant.
2. Create the first admin. Add `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`
   (12+ characters; optional `SEED_ADMIN_FIRST_NAME` / `SEED_ADMIN_LAST_NAME`)
   to the app's variables, redeploy, then open the app's **Terminal** in Coolify
   and run:

   ```sh
   node_modules/.bin/tsx scripts/db/seed-client.ts
   ```

   This also copies the brand name and contact details onto the company's
   tenant record and adds the default booking add-ons if there are none
   (`SEED_DEFAULT_ADDONS=false` skips them). Running it again is safe: it never
   changes an existing user or password. Afterwards, remove
   `SEED_ADMIN_PASSWORD` from the variables.
3. Log in at `/auth/login`. Add the company's service areas in
   `/admin/service-areas` (until there is at least one, every address is
   refused and the dashboard says so), then set prices and add-ons in
   `/admin/pricing`.
4. In the PayFast dashboard, check that the account's notify URL is allowed for
   the client's domain. The app sends `PUBLIC_URL` + `/api/payments/ipn`.

## 5. Backups

On each client's PostgreSQL resource, open **Backups** and enable scheduled
backups (for example daily at `0 1 * * *`) to an S3-compatible destination
configured under **Settings → S3 Storages**. Set a retention policy, and do a
test restore into a scratch database before the client goes live. The file
bucket needs its own backup or versioning; Coolify only backs up the database.

## 6. Updating every client to a new release

1. Merge to the release branch that the client apps track, and make sure the
   default (Netlify) build still passes.
2. **If the schema changed**, ship the change twice: the usual hand-written,
   idempotent migration in `drizzle/migrations` for the demo, **and**
   `pnpm db:fresh:generate` for `drizzle/fresh`. The second diffs
   `schema.ts` against the last snapshot in `drizzle/fresh/meta`, so it
   produces only the change. Review the SQL before committing it. Keep changes
   additive, because a rollback redeploys the old image but does not undo
   migrations.
3. Redeploy each client app, either through Coolify's auto-deploy webhook or
   with **Redeploy** per app, or via the Coolify API in a loop. Each container
   applies any new fresh migrations on start, before it serves traffic.
4. Check `/api/health` and the next run of each scheduled task.

## Local check of the Node build

```sh
createdb client_test
DATABASE_URL=postgres://…/client_test pnpm db:fresh:migrate
DEPLOY_TARGET=node pnpm build
DATABASE_URL=postgres://…/client_test ORIGIN=http://localhost:3000 PUBLIC_PLATFORM_MODE=single node build
```
