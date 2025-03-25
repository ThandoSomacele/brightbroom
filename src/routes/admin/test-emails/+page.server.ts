// src/routes/admin/test-emails/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Only available in development and only for admins
  if (process.env.NODE_ENV === 'production' || !locals.user || locals.user.role !== 'ADMIN') {
    throw redirect(302, '/');
  }

  return {};
};
