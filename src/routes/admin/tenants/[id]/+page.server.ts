// src/routes/admin/tenants/[id]/+page.server.ts
import { db } from "$lib/server/db";
import { user } from "$lib/server/db/schema";
import { tenantService } from "$lib/server/services/tenant.service";
import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
  if (locals.user?.role !== "ADMIN") {
    throw error(403, "Only platform administrators can manage tenants");
  }

  const tenant = await tenantService.getById(params.id);
  if (!tenant) {
    throw error(404, "Tenant not found");
  }

  const members = await tenantService.getMembers(params.id);
  const cleanerCount = await tenantService.getCleanerCount(params.id);

  return { tenant, members, cleanerCount };
};

export const actions: Actions = {
  update: async ({ request, params, locals }) => {
    if (locals.user?.role !== "ADMIN") {
      throw error(403, "Only platform administrators can manage tenants");
    }

    const formData = await request.formData();
    const name = (formData.get("name") as string)?.trim();
    const contactEmail = (formData.get("contactEmail") as string)?.trim();
    const contactPhone = (formData.get("contactPhone") as string)?.trim();
    const province = (formData.get("province") as string)?.trim();
    const commissionRate =
      (formData.get("commissionRate") as string)?.trim() || "15.00";

    if (!name) {
      return { errors: { name: "Company name is required" } };
    }

    await tenantService.update(params.id, {
      name,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      province: province || null,
      commissionRate,
    });

    return { success: true, message: "Tenant updated successfully" };
  },

  addMember: async ({ request, params, locals }) => {
    if (locals.user?.role !== "ADMIN") {
      throw error(403, "Only platform administrators can manage tenants");
    }

    const formData = await request.formData();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const role = ((formData.get("role") as string) || "ADMIN") as
      | "OWNER"
      | "ADMIN"
      | "MANAGER";

    if (!email) {
      return { addMemberError: "Email address is required" };
    }

    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!existingUser) {
      return {
        addMemberError: `No account found for ${email}. They need to register before they can be added to a tenant.`,
      };
    }

    // Cleaners use the cleaner portal; promoting them would lock them out of it.
    if (existingUser.role === "CLEANER") {
      return {
        addMemberError:
          "Cleaner accounts cannot be tenant admins. Use a separate account for this person's admin access.",
      };
    }

    // getTenantForUser resolves a single membership, so one tenant per user.
    const currentMembership = await tenantService.getTenantForUser(
      existingUser.id,
    );
    if (currentMembership) {
      if (currentMembership.tenantId === params.id) {
        return { addMemberError: "That user is already a member of this tenant" };
      }
      return {
        addMemberError: `That user already belongs to ${currentMembership.tenant.name}. Remove them from that tenant first.`,
      };
    }

    await tenantService.addMember(params.id, existingUser.id, role);

    // Membership alone grants nothing — hooks.server.ts gates /admin on the
    // user role, so a customer being onboarded needs promoting too. Platform
    // admins keep their broader ADMIN role.
    if (existingUser.role === "CUSTOMER") {
      await db
        .update(user)
        .set({ role: "TENANT_ADMIN", updatedAt: new Date() })
        .where(eq(user.id, existingUser.id));
    }

    return {
      success: true,
      message: `${existingUser.firstName} ${existingUser.lastName} added to the tenant`,
    };
  },

  removeMember: async ({ request, params, locals }) => {
    if (locals.user?.role !== "ADMIN") {
      throw error(403, "Only platform administrators can manage tenants");
    }

    const formData = await request.formData();
    const userId = formData.get("userId") as string;

    await tenantService.removeMember(params.id, userId);

    // A TENANT_ADMIN with no membership hits a 403 wall on every admin page,
    // so hand them back a usable customer account. Platform admins are left be.
    const [removedUser] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (removedUser?.role === "TENANT_ADMIN") {
      await db
        .update(user)
        .set({ role: "CUSTOMER", updatedAt: new Date() })
        .where(eq(user.id, userId));
    }

    return { success: true, message: "Member removed" };
  },
};
