// src/routes/services/+page.server.ts
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { service } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { parseServiceDetails } from '$lib/services';

export const load: PageServerLoad = async () => {
  try {
    // Get all active services
    const servicesData = await db.select()
      .from(service)
      .where(eq(service.isActive, true))
      .orderBy(service.sortOrder)  // Primary sort
      .orderBy(service.name);      // Secondary sort
    
    // Process services to add parsed details and type information
    const services = servicesData.map(s => {
      // Parse the details JSON if available
      const details = s.details ? parseServiceDetails(s.details) : null;
      
      // Determine the service type and icon type based on the name
      const type = s.name.toLowerCase().includes('extended') ? 'extended' : 'regular';
      
      let iconType = 'home';
      if (s.name.includes('Office')) {
        iconType = 'office';
      } else if (s.name.includes('Laundry')) {
        iconType = 'laundry';
      } else if (type === 'extended') {
        iconType = 'deep';
      }
      
      // Determine category
      const category = s.name.includes('Office') ? 'commercial' : 'residential';
      
      return {
        ...s,
        details,
        type,
        iconType,
        category
      };
    });
    
    // Group services by category
    const servicesByCategory = services.reduce((acc, service) => {
      const category = service.category || 'uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(service);
      return acc;
    }, {} as Record<string, any[]>);
    
    return {
      services,
      servicesByCategory
    };
  } catch (error) {
    console.error('Error loading services for page:', error);
    return {
      services: [],
      servicesByCategory: {}
    };
  }
};
