// src/routes/business-plan/+page.server.ts
import { db } from '$lib/server/db/index.js';
import { user, cleanerApplication } from '$lib/server/db/schema.js';
import { count, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  try {
    // Get total customer count (users with role 'CUSTOMER')
    const customerResult = await db
      .select({ count: count() })
      .from(user)
      .where(eq(user.role, 'CUSTOMER'));
    
    const customerCount = customerResult[0]?.count ?? 0;

    // Get total cleaner count (users with role 'CLEANER')
    const cleanerResult = await db
      .select({ count: count() })
      .from(user)
      .where(eq(user.role, 'CLEANER'));
    
    const cleanerUserCount = cleanerResult[0]?.count ?? 0;

    // Get cleaner applications count
    const applicationResult = await db
      .select({ count: count() })
      .from(cleanerApplication);
    
    const cleanerApplicationCount = applicationResult[0]?.count ?? 0;

    // Total cleaners = registered cleaner users + cleaner applications
    const totalCleaners = cleanerUserCount + cleanerApplicationCount;

    return {
      stats: {
        customers: customerCount,
        cleaners: totalCleaners,
        cleanerUsers: cleanerUserCount,
        cleanerApplications: cleanerApplicationCount
      }
    };
  } catch (error) {
    console.error('Error loading business plan stats:', error);
    
    // Return fallback data if database query fails
    return {
      stats: {
        customers: 0,
        cleaners: 0,
        cleanerUsers: 0,
        cleanerApplications: 0
      }
    };
  }
};