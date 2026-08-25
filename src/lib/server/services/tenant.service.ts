// src/lib/server/services/tenant.service.ts
import { db } from "$lib/server/db";
import {
  tenant,
  tenantMember,
  user,
  cleanerProfile,
  type Tenant,
  type NewTenant,
  type TenantMember,
} from "$lib/server/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Tenant service for managing tenants (cleaning companies) on the marketplace
 */
export const tenantService = {
  /**
   * Get tenant by ID
   */
  async getById(id: string): Promise<Tenant | null> {
    const [result] = await db
      .select()
      .from(tenant)
      .where(eq(tenant.id, id))
      .limit(1);
    return result || null;
  },

  /**
   * Get tenant by slug
   */
  async getBySlug(slug: string): Promise<Tenant | null> {
    const [result] = await db
      .select()
      .from(tenant)
      .where(eq(tenant.slug, slug))
      .limit(1);
    return result || null;
  },

  /**
   * Get the platform owner tenant (BrightBroom)
   */
  async getPlatformOwner(): Promise<Tenant | null> {
    const [result] = await db
      .select()
      .from(tenant)
      .where(eq(tenant.isPlatformOwner, true))
      .limit(1);
    return result || null;
  },

  /**
   * Get all active tenants
   */
  async getAllActive(): Promise<Tenant[]> {
    return db
      .select()
      .from(tenant)
      .where(eq(tenant.isActive, true));
  },

  /**
   * Get all tenants (admin only)
   */
  async getAll(): Promise<Tenant[]> {
    return db.select().from(tenant);
  },

  /**
   * Create a new tenant
   */
  async create(data: NewTenant): Promise<Tenant> {
    const [result] = await db.insert(tenant).values(data).returning();
    return result;
  },

  /**
   * Update a tenant
   */
  async update(
    id: string,
    data: Partial<Omit<NewTenant, "id">>,
  ): Promise<Tenant | null> {
    const [result] = await db
      .update(tenant)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tenant.id, id))
      .returning();
    return result || null;
  },

  /**
   * Get tenant for a user (via tenantMember)
   */
  async getTenantForUser(
    userId: string,
  ): Promise<(TenantMember & { tenant: Tenant }) | null> {
    const result = await db
      .select({
        id: tenantMember.id,
        tenantId: tenantMember.tenantId,
        userId: tenantMember.userId,
        role: tenantMember.role,
        createdAt: tenantMember.createdAt,
        tenant: tenant,
      })
      .from(tenantMember)
      .innerJoin(tenant, eq(tenantMember.tenantId, tenant.id))
      .where(eq(tenantMember.userId, userId))
      .limit(1);

    if (result.length === 0) return null;

    const row = result[0];
    return {
      id: row.id,
      tenantId: row.tenantId,
      userId: row.userId,
      role: row.role,
      createdAt: row.createdAt,
      tenant: row.tenant,
    };
  },

  /**
   * Add a user as a member of a tenant
   */
  async addMember(
    tenantId: string,
    userId: string,
    role: "OWNER" | "ADMIN" | "MANAGER" = "ADMIN",
  ): Promise<TenantMember> {
    const [result] = await db
      .insert(tenantMember)
      .values({
        id: crypto.randomUUID(),
        tenantId,
        userId,
        role,
      })
      .returning();
    return result;
  },

  /**
   * Remove a member from a tenant
   */
  async removeMember(tenantId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(tenantMember)
      .where(
        and(
          eq(tenantMember.tenantId, tenantId),
          eq(tenantMember.userId, userId),
        ),
      );
    return (result?.length ?? 0) > 0;
  },

  /**
   * Get all members of a tenant
   */
  async getMembers(tenantId: string) {
    return db
      .select({
        member: tenantMember,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
        },
      })
      .from(tenantMember)
      .innerJoin(user, eq(tenantMember.userId, user.id))
      .where(eq(tenantMember.tenantId, tenantId));
  },

  /**
   * Get cleaner count for a tenant
   */
  async getCleanerCount(tenantId: string): Promise<number> {
    const result = await db
      .select()
      .from(cleanerProfile)
      .where(eq(cleanerProfile.tenantId, tenantId));
    return result.length;
  },

  /**
   * Turn a company name into a URL-safe slug that is not already taken.
   *
   * Self-serve signup means we cannot ask the company to pick a unique slug,
   * so collisions are resolved by appending a counter.
   */
  async generateUniqueSlug(companyName: string): Promise<string> {
    const base =
      companyName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "company";

    let candidate = base;
    let suffix = 2;

    // Bounded so a pathological run of collisions cannot spin forever
    while (suffix < 100) {
      const existing = await this.getBySlug(candidate);
      if (!existing) return candidate;
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }

    return `${base}-${crypto.randomUUID().slice(0, 8)}`;
  },

  /**
   * The commission rate to charge on a tenant's bookings, as a fraction
   * (0.15 for 15%).
   *
   * Tenants negotiate their own rate, stored as a percentage string ("15.00").
   * Returns undefined when there is no tenant or the stored value is unusable,
   * so callers fall back to PLATFORM_COMMISSION_RATE rather than charging
   * something nonsensical.
   */
  async getCommissionRate(
    tenantId: string | null | undefined,
  ): Promise<number | undefined> {
    return (await this.getPayoutTerms(tenantId)).commissionRate;
  },

  /**
   * Everything needed to split a booking's money, in one query.
   *
   * `isPlatformOwner` decides who the money left after commission belongs to:
   * the cleaner directly on the platform's own bookings, or the cleaning
   * company on everyone else's. It defaults to true when there is no tenant so
   * an unscoped booking behaves the way it always has.
   */
  async getPayoutTerms(
    tenantId: string | null | undefined,
  ): Promise<{ commissionRate: number | undefined; isPlatformOwner: boolean }> {
    if (!tenantId) return { commissionRate: undefined, isPlatformOwner: true };

    const [row] = await db
      .select({
        commissionRate: tenant.commissionRate,
        isPlatformOwner: tenant.isPlatformOwner,
      })
      .from(tenant)
      .where(eq(tenant.id, tenantId))
      .limit(1);

    if (!row) {
      console.warn(`No tenant found for ${tenantId}. Falling back to platform terms.`);
      return { commissionRate: undefined, isPlatformOwner: true };
    }

    const percent = Number(row.commissionRate);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      console.warn(
        `Unusable commission rate for tenant ${tenantId}: ${row.commissionRate}. Falling back to the platform rate.`,
      );
      return { commissionRate: undefined, isPlatformOwner: row.isPlatformOwner };
    }

    return { commissionRate: percent / 100, isPlatformOwner: row.isPlatformOwner };
  },

  /**
   * Resolve which tenant a booking belongs to.
   *
   * A booking is fulfilled by the company the assigned cleaner works for. When
   * no cleaner is assigned yet (the common case at checkout) we fall back to
   * the platform owner so bookings are never left unscoped and therefore
   * invisible to every tenant-scoped admin view.
   */
  async resolveBookingTenantId(
    cleanerId?: string | null,
  ): Promise<string | null> {
    if (cleanerId) {
      const [profile] = await db
        .select({ tenantId: cleanerProfile.tenantId })
        .from(cleanerProfile)
        .where(eq(cleanerProfile.userId, cleanerId))
        .limit(1);

      if (profile?.tenantId) return profile.tenantId;
    }

    const platformOwner = await this.getPlatformOwner();
    return platformOwner?.id ?? null;
  },

  /**
   * Check if a user is an admin/owner of a specific tenant
   */
  async isUserTenantAdmin(
    userId: string,
    tenantId: string,
  ): Promise<boolean> {
    const [result] = await db
      .select()
      .from(tenantMember)
      .where(
        and(
          eq(tenantMember.userId, userId),
          eq(tenantMember.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (!result) return false;
    return result.role === "OWNER" || result.role === "ADMIN";
  },
};
