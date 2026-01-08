<!-- src/routes/book/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import StepTracker from "$lib/components/booking/StepTracker.svelte";
  import RoomSelector from "$lib/components/booking/RoomSelector.svelte";
  import AddonSelector from "$lib/components/booking/AddonSelector.svelte";
  import PriceSummary from "$lib/components/booking/PriceSummary.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import { ArrowRight, Home, Utensils, Check, Clock } from "lucide-svelte";
  import {
    calculateCleaningPrice,
    formatDuration,
    type PriceBreakdown,
  } from "$lib/utils/pricing";
  import type { PageData } from "./$types";

  // Get data from the server load function using Svelte 5 props
  let { data }: { data: PageData } = $props();
  const { pricingConfig, addons, user, isAuthenticated } = data;

  const siteUrl = import.meta.env.VITE_SITE_URL || "https://brightbroom.com";
  const ogImageUrl = `${siteUrl}/images/brightbroom-og-image.jpg`;

  // Room selection state using $state for reactivity
  let bedroomCount = $state(1);
  let bathroomCount = $state(1);
  let selectedAddonIds: string[] = $state([]);

  // Loading state
  let isLoading = $state(false);

  // Parse pricing config values
  const bedroomMin = pricingConfig.bedroomMin || 1;
  const bedroomMax = pricingConfig.bedroomMax || 10;
  const bathroomMin = pricingConfig.bathroomMin || 1;
  const bathroomMax = pricingConfig.bathroomMax || 6;
  const bedroomDurationMinutes = pricingConfig.bedroomDurationMinutes || 60;
  const bathroomDurationMinutes = pricingConfig.bathroomDurationMinutes || 60;

  // Calculate price breakdown reactively using $derived
  let selectedAddons = $derived(addons.filter((a) => selectedAddonIds.includes(a.id)));
  let priceBreakdown = $derived(calculateCleaningPrice(
    pricingConfig as Parameters<typeof calculateCleaningPrice>[0],
    { bedroomCount, bathroomCount },
    selectedAddons
  ));

  // Handle room selection change (used by RoomSelector's onchange callback)
  function handleRoomChange(data: { bedroomCount: number; bathroomCount: number }) {
    bedroomCount = data.bedroomCount;
    bathroomCount = data.bathroomCount;
  }

  // Handle addon selection change (used by AddonSelector's onchange callback)
  function handleAddonChange(data: { selectedAddonIds: string[] }) {
    selectedAddonIds = data.selectedAddonIds;
  }

  // Continue to next step
  async function continueToNext() {
    isLoading = true;

    try {
      // Store selection in localStorage
      localStorage.setItem("booking_bedroom_count", bedroomCount.toString());
      localStorage.setItem("booking_bathroom_count", bathroomCount.toString());
      localStorage.setItem("booking_addon_ids", JSON.stringify(selectedAddonIds));
      localStorage.setItem("booking_total_price", priceBreakdown.totalPrice.toString());
      localStorage.setItem("booking_total_duration", priceBreakdown.totalDurationMinutes.toString());

      // Store the "general-clean" service ID for backward compatibility
      localStorage.setItem("booking_service", "general-clean");
      localStorage.setItem(
        "booking_service_data",
        JSON.stringify({
          id: "general-clean",
          name: "General Clean",
          price: priceBreakdown.totalPrice,
          duration: priceBreakdown.totalDurationHours,
        })
      );

      // Navigate to address selection
      await goto("/book/address?serviceId=general-clean");
    } catch (error) {
      console.error("Navigation error:", error);
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Book a Cleaning | BrightBroom</title>
  <meta
    name="description"
    content="Cleaner Bookings Made Simple. Build your perfect cleaning package by selecting rooms and add-ons."
  />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={$page.url.href} />
  <meta property="og:title" content="BrightBroom | Build Your Perfect Clean" />
  <meta
    property="og:description"
    content="Cleaner Bookings Made Simple. Customize your cleaning based on your home's bedrooms, bathrooms, and optional add-ons."
  />
  <meta property="og:image" content={ogImageUrl} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content={$page.url.href} />
  <meta name="twitter:title" content="BrightBroom | Build Your Perfect Clean" />
  <meta
    name="twitter:description"
    content="Cleaner Bookings Made Simple. Customize your cleaning based on your home's bedrooms, bathrooms, and optional add-ons."
  />
  <meta name="twitter:image" content={ogImageUrl} />
</svelte:head>

<div class="min-h-screen bg-gray-50 px-4 py-8 pb-28 lg:pb-8 dark:bg-gray-900">
  <div class="mx-auto max-w-5xl">
    <!-- Page header -->
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Build Your Clean
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-300">
        Select your rooms and add optional extras
      </p>
    </div>

    <!-- Progress steps -->
    <StepTracker currentStep={1} />

    <div class="grid gap-8 lg:grid-cols-3">
      <!-- Left column: Selection -->
      <div class="lg:col-span-2 space-y-8">
        <!-- Standard Inclusions Card -->
        <div class="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
          <div class="flex items-center gap-3 mb-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-800">
              <Check class="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-green-800 dark:text-green-200">
                Always Included
              </h2>
              <p class="text-sm text-green-700 dark:text-green-300">
                Standard with every clean
              </p>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <!-- Living Room -->
            <div class="flex items-start gap-3 rounded-lg bg-white p-4 dark:bg-gray-800">
              <Home class="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">Living Room</h3>
                <ul class="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                  <li>• Dusting furniture & surfaces</li>
                  <li>• Mopping & vacuuming floors</li>
                  <li>• Wiping skirtings & switches</li>
                </ul>
              </div>
            </div>

            <!-- Kitchen -->
            <div class="flex items-start gap-3 rounded-lg bg-white p-4 dark:bg-gray-800">
              <Utensils class="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">Kitchen</h3>
                <ul class="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                  <li>• Washing dishes</li>
                  <li>• Wiping surfaces & appliances</li>
                  <li>• Mopping floors</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Room Selection -->
        <div>
          <RoomSelector
            bind:bedroomCount
            bind:bathroomCount
            {bedroomMin}
            {bedroomMax}
            {bathroomMin}
            {bathroomMax}
            {bedroomDurationMinutes}
            {bathroomDurationMinutes}
            currentTotalDuration={priceBreakdown.totalDurationMinutes}
            onchange={handleRoomChange}
          />
        </div>

        <!-- Addons -->
        {#if addons.length > 0}
          <div>
            <AddonSelector
              {addons}
              bind:selectedAddonIds
              currentTotalDuration={priceBreakdown.totalDurationMinutes}
              onchange={handleAddonChange}
            />
          </div>
        {/if}
      </div>

      <!-- Right column: Price Summary (desktop) -->
      <div class="hidden lg:block lg:col-span-1">
        <div class="sticky top-4">
          <PriceSummary breakdown={priceBreakdown} />

          <!-- Continue button -->
          <div class="mt-6">
            <Button
              variant="primary"
              on:click={continueToNext}
              disabled={isLoading}
              class="w-full justify-center"
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
                Continue to Address
                <ArrowRight size={18} class="ml-2" />
              {/if}
            </Button>
          </div>

          <!-- Info text -->
          <p class="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Save up to 15% with recurring bookings
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Fixed bottom bar for mobile -->
<div class="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-800 lg:hidden">
  <div class="mx-auto flex max-w-5xl items-center justify-between gap-4">
    <!-- Price and duration display -->
    <div class="flex flex-col">
      <span class="text-xl font-bold text-gray-900 dark:text-white">
        R{priceBreakdown.totalPrice.toFixed(2)}
      </span>
      <span class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
        <Clock class="h-3 w-3" />
        {formatDuration(priceBreakdown.totalDurationMinutes)}
      </span>
    </div>

    <!-- Continue button -->
    <Button
      variant="primary"
      on:click={continueToNext}
      disabled={isLoading}
      class="flex-1 max-w-xs justify-center"
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
