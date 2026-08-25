// src/lib/server/services/tenant.service.ts
import { db } from "$lib/server/db";
import {
  booking,
  payment,
  tenant,
  tenantDocument,
  tenantMember,
  user,
  cleanerProfile,
  type Tenant,
  type NewTenant,
  type TenantDocument,
  type TenantMember,
} from "$lib/server/db/schema";
import { and, eq, isNotNull, sql } from "drizzle-orm";

/**
 * Documents a cleaning company can supply during verification.
 *
 * `required` marks the ones that gate activation. Every type here stays
 * uploadable regardless, so a reviewer can ask for an optional one when a
 * company needs a closer look.
 */
export const TENANT_DOCUMENT_TYPES = [
  {
    type: "DIRECTOR_ID",
    label: "Director or owner ID",
    hint: "ID or passport of the person registering the company",
    required: true,
  },
  {
    type: "BANK_LETTER",
    label: "Bank letter",
    hint: "Bank confirmation for the account we pay you into",
    required: true,
  },
  {
    type: "COMPANY_REGISTRATION",
    label: "Company registration (CIPC)",
    hint: "CoR 14.3 or CK document, if your company is registered",
    required: false,
  },
  {
    type: "PROOF_OF_ADDRESS",
    label: "Proof of business address",
    hint: "Utility bill or lease, less than three months old",
    required: false,
  },
] as const;

export const TENANT_REQUIRED_DOCUMENTS = TENANT_DOCUMENT_TYPES.filter(
  (d) => d.required,
);

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
   * Every document a company can supply, required ones first.
   *
   * Only two are mandatory, and both exist to protect the money: the bank
   * letter proves the payout account belongs to the company, and the ID ties a
   * real person to it. The other two are accepted and useful when reviewing
   * something that looks off, but are not gates — requiring CIPC registration
   * would shut out sole proprietors and informal operators, who are a large
   * part of this market, and a utility bill does not prevent payout fraud.
   */
  documentTypes: TENANT_DOCUMENT_TYPES,

  /**
   * The subset that actually blocks a company from going active.
   */
  requiredDocuments: TENANT_REQUIRED_DOCUMENTS,

  /**
   * Documents a company has uploaded so far.
   */
  async getDocuments(tenantId: string): Promise<TenantDocument[]> {
    return db
      .select()
      .from(tenantDocument)
      .where(eq(tenantDocument.tenantId, tenantId));
  },

  /**
   * Record an uploaded document, replacing any previous file of that type.
   *
   * Moves the company to SUBMITTED once the set is complete, so the review
   * queue only surfaces companies that are actually waiting on us. A company
   * that was rejected and is re-uploading goes back into the queue the same way.
   */
  async saveDocument(
    tenantId: string,
    type: "COMPANY_REGISTRATION" | "DIRECTOR_ID" | "PROOF_OF_ADDRESS" | "BANK_LETTER",
    fileUrl: string,
    fileName: string | null,
  ): Promise<void> {
    await db
      .insert(tenantDocument)
      .values({ id: crypto.randomUUID(), tenantId, type, fileUrl, fileName })
      .onConflictDoUpdate({
        target: [tenantDocument.tenantId, tenantDocument.type],
        set: { fileUrl, fileName, uploadedAt: new Date() },
      });

    await this.refreshSubmissionState(tenantId);
  },

  /**
   * Remove a document and drop the company back out of the review queue.
   */
  async deleteDocument(tenantId: string, type: string): Promise<void> {
    await db
      .delete(tenantDocument)
      .where(
        and(
          eq(tenantDocument.tenantId, tenantId),
          eq(tenantDocument.type, type as any),
        ),
      );

    await this.refreshSubmissionState(tenantId);
  },

  /**
   * Move a company between PENDING and SUBMITTED based on whether the required
   * set is complete. Never touches an APPROVED company — re-uploading a
   * document should not switch off a business that is already trading.
   */
  async refreshSubmissionState(tenantId: string): Promise<void> {
    const current = await this.getById(tenantId);
    if (!current || current.verificationStatus === "APPROVED") return;

    const documents = await this.getDocuments(tenantId);
    const uploaded = new Set(documents.map((d) => d.type));
    const complete = this.requiredDocuments.every((r) => uploaded.has(r.type));

    await db
      .update(tenant)
      .set({
        verificationStatus: complete ? "SUBMITTED" : "PENDING",
        updatedAt: new Date(),
      })
      .where(eq(tenant.id, tenantId));
  },

  /**
   * Approve a company, which is what actually lets it trade.
   */
  async approve(tenantId: string, adminUserId: string): Promise<void> {
    await db
      .update(tenant)
      .set({
        verificationStatus: "APPROVED",
        isActive: true,
        verificationNotes: null,
        verifiedAt: new Date(),
        verifiedBy: adminUserId,
        updatedAt: new Date(),
      })
      .where(eq(tenant.id, tenantId));
  },

  /**
   * Reject a company with a reason it will see, so it knows what to fix.
   */
  async reject(tenantId: string, adminUserId: string, reason: string): Promise<void> {
    await db
      .update(tenant)
      .set({
        verificationStatus: "REJECTED",
        isActive: false,
        verificationNotes: reason,
        verifiedAt: new Date(),
        verifiedBy: adminUserId,
        updatedAt: new Date(),
      })
      .where(eq(tenant.id, tenantId));
  },

  /**
   * Companies waiting on review, newest first.
   */
  async getAwaitingReview(): Promise<Tenant[]> {
    return db
      .select()
      .from(tenant)
      .where(eq(tenant.verificationStatus, "SUBMITTED"))
      .orderBy(tenant.createdAt);
  },

  /**
   * What the platform owes a company, and what it has already paid them.
   *
   * Only counts bookings the company actually owns — the platform owner is
   * never owed a payout, since it is the account collecting the money.
   */
  async getPayoutTotals(tenantId: string): Promise<{
    pending: number;
    paid: number;
    pendingBookings: number;
  }> {
    const [row] = await db
      .select({
        pending: sql<string>`COALESCE(SUM(${payment.tenantPayoutAmount}) FILTER (WHERE ${payment.isPaidToTenant} = false), 0)`,
        paid: sql<string>`COALESCE(SUM(${payment.tenantPayoutAmount}) FILTER (WHERE ${payment.isPaidToTenant} = true), 0)`,
        pendingBookings: sql<number>`COUNT(*) FILTER (WHERE ${payment.isPaidToTenant} = false)`,
      })
      .from(payment)
      .innerJoin(booking, eq(booking.id, payment.bookingId))
      .where(
        and(
          eq(booking.tenantId, tenantId),
          eq(payment.status, "COMPLETED"),
          isNotNull(payment.tenantPayoutAmount),
        ),
      );

    return {
      pending: Number(row?.pending ?? 0),
      paid: Number(row?.paid ?? 0),
      pendingBookings: Number(row?.pendingBookings ?? 0),
    };
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
