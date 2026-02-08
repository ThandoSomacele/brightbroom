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
