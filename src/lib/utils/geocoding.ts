// src/lib/utils/geocoding.ts

const VITE_GOOGLE_MAPS_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;

/**
 * Geocode an address to get coordinates
 * @param address The full address string
 * @returns Coordinates or null if geocoding fails
 */
export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    // Encode address for URL
    const encodedAddress = encodeURIComponent(address);

    if (!VITE_GOOGLE_MAPS_API_KEY) {
      console.error("Google Maps API key not found in environment variables");
      return null;
    }

    // Create Google Maps Geocoding API URL
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${VITE_GOOGLE_MAPS_API_KEY}`;

    // Fetch geocoding results
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
      };
    }

    return null;
  } catch (error) {
    console.error("Error geocoding address:", error);
    return null;
  }
}
