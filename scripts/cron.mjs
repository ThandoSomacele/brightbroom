#!/usr/bin/env node
// scripts/cron.mjs
//
// Scheduled jobs for the self-hosted (Docker/Coolify) deployment. Plain Node,
// no dependencies. Run it as a Coolify Scheduled Task inside the app container:
//
//   node scripts/cron.mjs recurring   # 02:00 UTC daily: recurring subscription charges
//   node scripts/cron.mjs reminders   # 06:00 UTC daily: next-day booking reminders
//
// It does what netlify/functions/*-cron.js do on Netlify: calls the app's own
// endpoint with `Authorization: Bearer $CRON_SECRET_TOKEN`. Exits non-zero on
// any failure so Coolify marks the run as failed.

const JOBS = {
  recurring: { method: "POST", path: "/api/subscriptions/process-recurring" },
  reminders: { method: "GET", path: "/api/cron/send-reminders" },
};

const name = process.argv[2];
const job = JOBS[name];
if (!job) {
  console.error(`Usage: node scripts/cron.mjs <${Object.keys(JOBS).join("|")}>`);
  process.exit(2);
}

const token = process.env.CRON_SECRET_TOKEN;
if (!token) {
  // Both endpoints refuse (or should refuse) unauthenticated calls; fail loudly.
  console.error("[cron] CRON_SECRET_TOKEN is not set");
  process.exit(1);
}

const port = process.env.PORT || "3000";
const url = `http://127.0.0.1:${port}${job.path}`;
const started = Date.now();
console.log(`[cron] ${name}: ${job.method} ${url}`);

try {
  const response = await fetch(url, {
    method: job.method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(job.method === "POST" && { "Content-Type": "application/json" }),
    },
    // Recurring charges call PayFast per subscription; allow time for that.
    signal: AbortSignal.timeout(10 * 60 * 1000),
  });
  const body = await response.text();
  console.log(`[cron] ${name}: HTTP ${response.status} in ${Date.now() - started}ms`);
  console.log(body.slice(0, 4000));
  if (!response.ok) process.exit(1);
} catch (error) {
  console.error(`[cron] ${name} failed:`, error instanceof Error ? error.message : error);
  process.exit(1);
}
