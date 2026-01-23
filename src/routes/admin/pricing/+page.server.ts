// src/routes/admin/pricing/+page.server.ts
import { db } from '$lib/server/db';
import { pricingConfig, addon } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import { eq, asc } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

// Helper function to get pricing data
async function getPricingData() {
  try {
    // Load pricing configuration
    const [config] = await db
      .select()
      .from(pricingConfig)
      .where(eq(pricingConfig.id, 'default'));

    // Load all addons (including inactive) ordered by sortOrder
    const addons = await db
      .select()
      .from(addon)
      .orderBy(asc(addon.sortOrder));

    // If no pricing config exists, create default
    const pricingData = config || {
      id: 'default',
      basePrice: '130.00',
      baseDurationMinutes: 120,
      baseDescription: 'Living Room and Kitchen cleaning included',
      bedroomPrice: '50.00',
      bedroomDurationMinutes: 60,
      bedroomMin: 1,
      bedroomMax: 10,
      bathroomPrice: '50.00',
      bathroomDurationMinutes: 60,
      bathroomMin: 1,
      bathroomMax: 6,
    };

    return {
      pricingConfig: pricingData,
      addons,
    };
  } catch (err) {
    console.error('Error loading pricing config:', err);
    throw err;
  }
}

export const load: PageServerLoad = async ({ locals }) => {
  // Ensure user is authenticated and is admin
  if (!locals.user || locals.user.role !== 'ADMIN') {
    throw redirect(302, '/auth/login');
  }

  return {
    streamed: {
      pricingData: getPricingData(),
    },
  };
};

export const actions: Actions = {
  updatePricing: async ({ request, locals }) => {
    // Ensure user is authenticated and is admin
    if (!locals.user || locals.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    const formData = await request.formData();

    // Parse pricing values
    const basePrice = formData.get('basePrice')?.toString();
    const baseDurationMinutes = parseInt(formData.get('baseDurationMinutes')?.toString() || '120', 10);
    const baseDescription = formData.get('baseDescription')?.toString();
    const bedroomPrice = formData.get('bedroomPrice')?.toString();
    const bedroomDurationMinutes = parseInt(formData.get('bedroomDurationMinutes')?.toString() || '60', 10);
    const bedroomMin = parseInt(formData.get('bedroomMin')?.toString() || '1', 10);
    const bedroomMax = parseInt(formData.get('bedroomMax')?.toString() || '10', 10);
    const bathroomPrice = formData.get('bathroomPrice')?.toString();
    const bathroomDurationMinutes = parseInt(formData.get('bathroomDurationMinutes')?.toString() || '60', 10);
    const bathroomMin = parseInt(formData.get('bathroomMin')?.toString() || '1', 10);
    const bathroomMax = parseInt(formData.get('bathroomMax')?.toString() || '6', 10);

    // Validate required fields
    if (!basePrice || !bedroomPrice || !bathroomPrice) {
      return { success: false, error: 'All price fields are required' };
    }

    // Validate numeric values
    if (isNaN(parseFloat(basePrice)) || isNaN(parseFloat(bedroomPrice)) || isNaN(parseFloat(bathroomPrice))) {
      return { success: false, error: 'Invalid price values' };
    }

    if (bedroomMin > bedroomMax || bathroomMin > bathroomMax) {
      return { success: false, error: 'Minimum values cannot exceed maximum values' };
    }

    try {
      // Upsert pricing config
      const existingConfig = await db
        .select()
        .from(pricingConfig)
        .where(eq(pricingConfig.id, 'default'));

      if (existingConfig.length > 0) {
        // Update existing
        await db
          .update(pricingConfig)
          .set({
            basePrice,
            baseDurationMinutes,
            baseDescription: baseDescription || 'Living Room and Kitchen cleaning included',
            bedroomPrice,
            bedroomDurationMinutes,
            bedroomMin,
            bedroomMax,
            bathroomPrice,
            bathroomDurationMinutes,
            bathroomMin,
            bathroomMax,
            updatedAt: new Date(),
          })
          .where(eq(pricingConfig.id, 'default'));
      } else {
        // Insert new
        await db.insert(pricingConfig).values({
          id: 'default',
          basePrice,
          baseDurationMinutes,
          baseDescription: baseDescription || 'Living Room and Kitchen cleaning included',
          bedroomPrice,
          bedroomDurationMinutes,
          bedroomMin,
          bedroomMax,
          bathroomPrice,
          bathroomDurationMinutes,
          bathroomMin,
          bathroomMax,
        });
      }

      return { success: true, message: 'Pricing configuration updated successfully' };
    } catch (err) {
      console.error('Error updating pricing config:', err);
      return { success: false, error: 'Failed to update pricing configuration' };
    }
  },

  createAddon: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    const formData = await request.formData();
    const name = formData.get('name')?.toString();
    const description = formData.get('description')?.toString();
    const price = formData.get('price')?.toString();
    const durationMinutes = parseInt(formData.get('durationMinutes')?.toString() || '60', 10);

    if (!name || !price) {
      return { success: false, error: 'Name and price are required' };
    }

    try {
      // Get the highest sort order
      const addons = await db.select().from(addon).orderBy(asc(addon.sortOrder));
      const maxSortOrder = addons.length > 0 ? Math.max(...addons.map(a => a.sortOrder || 0)) : 0;

      await db.insert(addon).values({
        id: crypto.randomUUID(),
        name,
        description: description || null,
        price,
        durationMinutes,
        isActive: true,
        sortOrder: maxSortOrder + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { success: true, message: 'Add-on created successfully' };
    } catch (err) {
      console.error('Error creating addon:', err);
      return { success: false, error: 'Failed to create add-on' };
    }
  },

  updateAddon: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    const formData = await request.formData();
    const id = formData.get('id')?.toString();
    const name = formData.get('name')?.toString();
    const description = formData.get('description')?.toString();
    const price = formData.get('price')?.toString();
    const durationMinutes = parseInt(formData.get('durationMinutes')?.toString() || '60', 10);
    const isActive = formData.get('isActive') === 'true';

    if (!id || !name || !price) {
      return { success: false, error: 'ID, name, and price are required' };
    }

    try {
      await db
        .update(addon)
        .set({
          name,
          description: description || null,
          price,
          durationMinutes,
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(addon.id, id));

      return { success: true, message: 'Add-on updated successfully' };
    } catch (err) {
      console.error('Error updating addon:', err);
      return { success: false, error: 'Failed to update add-on' };
    }
  },

  deleteAddon: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    const formData = await request.formData();
    const id = formData.get('id')?.toString();

    if (!id) {
      return { success: false, error: 'Add-on ID is required' };
    }

    try {
      await db.delete(addon).where(eq(addon.id, id));
      return { success: true, message: 'Add-on deleted successfully' };
    } catch (err) {
      console.error('Error deleting addon:', err);
      return { success: false, error: 'Failed to delete add-on' };
    }
  },

  toggleAddonStatus: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    const formData = await request.formData();
    const id = formData.get('id')?.toString();

    if (!id) {
      return { success: false, error: 'Add-on ID is required' };
    }

    try {
      // Get current status
      const [existingAddon] = await db.select().from(addon).where(eq(addon.id, id));

      if (!existingAddon) {
        return { success: false, error: 'Add-on not found' };
      }

      await db
        .update(addon)
        .set({
          isActive: !existingAddon.isActive,
          updatedAt: new Date(),
        })
        .where(eq(addon.id, id));

      return {
        success: true,
        message: `Add-on ${existingAddon.isActive ? 'deactivated' : 'activated'} successfully`,
      };
    } catch (err) {
      console.error('Error toggling addon status:', err);
      return { success: false, error: 'Failed to toggle add-on status' };
    }
  },
};
