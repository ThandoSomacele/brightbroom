// src/lib/server/route-guards.ts
import { error } from "@sveltejs/kit";
import type { User } from "$lib/server/db/schema";

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

/**
 * Admin areas for platform admins only; tenant admins get a 403. Keep this in
 * sync with the `platformOnly` nav items in admin/+layout.svelte.
 */
const PLATFORM_ONLY_ADMIN_PATHS = [
  "/admin/tenants",
  "/admin/pricing",
  "/admin/users",
  "/admin/services",
];

/** True for a platform-only admin area. Pass the routingPath, not the raw pathname */
export function isPlatformOnlyAdminPath(path: string): boolean {
  return PLATFORM_ONLY_ADMIN_PATHS.some((p) => path.startsWith(p));
}

/**
 * The signed-in admin, or a 401 (signed out) / 403 (not allowed).
 *
 * Platform admins (ADMIN) always pass. Tenant admins (TENANT_ADMIN) pass when
 * they belong to a company, unless the area is platform-only. Call it first
 * in every admin load, form action and /api/admin handler: the hook guards by
 * path and the admin layout's load does not run for form actions, so neither
 * alone protects an action.
 */
export function requireAdmin(
  locals: App.Locals,
  { platformOnly = false }: { platformOnly?: boolean } = {},
): User {
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
  return user;
}
