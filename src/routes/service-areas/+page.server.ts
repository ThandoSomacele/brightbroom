// src/routes/service-areas/+page.server.ts
import { serviceAreaService } from "$lib/server/services/service-area.service";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => ({
  serviceAreas: await serviceAreaService.listActive(),
});
