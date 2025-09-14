// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  // Return user data and CSRF token
  return {
    user: locals.user,
    csrf: locals.csrf
  };
};
