<!-- src/lib/components/services/ServiceCard.svelte -->
<script lang="ts">
  import { Home, Clock, CreditCard } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import ServiceDetailsModal from './ServiceDetailsModal.svelte';
  
  
  // Props
  export let id: string;
  export let name: string;
  export let description: string;
  export let price: number;
  export let duration: number;
  export let iconType: 'home' | 'deep' | 'office' = 'home';
  export let type: 'regular' | 'extended' = 'regular';
  
  // Format price as ZAR currency
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  }
  
  // Service details modal instance
  let detailsModal: ServiceDetailsModal;
  
  // Getting the icon component based on the type
  $: IconComponent = iconType === 'home' ? Home : 
                      iconType === 'deep' ? Clock : CreditCard;
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
    
    <ServiceDetailsModal bind:this={detailsModal} serviceType={type} serviceName={name} />
  </div>
  
  <p class="mb-6 text-2xl font-bold text-primary">{formatCurrency(price)}</p>
  
  <Button variant="outline" href={`/book?service=${id}`} class="w-full">
    Select
  </Button>
</div>
