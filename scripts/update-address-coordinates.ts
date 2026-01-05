// scripts/update-address-coordinates.ts
import dotenv from 'dotenv';
import { eq, or, sql } from 'drizzle-orm';
import fetch from 'node-fetch';

// Load environment variables first
dotenv.config();

// Import our custom db client
import { db } from '../src/lib/server/db';
// Import schema types
import { address } from '../src/lib/server/db/schema';

// Get Google Maps API key from env
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.error('GOOGLE_MAPS_API_KEY environment variable is not set');
  process.exit(1);
}

/**
 * Geocode an address to get coordinates with improved error handling
 */
async function geocodeAddress(addressText: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Normalize the address - remove unusual characters that might cause problems
    const normalizedAddress = addressText
      .replace(/^0[A-Z]\s+/, '') // Remove leading characters like "0B "
      .trim();
    
    console.log(`Attempting to geocode: "${normalizedAddress}"`);
    
    const encodedAddress = encodeURIComponent(normalizedAddress);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json() as any;
    
    console.log(`Google API response status: ${data.status}`);
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const formattedAddress = data.results[0].formatted_address;
      
      console.log(`Found coordinates for: "${formattedAddress}"`);
      
      return {
        lat: location.lat,
        lng: location.lng
      };
    }
    
    // If we didn't get a result, try with just city and state
    if (data.status !== 'OK') {
      const parts = normalizedAddress.split(',');
      if (parts.length >= 2) {
        // Try with just city, state
        const cityState = `${parts[1].trim()}, ${parts[2] ? parts[2].trim() : ''}`;
        console.log(`Trying again with just city/state: "${cityState}"`);
        
        const fallbackUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cityState)}&key=${GOOGLE_MAPS_API_KEY}`;
        
        const fallbackResponse = await fetch(fallbackUrl);
        const fallbackData = await fallbackResponse.json() as any;
        
        if (fallbackData.status === 'OK' && fallbackData.results && fallbackData.results.length > 0) {
          const location = fallbackData.results[0].geometry.location;
          console.log(`Found approximate coordinates for city/state: "${cityState}"`);
          
          return {
            lat: location.lat,
            lng: location.lng
          };
        }
      }
    }
    
    console.error('Geocoding failed with status:', data.status);
    if (data.error_message) {
      console.error('Error message:', data.error_message);
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
    // Check if lat/lng columns exist in the address table
    try {
      // Try to first verify if the columns exist by running a test query
      await db.execute(sql`SELECT "lat", "lng" FROM "address" LIMIT 1`);
      console.log("Confirmed lat/lng columns exist in address table");
    } catch (err) {
      console.error("Error: The lat/lng columns don't exist in the address table!");
      console.log("Please run a migration to add these columns first:");
      console.log("1. Update your schema.ts to add lat and lng columns to the address table");
      console.log("2. Run 'npm run db:generate' to create a migration");
      console.log("3. Run 'npm run db:migrate' to apply the migration");
      process.exit(1);
    }

    // Find addresses with missing or invalid coordinates using proper SQL syntax
    const addressesToUpdate = await db
      .select()
      .from(address)
      .where(
        or(
          sql`"lat" IS NULL`,
          sql`"lng" IS NULL`,
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
