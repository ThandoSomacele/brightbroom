// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  // Check for active session
  const session = await locals.auth.validate();
  
  // Return user data if logged in
  return {
    user: session?.user || null
  };
};
