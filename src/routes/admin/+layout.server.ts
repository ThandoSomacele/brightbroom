// src/routes/admin/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals }) => {
  const { user, tenant, tenantMembership } = locals;

  if (!user) {
    throw redirect(302, '/auth/login?redirectTo=/admin');
  }

  if (user.role !== 'ADMIN' && user.role !== 'TENANT_ADMIN') {
    throw redirect(302, '/profile');
  }

  // Tenant admins must have a valid tenant association
  if (user.role === 'TENANT_ADMIN' && !tenant) {
    throw redirect(302, '/profile');
  }

  return {
    user,
    tenant,
    tenantMembership,
    isPlatformAdmin: user.role === 'ADMIN',
    isTenantAdmin: user.role === 'TENANT_ADMIN',
  };
};
