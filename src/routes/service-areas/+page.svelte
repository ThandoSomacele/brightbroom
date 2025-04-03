<!-- src/routes/service-areas/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import ServiceAreaMap from '$lib/components/maps/ServiceAreaMap.svelte';
  import { SERVICE_AREAS } from '$lib/utils/serviceAreaValidator';
  import { MapPin, Check } from 'lucide-svelte';
  
  // Environment variables
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  // Local state
  let selectedArea: string | null = null;
  
  // Toggle area selection
  function selectArea(areaName: string) {
    selectedArea = selectedArea === areaName ? null : areaName;
  }
</script>

<svelte:head>
  <title>Service Areas | BrightBroom</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
  <div class="mx-auto max-w-7xl">
    <!-- Hero section -->
    <div class="mb-12 text-center">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white">
        Our Service Areas
      </h1>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-300">
        BrightBroom currently serves select areas in Gauteng, South Africa.
      </p>
    </div>
    
    <!-- Service areas section -->
    <div class="mb-16">
      <div class="mb-6 grid gap-8 lg:grid-cols-5">
        <!-- Map visualization -->
        <div class="lg:col-span-3">
          <div class="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
            <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Coverage Map
            </h2>
            
            <ServiceAreaMap 
              apiKey={googleMapsApiKey} 
              height="400px" 
              showLabels={true}
              selectedAreaName={selectedArea}
            />
            
            <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
              The colored circles represent our current service areas. Click on a location in the list to highlight it on the map.
            </p>
          </div>
        </div>
        
        <!-- Service areas list -->
        <div class="lg:col-span-2">
          <div class="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
            <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Areas We Serve
            </h2>
            
            <ul class="space-y-3">
              {#each SERVICE_AREAS as area}
                <li>
                  <button
                    class={`w-full rounded-lg border-2 p-4 text-left transition-all hover:bg-gray-50 dark:hover:bg-gray-700
                      ${selectedArea === area.name 
                        ? "border-primary bg-primary-50 dark:border-primary-700 dark:bg-primary-900/20" 
                        : "border-gray-200 dark:border-gray-700"}`}
                    on:click={() => selectArea(area.name)}
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center">
                        <MapPin class="mr-3 h-5 w-5 text-primary" />
                        <span class="font-medium text-gray-900 dark:text-white">
                          {area.name}
                        </span>
                      </div>
                      
                      {#if selectedArea === area.name}
                        <div class="rounded-full bg-primary p-1 text-white">
                          <Check class="h-4 w-4" />
                        </div>
                      {/if}
                    </div>
                    
                    <p class="mt-1 pl-8 text-sm text-gray-500 dark:text-gray-400">
                      Service radius: {area.radius} km
                    </p>
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        </div>
      </div>
      
      <!-- Note about expansion -->
      <div class="rounded-lg bg-primary-50 p-6 dark:bg-primary-900/20">
        <h3 class="text-lg font-medium text-primary-800 dark:text-primary-300">
          Expanding Soon
        </h3>
        <p class="mt-2 text-primary-700 dark:text-primary-300">
          We're currently focused on providing exceptional service in our launch areas. 
          We plan to expand to more neighborhoods in Gauteng soon! If your area isn't currently covered,
          please leave your email with us and we'll notify you when we expand to your location.
        </p>
        <div class="mt-4">
          <Button variant="primary" href="/contact?subject=Service Area Request">
            Request Your Area
          </Button>
        </div>
      </div>
    </div>
    
    <!-- FAQ section -->
    <div class="mb-16">
      <h2 class="mb-6 text-2xl font-bold text-center text-gray-900 dark:text-white">
        Frequently Asked Questions
      </h2>
      
      <div class="space-y-4">
        <div class="rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            class="flex w-full items-center justify-between p-4 text-left focus:outline-none"
            aria-expanded="true"
          >
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Why are you only serving select areas?
            </h3>
          </button>
          <div class="p-4 pt-0">
            <p class="text-gray-600 dark:text-gray-300">
              We're starting with a focused approach to ensure we can provide the highest quality service. 
              By concentrating on specific areas, we can guarantee reliable scheduling, consistent cleaning quality, 
              and prompt customer support.
            </p>
          </div>
        </div>
        
        <div class="rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            class="flex w-full items-center justify-between p-4 text-left focus:outline-none"
            aria-expanded="true"
          >
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              When will you expand to more areas?
            </h3>
          </button>
          <div class="p-4 pt-0">
            <p class="text-gray-600 dark:text-gray-300">
              We plan to expand our service areas regularly. Our expansion is guided by customer demand, 
              cleaner availability, and our operational capacity. Sign up for our newsletter or leave your information
              on our contact page to be notified when we expand to your area.
            </p>
          </div>
        </div>
        
        <div class="rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            class="flex w-full items-center justify-between p-4 text-left focus:outline-none"
            aria-expanded="true"
          >
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              What if I'm just outside a service area?
            </h3>
          </button>
          <div class="p-4 pt-0">
            <p class="text-gray-600 dark:text-gray-300">
              If your address is just outside our current service areas, please contact us directly. 
              In some cases, we may be able to accommodate locations that are slightly outside our official boundaries,
              depending on cleaner availability.
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- CTA section -->
    <div class="rounded-lg bg-primary p-8 text-center text-white">
      <h2 class="mb-4 text-2xl font-bold">Ready to Book a Cleaning?</h2>
      <p class="mb-6 text-white/90">
        Experience our professional cleaning services in your area today.
      </p>
      <Button variant="secondary" href="/book">
        Book Now
      </Button>
    </div>
  </div>
</div>
