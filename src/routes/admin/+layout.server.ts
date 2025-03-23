// src/routes/admin/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals }) => {
  const { user } = locals;
  
  if (!user) {
    throw redirect(302, '/auth/login?redirectTo=/admin');
  }
  
  if (user.role !== 'ADMIN') {
    throw redirect(302, '/profile');
  }
  
  return {
    user
  };
};
