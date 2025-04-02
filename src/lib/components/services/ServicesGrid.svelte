<!-- src/lib/components/services/ServicesGrid.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import ServiceCard from './ServiceCard.svelte';
  import { 
    services,
    servicesLoading,
    servicesError,
    loadServices,
    type Service
  } from '$lib/services';
  
  // Props
  export let showDetailsButton = true;
  export let showBookButton = true;
  export let category: string | null = null;
  export let maxItems: number | null = null;
  
  // Local state
  let isLoading = true;
  let error: string | null = null;
  
  // Filtered services based on props
  $: filteredServices = category 
    ? $services.filter(s => s.category === category && s.isActive)
    : $services.filter(s => s.isActive);
  
  // Apply max items limit if specified
  $: displayServices = maxItems 
    ? filteredServices.slice(0, maxItems) 
    : filteredServices;
  
  // Load services on component mount
  onMount(async () => {
    isLoading = true;
    
    try {
      await loadServices();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load services';
    } finally {
      isLoading = false;
    }
  });
</script>

<div>
  {#if isLoading || $servicesLoading}
    <div class="flex justify-center py-12">
      <div class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>
  {:else if error || $servicesError}
    <div class="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-700 dark:text-red-200">
            {error || $servicesError}
          </p>
          <button 
            class="mt-2 text-sm font-medium text-red-700 hover:text-red-600 dark:text-red-200 dark:hover:text-red-100"
            on:click={() => loadServices(true)}
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  {:else if displayServices.length === 0}
    <div class="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
      <p class="text-gray-500 dark:text-gray-400">No services available</p>
    </div>
  {:else}
    <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {#each displayServices as service (service.id)}
        <ServiceCard
          id={service.id}
          name={service.name}
          description={service.description}
          basePrice={typeof service.basePrice === 'number' 
            ? service.basePrice 
            : parseFloat(service.basePrice.toString())}
          durationHours={service.durationHours}
          iconType={service.iconType}
          details={service.details}
          {showDetailsButton}
          {showBookButton}
        />
      {/each}
    </div>
  {/if}
</div>
