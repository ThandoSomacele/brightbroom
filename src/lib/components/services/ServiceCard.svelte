<!-- src/lib/components/services/ServiceCard.svelte -->
<script lang="ts">
  import { Home, Clock, CreditCard, Info } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import ServiceDetailsModal from '$lib/components/booking/ServiceDetailsModal.svelte';
  
  // Props
  export let id: string;
  export let name: string;
  export let description: string;
  export let price: number;
  export let duration: number;
  export let iconType: 'home' | 'deep' | 'office' = 'home';
  export let type: 'regular' | 'extended' = 'regular';
  export let details: string | null = null;
  
  // Format price as ZAR currency
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  }
  
  // Modal state management
  let showDetailsModal = false;
  let serviceObject: any = null;
  
  // Getting the icon component based on the type
  $: IconComponent = iconType === 'home' ? Home : 
                      iconType === 'deep' ? Clock : CreditCard;
                      
  // Create a full service object for the modal
  function showServiceDetails() {
    // Create a service object that matches what the booking modal expects
    serviceObject = {
      id,
      name,
      description,
      basePrice: price,
      durationHours: duration,
      details: details // Pass the details string directly
    };
    
    showDetailsModal = true;
  }
</script>

<div class="h-full rounded-lg bg-white p-6 shadow-md transition-transform hover:-translate-y-1 dark:bg-gray-800">
  <div class="mb-4 text-center text-primary">
    <svelte:component this={IconComponent} class="mx-auto h-12 w-12" />
  </div>
  
  <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
    {name}
  </h3>
  
  <p class="mb-4 text-gray-600 dark:text-gray-300">
    {description}
  </p>
  
  <div class="mb-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
    <div class="flex items-center">
      <Clock class="mr-1 h-4 w-4" />
      <span>{duration} {duration === 1 ? 'hour' : 'hours'}</span>
    </div>
    
    <button
      type="button"
      on:click={showServiceDetails}
      class="inline-flex items-center text-sm font-medium text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
      aria-label="View service details"
    >
      <Info size={18} class="mr-1" />
      <span>View Details</span>
    </button>
  </div>
  
  <p class="mb-6 text-2xl font-bold text-primary">{formatCurrency(price)}</p>
  
  <Button variant="outline" href={`/book?service=${id}`} class="w-full">
    Select
  </Button>
</div>

<!-- Service details modal -->
{#if showDetailsModal && serviceObject}
  <ServiceDetailsModal 
    service={serviceObject} 
    on:close={() => showDetailsModal = false} 
  />
{/if}
