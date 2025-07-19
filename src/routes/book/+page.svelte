<!-- src/routes/book/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import ServiceDetailsModal from "$lib/components/booking/ServiceDetailsModal.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import {
    ArrowRight,
    Building,
    Home,
    HousePlus,
    WashingMachine,
  } from "lucide-svelte";

  // Get data from the server load function
  export let data;
  const { services, user, isAuthenticated } = data;

  const siteUrl = import.meta.env.VITE_SITE_URL || "https://brightbroom.com";
  const ogImageUrl = `${siteUrl}/images/brightbroom-og-image.jpg`;

  // Track selected service
  let selectedService = "";

  // Add loading state
  let isLoading = false;

  // Modal state
  let showDetailsModal = false;
  let selectedServiceForDetails = null;

  // Handle service selection
  function selectService(id: string) {
    selectedService = id;
  }

  // Show service details modal
  function showServiceDetails(service) {
    selectedServiceForDetails = service;
    showDetailsModal = true;
  }

  // Continue to next step
  async function continueToNext() {
    if (selectedService) {
      // Show loading state
      isLoading = true;

      try {
        // Store selection in localStorage to persist through navigation
        localStorage.setItem("booking_service", selectedService);

        // Navigate to address selection with serviceId as a query parameter
        await goto(`/book/address?serviceId=${selectedService}`);
      } catch (error) {
        console.error("Navigation error:", error);
      } finally {
        // Reset loading state
        isLoading = false;
      }
    }
  }
</script>

<svelte:head>
  <title>Book a Cleaning | BrightBroom</title>
  <meta
    name="description"
    content="Cleaner Bookings Made Simple. Book professional cleaning services online in minutes and get your space sparkling clean."
  />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content={$page.url.href} />
  <meta
    property="og:title"
    content="BrightBroom | Cleaner Bookings Made Simple"
  />
  <meta
    property="og:description"
    content="Cleaner Bookings Made Simple. Book professional cleaning services online in minutes and get your space sparkling clean."
  />
  <meta property="og:image" content={ogImageUrl} />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content={$page.url.href} />
  <meta
    name="twitter:title"
    content="BrightBroom | Cleaner Bookings Made Simple"
  />
  <meta
    name="twitter:description"
    content="Cleaner Bookings Made Simple. Book professional cleaning services online in minutes and get your space sparkling clean."
  />
  <meta name="twitter:image" content={ogImageUrl} />
</svelte:head>

<div class="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
  <div class="mx-auto max-w-5xl">
    <!-- Page header -->
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Book a Cleaning
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-300">
        Select the type of cleaning service you need
      </p>
    </div>

    <!-- Progress steps -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div class="flex flex-1 items-center">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white"
          >
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
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
          >
            <span>2</span>
          </div>
          <div class="ml-2">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Address
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

    <!-- Service selection cards -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#if services && services.length > 0}
        {#each services as service}
          <div
            class={`cursor-pointer rounded-lg border-2 p-6 transition-all hover:shadow-md
              ${
                selectedService === service.id
                  ? "border-primary bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20"
                  : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              }`}
            on:click={() => selectService(service.id)}
            on:keydown={(e) => (e.key === "Enter" || e.key === " ") && selectService(service.id)}
            role="button"
            tabindex="0"
            aria-label="Select {service.name} service - {service.description}"
          >
            <div class="flex justify-between items-start">
              <div
                class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary dark:bg-primary-900/30"
              >
                <svelte:component
                  this={service.name.includes("Office")
                    ? Building
                    : service.name.includes("Extended")
                      ? HousePlus
                      : service.name.includes("Laundry")
                        ? WashingMachine
                        : Home}
                  size={24}
                />
              </div>

              <button
                type="button"
                on:click|stopPropagation={() => showServiceDetails(service)}
                class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary-50 hover:bg-primary-100 hover:text-primary-700 rounded-md transition-colors dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/40"
                aria-label="View service details"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                View Details
              </button>
            </div>

            <h3
              class="mb-2 text-xl font-semibold text-gray-900 dark:text-white"
            >
              {service.name}
            </h3>
            <p class="mb-4 text-sm text-gray-600 dark:text-gray-300">
              {service.description}
            </p>

            <div class="flex items-end justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Starting at
                </p>
                <p class="text-2xl font-bold text-primary">
                  R{typeof service.basePrice === "number"
                    ? service.basePrice.toFixed(2)
                    : parseFloat(service.basePrice).toFixed(2)}
                </p>
              </div>

              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                <p class="text-lg font-medium text-gray-800 dark:text-gray-200">
                  {service.durationHours}
                  {service.durationHours === 1 ? "hour" : "hours"}
                </p>
              </div>
            </div>
          </div>
        {/each}
      {:else}
        <div
          class="col-span-full rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800"
        >
          <p class="text-gray-500 dark:text-gray-400">
            No services available at the moment.
          </p>
        </div>
      {/if}
    </div>

    <!-- Continue button -->
    <div class="mt-8 flex justify-end">
      <Button
        variant="primary"
        on:click={continueToNext}
        disabled={!selectedService || isLoading}
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

<!-- Service details modal -->
{#if showDetailsModal && selectedServiceForDetails}
  <ServiceDetailsModal
    service={selectedServiceForDetails}
    on:close={() => (showDetailsModal = false)}
  />
{/if}
