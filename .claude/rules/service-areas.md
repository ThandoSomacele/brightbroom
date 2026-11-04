---
paths:
  - "src/lib/utils/service-areas.ts"
  - "src/lib/components/maps/**"
  - "src/routes/admin/service-areas/**"
  - "src/routes/book/**"
  - "src/routes/join/**"
---
# Service areas and addresses

- Service areas are data: table `service_area` (centre + radius in km), managed per deployment in `/admin/service-areas`. brightbroom.com's rows came from migration 0023; a client DB starts empty, and with no active areas every address is refused.
- Pure checks in `src/lib/utils/service-areas.ts` take the areas as an argument. Pages load them with `serviceAreaService.listActive()` and pass them to `GoogleMapsAutocomplete` (`serviceAreas`, `enforceServiceArea`). Booking and cleaner sign-up check again on the server.
- Google Maps autocomplete is biased to the areas, not restricted. Coordinates are stored for cleaner assignment (`pnpm update:address-coordinates`, `update:cleaner-coordinates` backfill them).
