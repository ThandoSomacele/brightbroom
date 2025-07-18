# Services Data Migration Guide

This guide explains how to migrate from the old scattered services data approach to the new centralized services module.

## Overview of Changes

1. Created a centralized services module in `src/lib/services/`
2. Standardized the service data format (JSON instead of CSV)
3. Added caching and state management with Svelte stores
4. Created reusable components for service display
5. Added scripts for data conversion and DB updates

## Migration Steps

### 1. Install New Module

The new services module is now available at `src/lib/services/`. It provides a complete API for working with services data.

### 2. Convert CSV Data to JSON

Run the conversion script to convert CSV service descriptions to JSON format:

```bash
npm run services:csv-to-json
```

This creates JSON files in `static/data/json/` that can be used as a fallback or for seeding.

### 3. Update Database with JSON Details

Run the database update script to add structured JSON details to existing services:

```bash
# For development database
npm run services:update-db

# For production database (use with caution)
npm run services:update-db:prod
```

### 4. Update Components

Replace old service data references with the new services module:

- **Old way:**

```typescript
import { parseServiceDetailsFromCSV } from "$lib/utils/service-details";
// or
import { loadServiceData } from "$lib/utils/service-data";
```

- **New way:**

```typescript
import {
  loadServices,
  services,
  parseServiceDetails,
  formatCurrency,
  // ...other exports
} from "$lib/services";
```

### 5. Use New Components

Replace custom service display code with the new components:

- `ServiceCard.svelte` - For displaying an individual service
- `ServicesGrid.svelte` - For displaying a grid of services
- `ServiceDetailsModal.svelte` - For showing service details

### 6. Files to Remove

The following files are now obsolete and can be removed:

- `src/lib/utils/service-details.ts`
- `src/lib/utils/service-data.ts`
- `src/lib/stores/services.ts`
- `src/routes/services/+page.svelte` (replaced by new version)
- `src/lib/components/services/ServiceCard.svelte` (replaced by new version)
- `src/lib/components/services/ServiceDetailsModal.svelte` (replaced by new version)
- `src/lib/components/services/ServicesGrid.svelte` (replaced by new version)

### 7. Test the Migration

1. Start your development server
2. Navigate to the services page
3. Verify that services are displayed correctly
4. Check that service details can be viewed
5. Test the booking flow to ensure it works with the new services data

## Benefits of the New Approach

- **Single Source of Truth**: All service data is managed in one place
- **Better TypeScript Support**: Complete type definitions for services
- **Improved Caching**: Services are cached in Svelte stores for better performance
- **Reusable Components**: Standard components for displaying services
- **Structured Data Format**: JSON format is easier to work with than CSV
- **Better Organisation**: Clear separation of concerns in the codebase

## Troubleshooting

If you encounter issues during migration:

- Check the browser console for errors
- Verify that all imports are updated to use the new module
- Ensure the database update script ran successfully
- Clear browser caches and restart the development server
