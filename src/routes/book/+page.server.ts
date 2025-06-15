// src/routes/book/+page.server.ts
import { db } from '$lib/server/db';
import { service } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  try {
    // Load services for both authenticated and guest users
    const services = await db.select().from(service);
    
    // Sort them manually for consistent ordering
    const serviceOrder = {
      'Regular Cleaning': 1,
      'Regular Cleaning with Laundry & Ironing': 2,
      'Extended Cleaning': 3,
      'Office Cleaning': 4
    };
    
    const sortedServices = [...services].sort((a, b) => {
      return (serviceOrder[a.name] || 999) - (serviceOrder[b.name] || 999);
    });
    
    return {
      services: sortedServices,
      user: locals.user,  // Include user info (null for guests)
      isGuest: !locals.user  // Flag to indicate guest status
    };
  } catch (err) {
    console.error('Error loading services:', err);
    return {
      services: [],
      user: locals.user,
      isGuest: !locals.user
    };
  }
};
