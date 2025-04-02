// src/routes/book/+page.server.ts
import { db } from '$lib/server/db';
import { service } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// In src/routes/book/+page.server.ts
export const load: PageServerLoad = async ({ locals }) => {
  // Check if the user is logged in
  if (!locals.user) {
    throw redirect(302, '/auth/login?redirectTo=/book');
  }
  
  try {
    // Get all available services
    const services = await db.select()
      .from(service)
      .where(eq(service.isActive, true))
      .orderBy(service.sortOrder)  // Primary sort
      .orderBy(service.name);      // Secondary sort
    
    return {
      services
    };
  } catch (err) {
    console.error('Error loading services:', err);
    return {
      services: []
    };
  }
};
