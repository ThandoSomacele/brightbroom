// src/routes/book/+page.server.ts
import { db } from '$lib/server/db';
import { service } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm'; // Add this import
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Allow both authenticated and guest users to access service selection
  // Authentication will be handled at payment step
  
  try {
    // Simply select all services without adding the where clause
    // until we fix the schema and ensure the isActive field exists
    const services = await db.select().from(service);
    
    // Sort them manually if needed temporarily
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
      user: locals.user,
      isAuthenticated: !!locals.user
    };
  } catch (err) {
    console.error('Error loading services:', err);
    return {
      services: [],
      user: locals.user,
      isAuthenticated: !!locals.user
    };
  }
};
