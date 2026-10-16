// src/routes/api/health/+server.ts
//
// Liveness/readiness probe for the self-hosted (Docker/Coolify) deployment:
// the Dockerfile HEALTHCHECK and Coolify's health check call it. 200 when the
// app can reach its database, 503 otherwise. Public on purpose: no auth, and
// the response never includes error details, hostnames or versions.
// GET only, so the CSRF hook (which checks state-changing methods) lets it through.
import { json } from "@sveltejs/kit";
import { sql } from "drizzle-orm";
import { db } from "$lib/server/db";
import type { RequestHandler } from "./$types";

const DB_TIMEOUT_MS = 3000;

export const GET: RequestHandler = async () => {
  const headers = { "cache-control": "no-store" };
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      db.execute(sql`select 1`),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("database timeout")), DB_TIMEOUT_MS);
      }),
    ]);
    return json({ status: "ok" }, { headers });
  } catch (err) {
    // Logged server-side only; the caller just learns it's unhealthy.
    console.error("Health check failed:", err instanceof Error ? err.message : err);
    return json({ status: "error" }, { status: 503, headers });
  } finally {
    clearTimeout(timer);
  }
};
