// src/routes/book/+page.server.ts
import { db } from '$lib/server/db';
import { service } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Check if the user is logged in
  if (!locals.user) {
    throw redirect(302, '/auth/login?redirectTo=/book');
  }
  
  try {
    // Get all available services
    const services = await db.select().from(service);
    
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
