<!-- src/routes/book/address/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import AddressSelect from "$lib/components/booking/AddressSelect.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import { MAX_ADDRESSES } from "$lib/constants/address";
  import { ArrowLeft, ArrowRight, Info, Plus } from "lucide-svelte";
  import { onMount } from "svelte";
  
  // Get data from the server
  export let data;
  
  // Extract data from the server
  const { addresses, maxAddresses, hasReachedLimit, remainingAddresses } = data;
  
  // Local state variables
  let selectedAddress = ""; // This was missing!
  let accessInstructions = "";
  let isLoading = false;
  let selectedService = "";
  
  // Initialize data from localStorage on mount
  onMount(() => {
    // Rest of your code remains the same
    selectedService = localStorage.getItem("booking_service") || "";
    
    // If no service selected, go back to service selection
    if (!selectedService) {
      goto("/book");
    }
    
    // Check URL for a 'loading' parameter that might be set during redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("loading") === "true") {
      isLoading = true;
      // Remove the parameter after a short delay
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("loading");
        window.history.replaceState({}, "", url);
        isLoading = false;
      }, 500); // Short delay to ensure UI updates
    }
  });

  // Rest of your code remains the same...
</script>

<svelte:head>
  <title>Select Address | BrightBroom</title>
</svelte:head>

{#if isLoading}
  <!-- Full-page loading overlay -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80 dark:bg-gray-900 dark:bg-opacity-80"
  >
    <div class="flex flex-col items-center space-y-4">
      <div
        class="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"
      ></div>
      <p class="text-lg font-medium text-gray-800 dark:text-white">
        Processing address...
      </p>
    </div>
  </div>
{/if}

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

    <!-- Address limit information -->
    <div
      class="mb-6 bg-blue-50 p-4 rounded-lg dark:bg-blue-900/20 flex items-start"
    >
      <Info
        class="h-5 w-5 mt-0.5 mr-2 flex-shrink-0 text-blue-500 dark:text-blue-400"
      />
      <div>
        <p class="text-blue-800 dark:text-blue-300">
          You are using <span class="font-semibold">{addresses.length}</span> of
          <span class="font-semibold">{MAX_ADDRESSES}</span> available address slots.
        </p>
        {#if hasReachedLimit}
          <p class="text-sm text-blue-700 dark:text-blue-400 mt-1">
            To add a new address, you must first delete an existing one.
          </p>
        {/if}
      </div>
    </div>

    <!-- Add new address button -->
    <div class="mb-6">
      {#if hasReachedLimit}
        <div class="flex flex-col sm:flex-row gap-3">
          <Button
            variant="primary"
            disabled={true}
            title="You have reached the maximum limit of addresses"
            class="w-full sm:w-auto"
          >
            <Plus size={18} class="mr-2" />
            Add New Address (Limit Reached)
          </Button>

          <Button
            variant="secondary"
            on:click={goToManageAddresses}
            class="w-full sm:w-auto"
          >
            Manage My Addresses
          </Button>
        </div>
      {:else}
        <Button
          variant="primary"
          href="/profile/addresses/new?redirectTo=/book/address"
          class="w-full sm:w-auto"
        >
          <Plus size={18} class="mr-2" />
          Add New Address ({remainingAddresses} remaining)
        </Button>
      {/if}
    </div>

    <!-- Address selection with Google Maps integration -->
    <AddressSelect {addresses} bind:selectedAddressId={selectedAddress} />

    <!-- Additional Instructions for existing addresses -->
    {#if selectedAddress && !addresses.find((a) => a.id === selectedAddress)?.instructions}
      <div class="mb-8 mt-8">
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
