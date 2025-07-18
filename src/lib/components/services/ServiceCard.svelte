<!-- src/lib/components/services/ServiceCard.svelte -->
<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte";
  import type { ServiceIconType } from "$lib/services";
  import { Building, Home, HousePlus, WashingMachine } from "lucide-svelte";
  import ServiceDetailsModal from "./ServiceDetailsModal.svelte";

  // Props
  export let id: string;
  export let name: string;
  export let description: string;
  export let basePrice: number;
  export let durationHours: number;
  export let iconType: ServiceIconType = "home";
  export let details: any = null; // Service details
  export let showDetailsButton = true;
  export let showBookButton = true;

  // State
  let showDetailsModal = false;

  // Get the appropriate icon based on iconType
  $: IconComponent = getIconComponent(iconType);

  // Function to get the icon component
  function getIconComponent(type: ServiceIconType) {
    switch (type) {
      case "office":
        return Building;
      case "deep":
        return HousePlus;
      case "laundry":
        return WashingMachine;
      case "home":
      default:
        return Home;
    }
  }

  // Open details modal
  function openDetailsModal() {
    showDetailsModal = true;
  }

  // Close details modal
  function closeDetailsModal() {
    showDetailsModal = false;
  }
</script>

<div
  class="h-full rounded-lg bg-white p-6 shadow-md transition-transform hover:-translate-y-1 dark:bg-gray-800 flex flex-col"
>
  <div class="mb-4 text-primary">
    <svelte:component this={IconComponent} class="h-12 w-12" />
  </div>

  <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
    {name}
  </h3>

  <p class="mb-4 text-gray-600 dark:text-gray-300 flex-grow">
    {description}
  </p>

  <div class="mt-auto">
    <div
      class="mb-4 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400"
    >
      <span
        >Duration: {durationHours} {durationHours === 1 ? "hour" : "hours"}</span
      >

      {#if showDetailsButton}
        <button
          type="button"
          on:click={openDetailsModal}
          class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary-50 hover:bg-primary-100 hover:text-primary-700 rounded-md transition-colors dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/40"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          View Details
        </button>
      {/if}
    </div>

    <!-- <p class="mb-6 text-2xl font-bold text-primary">
      {formatCurrency(basePrice)}
    </p> -->

    {#if showBookButton}
      <Button variant="secondary" href={`/book?service=${id}`} class="w-full">
        Book Now
      </Button>
    {/if}
  </div>
</div>

<!-- Details Modal -->
{#if showDetailsModal}
  <ServiceDetailsModal
    service={{
      id,
      name,
      description,
      basePrice,
      durationHours,
      details,
    }}
    on:close={closeDetailsModal}
  />
{/if}
