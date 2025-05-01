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
  class="h-full rounded-lg bg-white p-6 shadow-md transition-transform hover:-translate-y-1 dark:bg-gray-800"
>
  <div class="mb-4 text-primary">
    <svelte:component this={IconComponent} class="h-12 w-12" />
  </div>

  <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
    {name}
  </h3>

  <p class="mb-4 text-gray-600 dark:text-gray-300">
    {description}
  </p>

  <div
    class="mb-4 flex justify-between text-sm text-gray-600 dark:text-gray-400"
  >
    <span
      >Duration: {durationHours} {durationHours === 1 ? "hour" : "hours"}</span
    >

    {#if showDetailsButton}
      <button
        type="button"
        on:click={openDetailsModal}
        class="text-primary hover:text-primary-600 hover:underline dark:text-primary-400"
      >
        View Details
      </button>
    {/if}
  </div>

  <!-- <p class="mb-6 text-2xl font-bold text-primary">
    {formatCurrency(basePrice)}
  </p> -->

  {#if showBookButton}
    <Button variant="primary" href={`/book?service=${id}`} class="w-full">
      Book Now
    </Button>
  {/if}
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
