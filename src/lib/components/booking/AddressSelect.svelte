<!-- src/lib/components/booking/AddressSelect.svelte -->
<script lang="ts">
  import { MapPin, Star, Home } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';

  // Props
  export let addresses = [];
  export let selectedAddressId = '';
  export let showDefaultIndicator = true;
  export let emptyMessage = 'No addresses found. Please add a new address to continue.';

  // Create a dispatcher for events
  const dispatch = createEventDispatcher();

  // Handle address selection
  function selectAddress(id: string) {
    selectedAddressId = id;
    dispatch('select', { id });
  }
</script>

<div class="address-selection">
  {#if addresses.length === 0}
    <div class="rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
      <p class="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each addresses as address (address.id)}
        <button
          type="button"
          class={`w-full text-left rounded-lg border-2 p-4 transition-all hover:shadow-md
            ${selectedAddressId === address.id 
              ? 'border-primary bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20' 
              : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'}`}
          on:click={() => selectAddress(address.id)}
        >
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <div 
                class="w-10 h-10 flex items-center justify-center rounded-full bg-primary-100 text-primary dark:bg-primary-900/20"
              >
                <Home size={20} />
              </div>
            </div>
            
            <div class="ml-3 flex-1">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">{address.street}</h3>
                  
                  {#if address.isDefault && showDefaultIndicator}
                    <span class="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary dark:bg-primary-900/20 mt-1">
                      <Star size={12} class="mr-1" />
                      Default
                    </span>
                  {/if}
                </div>
                
                {#if selectedAddressId === address.id}
                  <div class="rounded-full bg-primary p-1 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </div>
                {/if}
              </div>
              
              {#if address.aptUnit}
                <p class="text-sm text-gray-600 dark:text-gray-300">Unit {address.aptUnit}</p>
              {/if}
              
              <p class="text-sm text-gray-600 dark:text-gray-300">
                {address.city}, {address.state} {address.zipCode}
              </p>
              
              {#if address.instructions}
                <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span class="font-medium">Instructions:</span> {address.instructions}
                </p>
              {/if}
            </div>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>
