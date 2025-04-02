// src/routes/api/services/[id]/+server.ts
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { service } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { 
  parseServiceDetails, 
  stringifyServiceDetails,
  generateDefaultServiceDetails 
} from '$lib/services';

export const GET: RequestHandler = async ({ params }) => {
  const { id } = params;
  
  try {
    // Get service from database
    const [serviceData] = await db.select()
      .from(service)
      .where(eq(service.id, id))
      .limit(1);
    
    if (!serviceData) {
      return json({ error: 'Service not found' }, { status: 404 });
    }
    
    // Parse the details JSON if available
    const details = serviceData.details 
      ? parseServiceDetails(serviceData.details) 
      : null;
    
    // Determine the service type and icon type based on the name
    const type = serviceData.name.toLowerCase().includes('extended') ? 'extended' : 'regular';
    
    let iconType = 'home';
    if (serviceData.name.includes('Office')) {
      iconType = 'office';
    } else if (serviceData.name.includes('Laundry')) {
      iconType = 'laundry';
    } else if (type === 'extended') {
      iconType = 'deep';
    }
    
    // Determine category
    const category = serviceData.name.includes('Office') ? 'commercial' : 'residential';
    
    return json({
      service: {
        ...serviceData,
        details,
        type,
        iconType,
        category
      }
    });
  } catch (error) {
    console.error(`Error fetching service ${id}:`, error);
    return json({ error: 'Failed to fetch service' }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  // Check if user is admin
  if (!locals.user || locals.user.role !== 'ADMIN') {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = params;
  
  try {
    // Check if service exists
    const [existingService] = await db.select()
      .from(service)
      .where(eq(service.id, id))
      .limit(1);
    
    if (!existingService) {
      return json({ error: 'Service not found' }, { status: 404 });
    }
    
    const data = await request.json();
    
    // Process details if provided
    let details = existingService.details;
    if (data.details !== undefined) {
      details = data.details === null 
        ? null 
        : typeof data.details === 'string' 
          ? data.details 
          : JSON.stringify(data.details);
    }
    
    // Update fields that are provided
    const updateData: Record<string, any> = {
      updatedAt: new Date()
    };
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.basePrice !== undefined) updateData.basePrice = data.basePrice;
    if (data.durationHours !== undefined) updateData.durationHours = data.durationHours;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (details !== undefined) updateData.details = details;
    
    // Update service
    const [updatedService] = await db.update(service)
      .set(updateData)
      .where(eq(service.id, id))
      .returning();
    
    return json({ service: updatedService });
  } catch (error) {
    console.error(`Error updating service ${id}:`, error);
    return json({ error: 'Failed to update service' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  // Check if user is admin
  if (!locals.user || locals.user.role !== 'ADMIN') {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = params;
  
  try {
    // Delete service
    await db.delete(service)
      .where(eq(service.id, id));
    
    return json({ success: true });
  } catch (error) {
    console.error(`Error deleting service ${id}:`, error);
    return json({ error: 'Failed to delete service' }, { status: 500 });
  }
};
