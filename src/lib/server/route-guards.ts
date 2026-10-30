// src/lib/server/route-guards.ts
import { error } from "@sveltejs/kit";
import type { SessionUser } from "$lib/server/auth";

/**
 * The path SvelteKit routes on.
 *
 * event.url.pathname is still percent-encoded, but SvelteKit decodes it (all
 * but %25) before matching routes, so "/%61dmin/users" is served by
 * /admin/users. A guard that checks the raw pathname lets that through: a
 * signed-out POST to /%61dmin/users/<id>?/updateUser ran the action. Every
 * path check in hooks.server.ts must use this instead.
 *
 * Same decoding as SvelteKit's decode_pathname. A malformed escape comes back
 * unchanged: SvelteKit answers that request with a 400 itself, whereas
 * throwing here, inside handle, left an unhandled rejection that crashed the
 * server.
 */
export function routingPath(pathname: string): string {
  try {
    return pathname.split("%25").map(decodeURI).join("%25");
  } catch {
    return pathname;
  }
}

// The platform-only list lives with the other route lists, so the admin menu
// and this guard can't drift apart
export { isPlatformOnlyAdminPath } from "$lib/config/site-routes";

/**
 * The signed-in admin, or a 401 (signed out) / 403 (not allowed).
 *
 * Platform admins (ADMIN) always pass. Tenant admins (TENANT_ADMIN) pass only
 * when their company is approved and active, and never into a platform-only
 * area. Call it first in every admin load, form action and /api/admin
 * handler: the hook guards by path and the admin layout's load does not run
 * for form actions, so neither alone protects an action.
 */
export function requireAdmin(
  locals: App.Locals,
  { platformOnly = false }: { platformOnly?: boolean } = {},
): SessionUser {
  const user = locals.user;
  if (!user) {
    throw error(401, "Authentication required");
  }
  if (user.role === "ADMIN") {
    return user;
  }
  if (user.role !== "TENANT_ADMIN") {
    throw error(403, "You don't have permission to access this area");
  }
  if (platformOnly) {
    throw error(403, "This area is restricted to platform administrators");
  }
  if (!locals.tenant) {
    throw error(403, "No tenant association found for your account");
  }
  // A company that signed itself up is not trusted until it has been vetted
  if (locals.tenant.verificationStatus !== "APPROVED" || !locals.tenant.isActive) {
    throw error(403, "Your company has not been approved yet");
  }
  return user;
}

/**
 * Which company's records this admin may see: null for a platform admin (all
 * of them), the company id for a tenant admin. Fails closed: a tenant admin
 * without a company never gets null, which would mean "everything".
 */
export function adminTenantScope(locals: App.Locals): string | null {
  const user = requireAdmin(locals);
  if (user.role === "ADMIN") return null;
  if (!locals.tenant) throw error(403, "No tenant association found for your account");
  return locals.tenant.id;
}

/**
 * 404 unless this admin may act on a record owned by recordTenantId. Platform
 * admins may act on anything; a tenant admin only on its own company's
 * records. A record with no company (null) is a platform record. It answers
 * 404 rather than 403 so another company's ids can't be probed.
 */
export function assertTenantAccess(
  locals: App.Locals,
  recordTenantId: string | null | undefined,
): void {
  const scope = adminTenantScope(locals);
  if (scope === null) return;
  if (recordTenantId !== scope) throw error(404, "Not found");
}
