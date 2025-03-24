<!-- src/routes/book/address/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import { MapPin, Home, ArrowRight, ArrowLeft } from 'lucide-svelte';
  
  // Get data from the server load function
  export let data;
  const { addresses } = data;
  
  // Track selected address
  let selectedAddress = '';
  let accessInstructions = '';
  
  // Add loading state
  let isLoading = false;
  
  // Get service from localStorage
  let selectedService = '';
  
  // Initialize data from localStorage on mount
  import { onMount } from 'svelte';
  
  onMount(() => {
    selectedService = localStorage.getItem('booking_service') || '';
    
    // If no service selected, go back to service selection
    if (!selectedService) {
      goto('/book');
    }
  });
  
  // Handle address selection
  function selectAddress(id: string) {
    selectedAddress = id;
  }
  
  // Continue to next step
  async function continueToNext() {
    if (selectedAddress) {
      // Show loading state
      isLoading = true;
      
      try {
        // Store selections in localStorage to persist through navigation
        localStorage.setItem('booking_address', selectedAddress);
        localStorage.setItem('booking_instructions', accessInstructions);
        
        // Navigate to scheduling
        await goto('/book/schedule');
      } catch (error) {
        console.error('Navigation error:', error);
      } finally {
        // Reset loading state (though this won't be seen due to navigation)
        isLoading = false;
      }
    }
  }
  
  // Go back to previous step
  function goToPrevious() {
    isLoading = true;
    goto('/book');
  }
</script>

<svelte:head>
  <title>Select Address | BrightBroom</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
  <div class="mx-auto max-w-5xl">
    <!-- Page header -->
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Select Address
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-300">
        Choose where you'd like your cleaning service
      </p>
    </div>

    <!-- Progress steps -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div class="flex flex-1 items-center">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white"
          >
            <span>✓</span>
          </div>
          <div class="ml-2">
            <p class="text-sm font-medium text-green-500">Service</p>
          </div>
        </div>

        <div class="hidden flex-1 md:flex">
          <div class="h-1 w-full bg-primary"></div>
        </div>

        <div class="flex flex-1 items-center">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white"
          >
            <span>2</span>
          </div>
          <div class="ml-2">
            <p class="text-sm font-medium text-primary">Address</p>
          </div>
        </div>

        <div class="hidden flex-1 md:flex">
          <div class="h-1 w-full bg-gray-200 dark:bg-gray-700"></div>
        </div>

        <div class="flex flex-1 items-center">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
          >
            <span>3</span>
          </div>
          <div class="ml-2">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Schedule
            </p>
          </div>
        </div>

        <div class="hidden flex-1 md:flex">
          <div class="h-1 w-full bg-gray-200 dark:bg-gray-700"></div>
        </div>

        <div class="flex flex-1 items-center">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
          >
            <span>4</span>
          </div>
          <div class="ml-2">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Review
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Address selection -->
    <div class="mb-8">
      <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
        Your Addresses
      </h2>

      {#if addresses.length === 0}
        <div
          class="mb-6 rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800"
        >
          <div
            class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
          >
            <MapPin size={24} class="text-gray-500 dark:text-gray-400" />
          </div>
          <h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-white">
            No addresses found
          </h3>
          <p class="mb-4 text-gray-600 dark:text-gray-400">
            You haven't added any addresses yet. Add an address to continue with
            your booking.
          </p>
          <Button
            variant="primary"
            href="/profile/addresses/new?redirectTo=/book/address"
          >
            Add New Address
          </Button>
        </div>
      {:else}
        <div class="grid gap-4 md:grid-cols-2">
          {#each addresses as address}
            <div
              class={`cursor-pointer rounded-lg border-2 p-5 transition-all hover:shadow-md
                  ${
                    selectedAddress === address.id
                      ? "border-primary bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20"
                      : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                  }`}
              on:click={() => selectAddress(address.id)}
              on:keydown={(e) => e.key === "Enter" && selectAddress(address.id)}
              role="button"
              tabindex="0"
            >
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary dark:bg-primary-900/20"
                  >
                    <Home size={20} />
                  </div>
                </div>

                <div class="ml-4">
                  <div class="flex items-center">
                    <h3
                      class="text-lg font-medium text-gray-900 dark:text-white"
                    >
                      {address.street}
                    </h3>
                    {#if address.isDefault}
                      <span
                        class="ml-2 inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary dark:bg-primary-900/20"
                      >
                        Default
                      </span>
                    {/if}
                  </div>

                  {#if address.aptUnit}
                    <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      Unit {address.aptUnit}
                    </p>
                  {/if}

                  <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {address.city}, {address.state}
                    {address.zipCode}
                  </p>
                </div>
              </div>
            </div>
          {/each}

          <!-- Add new address card -->
          <div
            class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-5 text-center hover:border-primary-300 dark:border-gray-700 dark:hover:border-primary-700"
            on:click={() =>
              goto("/profile/addresses/new?redirectTo=/book/address")}
            on:keydown={(e) =>
              e.key === "Enter" &&
              goto("/profile/addresses/new?redirectTo=/book/address")}
            role="button"
            tabindex="0"
          >
            <div
              class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
            >
              <MapPin size={24} class="text-gray-600 dark:text-gray-400" />
            </div>
            <h3 class="mb-1 text-lg font-medium text-gray-900 dark:text-white">
              Add New Address
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Add a new location for your cleaning service
            </p>
          </div>
        </div>
      {/if}
    </div>

    <!-- Special instructions -->
    {#if addresses.length > 0}
      <div class="mb-8">
        <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Access Instructions (Optional)
        </h2>
        <div class="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <textarea
            bind:value={accessInstructions}
            rows={4}
            class="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Provide any special instructions for accessing your property (e.g. gate code, key location, etc.)"
          ></textarea>
        </div>
      </div>
    {/if}

    <!-- Navigation buttons -->
    <div class="flex justify-between">
      <Button variant="outline" on:click={goToPrevious} disabled={isLoading}>
        {#if isLoading}
          <svg
            class="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading...
        {:else}
          <ArrowLeft size={18} class="mr-2" />
          Back
        {/if}
      </Button>

      <Button
        variant="primary"
        on:click={continueToNext}
        disabled={!selectedAddress || isLoading}
      >
        {#if isLoading}
          <svg
            class="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading...
        {:else}
          Continue
          <ArrowRight size={18} class="ml-2" />
        {/if}
      </Button>
    </div>
  </div>
</div>
