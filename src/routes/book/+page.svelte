<!-- src/routes/book/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import { Home, ArrowRight } from 'lucide-svelte';
  
  // Get data from the server load function
  export let data;
  const { services } = data;
  
  // Track selected service
  let selectedService = '';
  
  // Handle service selection
  function selectService(id: string) {
    selectedService = id;
  }
  
  // Continue to next step
  function continueToNext() {
    if (selectedService) {
      // Store selection in localStorage to persist through navigation
      localStorage.setItem('booking_service', selectedService);
      
      // Navigate to address selection
      goto('/book/address');
    }
  }
</script>

<svelte:head>
  <title>Book a Cleaning | BrightBroom</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
  <div class="mx-auto max-w-5xl">
    <!-- Page header -->
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Book a Cleaning</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-300">
        Select the type of cleaning service you need
      </p>
    </div>
    
    <!-- Progress steps -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div class="flex flex-1 items-center">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
            <span>1</span>
          </div>
          <div class="ml-2">
            <p class="text-sm font-medium text-primary">Service</p>
          </div>
        </div>
        
        <div class="hidden flex-1 md:flex">
          <div class="h-1 w-full bg-gray-200 dark:bg-gray-700"></div>
        </div>
        
        <div class="flex flex-1 items-center">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
            <span>2</span>
          </div>
          <div class="ml-2">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Address</p>
          </div>
        </div>
        
        <div class="hidden flex-1 md:flex">
          <div class="h-1 w-full bg-gray-200 dark:bg-gray-700"></div>
        </div>
        
        <div class="flex flex-1 items-center">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
            <span>3</span>
          </div>
          <div class="ml-2">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Schedule</p>
          </div>
        </div>
        
        <div class="hidden flex-1 md:flex">
          <div class="h-1 w-full bg-gray-200 dark:bg-gray-700"></div>
        </div>
        
        <div class="flex flex-1 items-center">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
            <span>4</span>
          </div>
          <div class="ml-2">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Review</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Service selection cards -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#if services && services.length > 0}
        {#each services as service}
          <div 
            class={`cursor-pointer rounded-lg border-2 p-6 transition-all hover:shadow-md
              ${selectedService === service.id 
                ? 'border-primary bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20' 
                : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'}`}
            on:click={() => selectService(service.id)}
            on:keydown={(e) => e.key === 'Enter' && selectService(service.id)}
            role="button"
            tabindex="0"
          >
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary dark:bg-primary-900/30">
              <Home size={24} />
            </div>
            
            <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">{service.name}</h3>
            <p class="mb-4 text-sm text-gray-600 dark:text-gray-300">{service.description}</p>
            
            <div class="flex items-end justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Starting at</p>
                <p class="text-2xl font-bold text-primary">
                  R{typeof service.basePrice === 'number' 
                      ? service.basePrice.toFixed(2) 
                      : parseFloat(service.basePrice).toFixed(2)}
                </p>
              </div>
              
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                <p class="text-lg font-medium text-gray-800 dark:text-gray-200">
                  {service.durationHours} {service.durationHours === 1 ? 'hour' : 'hours'}
                </p>
              </div>
            </div>
          </div>
        {/each}
      {:else}
        <div class="col-span-full rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <p class="text-gray-500 dark:text-gray-400">No services available at the moment.</p>
        </div>
      {/if}
    </div>
    
    <!-- Continue button -->
    <div class="mt-8 flex justify-end">
      <Button 
        variant="primary" 
        on:click={continueToNext}
        disabled={!selectedService}
      >
        Continue
        <ArrowRight size={18} class="ml-2" />
      </Button>
    </div>
  </div>
</div>
