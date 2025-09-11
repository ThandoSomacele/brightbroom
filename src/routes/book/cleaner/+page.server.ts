import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();
  
  return {
    user: session?.user || null,
    isAuthenticated: !!session,
  };
};