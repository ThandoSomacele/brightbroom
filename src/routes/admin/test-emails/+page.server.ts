// src/routes/admin/test-emails/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/route-guards';

export const load: PageServerLoad = async ({ locals }) => {
  requireAdmin(locals, { platformOnly: true });
  // Only available in development and only for admins
  if (process.env.NODE_ENV === 'production' || !locals.user || locals.user.role !== 'ADMIN') {
    throw redirect(302, '/');
  }

  return {};
};
