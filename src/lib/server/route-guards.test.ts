// src/lib/server/route-guards.test.ts
import { describe, expect, it } from "vitest";
import { isPlatformOnlyAdminPath, requireAdmin, routingPath } from "./route-guards";

/** The HTTP status requireAdmin threw, or "passed" */
function statusOf(locals: Partial<App.Locals>, platformOnly = false): number | "passed" {
  try {
    requireAdmin(locals as App.Locals, { platformOnly });
    return "passed";
  } catch (e) {
    return (e as { status: number }).status;
  }
}

const as = (role: string, withTenant = false): Partial<App.Locals> => ({
  user: { id: "u1", role } as App.Locals["user"],
  tenant: withTenant ? ({ id: "t1" } as App.Locals["tenant"]) : null,
});

describe("routingPath", () => {
  it("decodes the path the way SvelteKit routes on it", () => {
    expect(routingPath("/%61dmin/x")).toBe("/admin/x");
    expect(routingPath("/%61%64%6d%69%6e/users/1")).toBe("/admin/users/1");
    expect(routingPath("/api/%61dmin/emails/recovery")).toBe("/api/admin/emails/recovery");
    expect(routingPath("/admin/x")).toBe("/admin/x");
  });

  it("leaves %25 and reserved characters encoded, as SvelteKit does", () => {
    // Double-encoded: SvelteKit does not route this to /admin either
    expect(routingPath("/%2561dmin/x")).toBe("/%2561dmin/x");
    expect(routingPath("/%2Fadmin")).toBe("/%2Fadmin");
  });

  it("returns a malformed path unchanged instead of throwing", () => {
    expect(() => routingPath("/%E0%A4%A")).not.toThrow();
    expect(routingPath("/%E0%A4%A")).toBe("/%E0%A4%A");
    expect(routingPath("/admin/%")).toBe("/admin/%");
  });
});

describe("requireAdmin", () => {
  it("answers 401 when signed out", () => {
    expect(statusOf({ user: null })).toBe(401);
    expect(statusOf({ user: null }, true)).toBe(401);
  });

  it("answers 403 for roles that are not admins", () => {
    expect(statusOf(as("CUSTOMER"))).toBe(403);
    expect(statusOf(as("CLEANER"))).toBe(403);
    expect(statusOf(as("CUSTOMER", true))).toBe(403);
  });

  it("lets platform admins in everywhere", () => {
    expect(statusOf(as("ADMIN"))).toBe("passed");
    expect(statusOf(as("ADMIN"), true)).toBe("passed");
  });

  it("lets tenant admins in only with a company, and never to platform-only areas", () => {
    expect(statusOf(as("TENANT_ADMIN", true))).toBe("passed");
    expect(statusOf(as("TENANT_ADMIN", false))).toBe(403);
    expect(statusOf(as("TENANT_ADMIN", true), true)).toBe(403);
  });

  it("returns the admin it checked", () => {
    const locals = as("ADMIN") as App.Locals;
    expect(requireAdmin(locals)).toBe(locals.user);
  });
});

describe("isPlatformOnlyAdminPath", () => {
  it("matches the platform-only areas and what is below them", () => {
    expect(isPlatformOnlyAdminPath("/admin/users")).toBe(true);
    expect(isPlatformOnlyAdminPath("/admin/users/123")).toBe(true);
    expect(isPlatformOnlyAdminPath("/admin/tenants/new")).toBe(true);
    expect(isPlatformOnlyAdminPath("/admin/bookings")).toBe(false);
    // Only on the decoded path: the raw one would slip past
    expect(isPlatformOnlyAdminPath(routingPath("/admin/%75sers/1"))).toBe(true);
  });
});
