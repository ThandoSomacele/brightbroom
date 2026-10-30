// src/lib/server/admin-scope.ts
//
// Look up the record an admin action is about, and refuse it (404) unless
// this admin may act on it. The rule is the same as the admin pages' loads:
// a platform admin may act on anything, a tenant admin only on its own
// company's records. Call one of these at the top of every action or
// endpoint that takes a cleaner, application or booking id, before reading
// the form or touching S3.
import { error } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { booking, cleanerApplication, cleanerProfile, user } from "$lib/server/db/schema";
import { assertTenantAccess } from "$lib/server/route-guards";

/**
 * A cleaner this admin may manage. Only CLEANER accounts: these pages change
 * emails, passwords and activation, so an admin or customer id is refused.
 * A cleaner without a profile belongs to no company, so only a platform
 * admin may act on them.
 */
export async function getScopedCleaner(locals: App.Locals, userId: string | undefined) {
  if (!userId) throw error(404, "Cleaner not found");

  const [cleaner] = await db
    .select({ id: user.id, email: user.email, isActive: user.isActive })
    .from(user)
    .where(and(eq(user.id, userId), eq(user.role, "CLEANER")))
    .limit(1);
  if (!cleaner) throw error(404, "Cleaner not found");

  const [profile] = await db
    .select({ tenantId: cleanerProfile.tenantId })
    .from(cleanerProfile)
    .where(eq(cleanerProfile.userId, userId))
    .limit(1);

  assertTenantAccess(locals, profile?.tenantId ?? null);
  return { ...cleaner, tenantId: profile?.tenantId ?? null, hasProfile: Boolean(profile) };
}

/** A cleaner application this admin may manage */
export async function getScopedApplication(locals: App.Locals, applicationId: string | undefined) {
  if (!applicationId) throw error(404, "Application not found");

  const [application] = await db
    .select({ id: cleanerApplication.id, tenantId: cleanerApplication.tenantId })
    .from(cleanerApplication)
    .where(eq(cleanerApplication.id, applicationId))
    .limit(1);
  if (!application) throw error(404, "Application not found");

  assertTenantAccess(locals, application.tenantId);
  return application;
}

/**
 * A booking this admin may manage, by the company that owns it
 * (booking.tenant_id). Never by the assigned cleaner's company: that would
 * let a company take over a platform booking by assigning its own cleaner.
 */
export async function getScopedBooking(locals: App.Locals, bookingId: string | undefined) {
  if (!bookingId) throw error(404, "Booking not found");

  const [found] = await db
    .select({ id: booking.id, tenantId: booking.tenantId })
    .from(booking)
    .where(eq(booking.id, bookingId))
    .limit(1);
  if (!found) throw error(404, "Booking not found");

  assertTenantAccess(locals, found.tenantId);
  return found;
}
