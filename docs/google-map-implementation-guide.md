# Google Maps Address Search Implementation Guide

This guide explains how to implement the Google Maps address search functionality for BrightBroom, including geographic restrictions to specific service areas in Gauteng.

## Implementation Overview

The solution consists of several components:

1. **GoogleMapsAutocomplete.svelte** - The core component that integrates with Google Places API for address search
2. **src/lib/utils/service-areas.ts** - Pure functions that check an address against a list of service areas
3. **src/lib/server/services/service-area.service.ts** - Reads and edits the `service_area` table
4. **/admin/service-areas** - Where each company manages its own areas
5. **/service-areas** - Public page listing the active areas

## Setup Instructions

### 1. Obtain a Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "API Key"
5. Restrict the key to the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
6. Set HTTP restrictions to your domain(s)

### 2. Add Environment Variables

1. Create or update your `.env` file with your Google Maps API key:

   ```
   VITE_GOOGLE_MAPS_API_KEY="your_google_maps_api_key"
   ```

2. Make sure your `svelte.config.js` is set up to handle environment variables properly.

### 3. Install the Components

1. Copy all the provided component files to their respective directories
2. Update any imports as needed based on your project structure

### 4. Integration Points

### Booking Flow Integration

1. Replace or update `src/routes/book/address/+page.svelte` with the modified version
2. Make sure the address store is properly Initialised in the booking flow

### Profile Address Management Integration

1. Update your existing address forms to use the `GoogleMapsAutocomplete` component
2. Implement validation to ensure addresses are within service areas

### Service Area Display

1. Add the `ServiceAreasPage.svelte` to your routes
2. Add a link to it in your navigation menu

## Configuration

### Service Areas

Service areas are data, not code: each company adds, edits and switches off
its own in `/admin/service-areas` (table `service_area`; each area is a centre
and a radius in km). Pages that check addresses load the active areas on the
server and pass them to `GoogleMapsAutocomplete` as `serviceAreas`; the
booking and cleaner sign-up actions check again on the server. With no active
areas, every address is refused and the admin dashboard says so.

### Address Processing

When a user selects an address from Google Places, the system:

1. Gets detailed address components (street, city, etc.)
2. Validates if the address falls within a service area
3. Provides appropriate feedback if out of area
4. Allows saving valid addresses for future use

## Technical Details

### Address Validation

We use the Haversine formula to calculate the distance between coordinates:

```typescript
function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}
```

An address is considered within a service area if its distance to at least one service area center is less than or equal to that area's radius.

### Google Maps Integration

1. The `GoogleMapsAutocomplete` component lazy-loads the Google Maps JavaScript API
2. It Initialises a Places Autocomplete instance with South Africa country restriction
3. It further biases results toward the Gauteng region for better suggestions
4. When an address is selected, it's validated against service areas

### Optimisations

1. The Google Maps script is loaded only when needed
2. Service area validation is fast and can handle many coordinates
3. Address components are parsed to provide a consistent address structure

## Future Enhancements

Consider these future enhancements:

1. **Cleaner Management**: Add a map interface for assigning cleaners based on proximity
2. **Dynamic Service Areas**: Admin panel to adjust service areas without code changes
3. **Real-time Validation**: Validate addresses as users type, before selection
4. **Distance-based Pricing**: Adjust prices based on distance from service area centers
5. **Expansion Requests**: Track and analyze requested areas for planned expansions

## Troubleshooting

Common issues:

1. **API Key Not Working**: Ensure API key has correct APIs enabled and permissions
2. **Address Not Found**: Try different formats or more specific addresses
3. **Service Area Validation Failed**: Check coordinates and radius values
4. **Map Not Loading**: Verify API key is correctly passed to components

## Resources

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Google Geocoding API Documentation](https://developers.google.com/maps/documentation/geocoding)
