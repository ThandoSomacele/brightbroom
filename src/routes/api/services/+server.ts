// src/routes/api/services/+server.ts
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { service } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    // Get all active services
    const services = await db.select()
      .from(service)
      .where(eq(service.isActive, true))
      .orderBy(service.name);
    
    return json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    return json({ error: 'Failed to fetch services' }, { status: 500 });
  }
};
