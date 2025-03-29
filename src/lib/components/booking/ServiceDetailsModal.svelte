<!-- src/lib/components/booking/ServiceDetailsModal.svelte -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { ArrowLeft, CheckCircle, X } from "lucide-svelte";
  import type { Service } from "$lib/server/db/schema";
  
  // Service props
  export let service: Service;
  
  const dispatch = createEventDispatcher();
  
  // Parse details if they exist
  let serviceDetails = null;
  
  if (service?.details) {
    try {
      serviceDetails = JSON.parse(service.details);
    } catch (error) {
      console.error('Error parsing service details:', error);
    }
  }
  
  // Close modal
  function close() {
    dispatch('close');
  }

  // Handle clicking outside
  function handleOutsideClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  // Handle escape key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      close();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Modal overlay -->
<div 
  class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto"
  on:click={handleOutsideClick}
>
  <!-- Modal content -->
  <div 
    class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
    role="dialog"
    aria-modal="true"
    aria-labelledby="service-details-title"
  >
    <!-- Modal header -->
    <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <h2 id="service-details-title" class="text-2xl font-bold text-gray-900 dark:text-white">{service.name} Details</h2>
      <button 
        class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        on:click={close}
        aria-label="Close"
      >
        <X size={24} />
      </button>
    </div>
    
    <!-- Modal body -->
    <div class="p-6">
      <!-- Service basic info -->
      <div class="mb-6">
        <p class="text-gray-700 dark:text-gray-300 mb-4">{service.description}</p>
        <div class="flex flex-wrap gap-4">
          <div class="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-md">
            <p class="text-sm text-gray-500 dark:text-gray-400">Base Price</p>
            <p class="text-lg font-bold text-primary">R{typeof service.basePrice === 'number' 
              ? service.basePrice.toFixed(2) 
              : parseFloat(service.basePrice.toString()).toFixed(2)}</p>
          </div>
          <div class="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-md">
            <p class="text-sm text-gray-500 dark:text-gray-400">Duration</p>
            <p class="text-lg font-bold text-gray-800 dark:text-gray-200">
              {service.durationHours} {service.durationHours === 1 ? 'hour' : 'hours'}
            </p>
          </div>
        </div>
      </div>
      
      <!-- Service detailed info -->
      {#if serviceDetails && serviceDetails.items && serviceDetails.items.length > 0}
        <div class="space-y-6">
          {#each serviceDetails.items as item}
            <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.area}</h3>
              <ul class="space-y-2">
                {#each item.details as detail}
                  <li class="flex items-start">
                    <span class="mr-2 mt-1 text-primary">
                      <CheckCircle size={16} />
                    </span>
                    <span class="text-gray-700 dark:text-gray-300">{detail}</span>
                  </li>
                {/each}
              </ul>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-gray-500 dark:text-gray-400">No detailed information available for this service.</p>
      {/if}
    </div>
    
    <!-- Modal footer -->
    <div class="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
      <button 
        class="bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-md transition-colors"
        on:click={close}
      >
        Close
      </button>
    </div>
  </div>
</div>
