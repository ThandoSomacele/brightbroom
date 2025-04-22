// scripts/update-cleaner-coordinates.ts
import dotenv from "dotenv";
import { eq, isNull, or } from "drizzle-orm";
import fetch from "node-fetch";

// Load environment variables first
dotenv.config();

// Import our custom db client
import { db } from "../src/lib/server/db";
// Import schema types
import { cleanerProfile } from "../src/lib/server/db/schema";

// Get Google Maps API key from env
const GOOGLE_MAPS_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.error("VITE_GOOGLE_MAPS_API_KEY environment variable is not set");
  process.exit(1);
}

/**
 * Geocode an address to get coordinates with improved error handling
 */
async function geocodeAddress(
  addressText: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    // Normalize the address - remove unusual characters that might cause problems
    const normalizedAddress = addressText
      .replace(/^0[A-Z]\s+/, "") // Remove leading characters like "0B "
      .trim();

    console.log(`Attempting to geocode: "${normalizedAddress}"`);

    const encodedAddress = encodeURIComponent(normalizedAddress);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = (await response.json()) as any;

    console.log(`Google API response status: ${data.status}`);

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const formattedAddress = data.results[0].formatted_address;

      console.log(`Found coordinates for: "${formattedAddress}"`);

      return {
        lat: location.lat,
        lng: location.lng,
      };
    }

    // If we didn't get a result, try with just city and state
    if (data.status !== "OK") {
      const parts = normalizedAddress.split(",");
      if (parts.length >= 2) {
        // Try with just city, state
        const cityState = `${parts[1].trim()}, ${parts[2] ? parts[2].trim() : ""}`;
        console.log(`Trying again with just city/state: "${cityState}"`);

        const fallbackUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cityState)}&key=${GOOGLE_MAPS_API_KEY}`;

        const fallbackResponse = await fetch(fallbackUrl);
        const fallbackData = (await fallbackResponse.json()) as any;

        if (
          fallbackData.status === "OK" &&
          fallbackData.results &&
          fallbackData.results.length > 0
        ) {
          const location = fallbackData.results[0].geometry.location;
          console.log(
            `Found approximate coordinates for city/state: "${cityState}"`,
          );

          return {
            lat: location.lat,
            lng: location.lng,
          };
        }
      }
    }

    console.error("Geocoding failed with status:", data.status);
    if (data.error_message) {
      console.error("Error message:", data.error_message);
    }

    return null;
  } catch (error) {
    console.error("Error geocoding address:", error);
    return null;
  }
}

async function updateCleanerCoordinates() {
  console.log("Starting cleaner coordinates update...");

  try {
    // Find cleaner profiles with missing or invalid coordinates
    const cleanersToUpdate = await db
      .select()
      .from(cleanerProfile)
      .where(
        or(
          isNull(cleanerProfile.workLocationLat),
          isNull(cleanerProfile.workLocationLng),
          eq(cleanerProfile.workLocationLat, 0),
          eq(cleanerProfile.workLocationLng, 0),
        ),
      );

    console.log(`Found ${cleanersToUpdate.length} cleaner profiles to update`);

    for (const cleaner of cleanersToUpdate) {
      try {
        if (!cleaner.workAddress) {
          console.warn(
            `⚠️ Cleaner ${cleaner.id} has no work address to geocode`,
          );
          continue;
        }

        console.log(
          `Updating coordinates for cleaner: ${cleaner.id} with address: ${cleaner.workAddress}`,
        );

        // Use the Google Maps Geocoding API to get coordinates
        const coordinates = await geocodeAddress(cleaner.workAddress);

        if (coordinates) {
          // Update the cleaner profile with the new coordinates
          await db
            .update(cleanerProfile)
            .set({
              workLocationLat: coordinates.lat,
              workLocationLng: coordinates.lng,
              updatedAt: new Date(),
            })
            .where(eq(cleanerProfile.id, cleaner.id));

          console.log(
            `✅ Updated cleaner ${cleaner.id} with coordinates: ${coordinates.lat}, ${coordinates.lng}`,
          );
        } else {
          console.warn(
            `⚠️ Failed to geocode cleaner ${cleaner.id} address: ${cleaner.workAddress}`,
          );
        }

        // Sleep to avoid hitting rate limits
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (err) {
        console.error(`❌ Error updating cleaner ${cleaner.id}:`, err);
      }
    }

    console.log("Cleaner coordinates update completed");
  } catch (err) {
    console.error("Error in update script:", err);
  } finally {
    process.exit(0);
  }
}

updateCleanerCoordinates();
