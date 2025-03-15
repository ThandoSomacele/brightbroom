// src/routes/profile/addresses/new/+page.server.ts
import { db } from '$lib/server/db';
import { address } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

// Load data for the page
export const load: PageServerLoad = async ({ locals, url }) => {
  // Check if the user is logged in
  if (!locals.user) {
    // Keep the redirect URL if one was provided
    const redirectTo = url.searchParams.get('redirectTo');
    const redirectParam = redirectTo ? `&redirectTo=${redirectTo}` : '';
    
    throw redirect(302, `/auth/login?returnTo=/profile/addresses/new${redirectParam}`);
  }
  
  // Get redirect URL if coming from booking flow
  const redirectTo = url.searchParams.get('redirectTo');
  
  return {
    redirectTo
  };
};

// Form validation schema with more detailed validation
const addressSchema = z.object({
  // Street address validation
  street: z.string()
    .min(1, 'Street address is required')
    .max(100, 'Street address is too long'),
  
  // Optional apartment/unit number
  aptUnit: z.string()
    .max(20, 'Unit/Apartment number is too long')
    .nullable()
    .optional()
    .transform(val => val === '' ? null : val),
  
  // City validation
  city: z.string()
    .min(1, 'City is required')
    .max(50, 'City name is too long'),
  
  // Province/state validation
  state: z.string()
    .min(1, 'Province is required')
    .refine(val => 
      ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 
       'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 
       'Western Cape'].includes(val), 
      { message: 'Please select a valid province' }
    ),
  
  // South African postal code validation (4 digits)
  zipCode: z.string()
    .min(1, 'Postal code is required')
    .max(10, 'Postal code is too long')
    .refine(val => /^\d{4,5}$/.test(val.replace(/\s/g, '')), {
      message: 'Postal code must be 4-5 digits'
    }),
  
  // Access instructions
  instructions: z.string()
    .max(500, 'Instructions are too long')
    .nullable()
    .optional()
    .transform(val => val === '' ? null : val),
  
  // Default flag
  isDefault: z.boolean().optional().default(false)
});

export const actions: Actions = {
  default: async ({ request, locals, url }) => {
    // Check if the user is logged in
    if (!locals.user) {
      return fail(401, { error: 'You must be logged in to add an address' });
    }
    
    const formData = await request.formData();
    const street = formData.get('street')?.toString();
    const aptUnit = formData.get('aptUnit')?.toString() || null;
    const city = formData.get('city')?.toString();
    const state = formData.get('state')?.toString();
    const zipCode = formData.get('zipCode')?.toString();
    const instructions = formData.get('instructions')?.toString() || null;
    const isDefault = !!formData.get('isDefault');
    
    // Check for redirect URL
    const redirectTo = formData.get('redirectTo')?.toString() || null;
    
    try {
      // Clean and validate form data
      const data = {
        street: street?.trim(),
        aptUnit: aptUnit?.trim(),
        city: city?.trim(),
        state,
        zipCode: zipCode?.replace(/\s/g, ''), // Remove spaces from postal code
        instructions: instructions?.trim(),
        isDefault
      };
      
      // Parse and validate with zod schema
      const validatedData = addressSchema.parse(data);
      
      // First check if this will be the first address - completely outside the transaction
      let isFirstAddress = false;
      try {
        // Get all addresses
        const allAddresses = await db.select()
          .from(address)
          .where(eq(address.userId, locals.user.id));
        
        // If no addresses exist, this will be the first one
        isFirstAddress = allAddresses.length === 0;
      } catch (err) {
        console.error('Error checking existing addresses:', err);
        // Default to false if we can't determine
        isFirstAddress = false;
      }
      
      // Use a simpler approach to create the address
      // This replaces the transaction to avoid issues
      try {
        // If setting as default or it's the first address, update all existing addresses to non-default
        if (validatedData.isDefault || isFirstAddress) {
          await db.update(address)
            .set({ isDefault: false })
            .where(eq(address.userId, locals.user.id));
        }
        
        // Create the new address - this should always be default if it's the first one
        await db.insert(address).values({
          id: crypto.randomUUID(),
          userId: locals.user.id,
          street: validatedData.street,
          aptUnit: validatedData.aptUnit,
          city: validatedData.city,
          state: validatedData.state,
          zipCode: validatedData.zipCode,
          instructions: validatedData.instructions,
          isDefault: validatedData.isDefault || isFirstAddress,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } catch (err) {
        console.error('Error creating address:', err);
        return fail(500, { 
          error: 'Failed to add address. Database error.',
          street,
          aptUnit,
          city,
          state,
          zipCode,
          instructions,
          isDefault,
          redirectTo
        });
      }
      
      // Redirect based on the source of the request
      if (redirectTo && redirectTo.startsWith('/book')) {
        // If coming from booking flow, redirect back there
        throw redirect(302, redirectTo);
      } else {
        // Otherwise, redirect to the addresses page
        throw redirect(302, '/profile/addresses?added=true');
      }
    } catch (error) {
      console.error('Error adding address:', error);
      
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        const errors = error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] || 'Invalid input';
        
        return fail(400, { 
          error: firstError,
          street,
          aptUnit,
          city,
          state,
          zipCode,
          instructions,
          isDefault,
          redirectTo
        });
      }
      
      // Database or other errors
      return fail(500, { 
        error: 'Failed to add address. Please try again.',
        street,
        aptUnit,
        city,
        state,
        zipCode,
        instructions,
        isDefault,
        redirectTo
      });
    }
  }
};