// scripts/update-address-coordinates.ts
import dotenv from 'dotenv';
import { eq, or, isNull } from 'drizzle-orm';
import fetch from 'node-fetch';

// Load environment variables first
dotenv.config();

// Import our custom db client
import { db } from '../src/lib/server/db';
// Import schema types
import { address } from '../src/lib/server/db/schema';

// Get Google Maps API key from env
const GOOGLE_MAPS_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.error('VITE_GOOGLE_MAPS_API_KEY environment variable is not set');
  process.exit(1);
}

/**
 * Geocode an address to get coordinates
 */
async function geocodeAddress(addressText: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const encodedAddress = encodeURIComponent(addressText);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json() as any;
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

async function updateAddressCoordinates() {
  console.log("Starting address coordinates update...");

  try {
    // Find addresses with missing or invalid coordinates
    const addressesToUpdate = await db
      .select()
      .from(address)
      .where(
        or(
          isNull(address.lat),
          isNull(address.lng),
          eq(address.lat, 0),
          eq(address.lng, 0)
        )
      );

    console.log(`Found ${addressesToUpdate.length} addresses to update`);

    for (const addr of addressesToUpdate) {
      try {
        // Construct a full address string
        const fullAddress = `${addr.street}, ${addr.city}, ${addr.state}, ${addr.zipCode}`;
        console.log(`Updating coordinates for address: ${fullAddress}`);

        // Use the Google Maps Geocoding API to get coordinates
        const coordinates = await geocodeAddress(fullAddress);

        if (coordinates) {
          // Update the address with the new coordinates
          await db
            .update(address)
            .set({
              lat: coordinates.lat,
              lng: coordinates.lng,
              updatedAt: new Date()
            })
            .where(eq(address.id, addr.id));

          console.log(`✅ Updated address ${addr.id} with coordinates: ${coordinates.lat}, ${coordinates.lng}`);
        } else {
          console.warn(`⚠️ Failed to geocode address ${addr.id}: ${fullAddress}`);
        }

        // Sleep to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        console.error(`❌ Error updating address ${addr.id}:`, err);
      }
    }

    console.log("Address coordinates update completed");
  } catch (err) {
    console.error("Error in update script:", err);
  } finally {
    process.exit(0);
  }
}

updateAddressCoordinates();
