<!-- src/lib/components/booking/RoomSelector.svelte -->
<script lang="ts">
  import { Bed, Bath, Minus, Plus, Info, X, AlertCircle } from "lucide-svelte";
  import { MAX_BOOKING_DURATION_MINUTES } from "$lib/utils/pricing";

  // Props using Svelte 5 runes
  interface Props {
    bedroomCount?: number;
    bathroomCount?: number;
    bedroomMin?: number;
    bedroomMax?: number;
    bathroomMin?: number;
    bathroomMax?: number;
    bedroomDurationMinutes?: number;
    bathroomDurationMinutes?: number;
    currentTotalDuration?: number;
    onchange?: (data: { bedroomCount: number; bathroomCount: number }) => void;
  }

  let {
    bedroomCount = $bindable(1),
    bathroomCount = $bindable(1),
    bedroomMin = 1,
    bedroomMax = 10,
    bathroomMin = 1,
    bathroomMax = 6,
    bedroomDurationMinutes = 60,
    bathroomDurationMinutes = 60,
    currentTotalDuration = 0,
    onchange,
  }: Props = $props();

  // Check if adding another room would exceed the max duration
  let canAddBedroom = $derived(
    bedroomCount < bedroomMax &&
    currentTotalDuration + bedroomDurationMinutes <= MAX_BOOKING_DURATION_MINUTES
  );
  let canAddBathroom = $derived(
    bathroomCount < bathroomMax &&
    currentTotalDuration + bathroomDurationMinutes <= MAX_BOOKING_DURATION_MINUTES
  );

  // Check if we're at the duration limit
  let atDurationLimit = $derived(currentTotalDuration >= MAX_BOOKING_DURATION_MINUTES);

  // State for showing info popup
  let showInfoPopup = $state(false);

  function toggleInfoPopup() {
    showInfoPopup = !showInfoPopup;
  }

  function closeInfoPopup() {
    showInfoPopup = false;
  }

  // Increment/decrement handlers
  function incrementBedrooms() {
    if (canAddBedroom) {
      bedroomCount++;
      dispatchChange();
    }
  }

  function decrementBedrooms() {
    if (bedroomCount > bedroomMin) {
      bedroomCount--;
      dispatchChange();
    }
  }

  function incrementBathrooms() {
    if (canAddBathroom) {
      bathroomCount++;
      dispatchChange();
    }
  }

  function decrementBathrooms() {
    if (bathroomCount > bathroomMin) {
      bathroomCount--;
      dispatchChange();
    }
  }

  function dispatchChange() {
    onchange?.({
      bedroomCount,
      bathroomCount,
    });
  }
</script>

<div class="space-y-6">
  <!-- Header with info button -->
  <div class="relative flex items-center justify-between">
    <div class="flex items-center gap-2">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Select Your Rooms
      </h3>
      <button
        type="button"
        onclick={toggleInfoPopup}
        class="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        aria-label="View what's included in each room"
      >
        <Info class="h-4 w-4" />
      </button>
    </div>

    <!-- Info popup -->
    {#if showInfoPopup}
      <div class="absolute left-0 top-full z-10 mt-2 w-full max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-start justify-between gap-2 mb-3">
          <h4 class="font-medium text-gray-900 dark:text-white">What's Included</h4>
          <button
            type="button"
            onclick={closeInfoPopup}
            class="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 flex-shrink-0"
            aria-label="Close"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <h5 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Bed class="h-4 w-4 text-primary-500" />
              Each bedroom includes:
            </h5>
            <ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400 pl-6">
              <li class="flex items-center gap-2">
                <span class="text-green-500">✓</span> Making bed
              </li>
              <li class="flex items-center gap-2">
                <span class="text-green-500">✓</span> Vacuuming and/or mopping floors
              </li>
              <li class="flex items-center gap-2">
                <span class="text-green-500">✓</span> Dusting furniture and surfaces
              </li>
              <li class="flex items-center gap-2">
                <span class="text-green-500">✓</span> Dusting and wiping skirtings
              </li>
            </ul>
          </div>

          <div>
            <h5 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Bath class="h-4 w-4 text-secondary-500" />
              Each bathroom includes:
            </h5>
            <ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400 pl-6">
              <li class="flex items-center gap-2">
                <span class="text-green-500">✓</span> Cleaning shower, bath and sinks
              </li>
              <li class="flex items-center gap-2">
                <span class="text-green-500">✓</span> Wiping counters and taps
              </li>
              <li class="flex items-center gap-2">
                <span class="text-green-500">✓</span> Wiping walls and mirrors
              </li>
              <li class="flex items-center gap-2">
                <span class="text-green-500">✓</span> Mopping floors
              </li>
            </ul>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Bedroom selector -->
  <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
          <Bed class="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-white">Bedrooms</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            How many bedrooms need cleaning?
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          onclick={decrementBedrooms}
          disabled={bedroomCount <= bedroomMin}
          class="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          aria-label="Decrease bedrooms"
        >
          <Minus class="h-5 w-5" />
        </button>

        <span class="w-8 text-center text-xl font-bold text-gray-900 dark:text-white">
          {bedroomCount}
        </span>

        <button
          type="button"
          onclick={incrementBedrooms}
          disabled={!canAddBedroom}
          class="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          aria-label="Increase bedrooms"
        >
          <Plus class="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>

  <!-- Bathroom selector -->
  <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-900/30">
          <Bath class="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-white">Bathrooms</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            How many bathrooms need cleaning?
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          onclick={decrementBathrooms}
          disabled={bathroomCount <= bathroomMin}
          class="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          aria-label="Decrease bathrooms"
        >
          <Minus class="h-5 w-5" />
        </button>

        <span class="w-8 text-center text-xl font-bold text-gray-900 dark:text-white">
          {bathroomCount}
        </span>

        <button
          type="button"
          onclick={incrementBathrooms}
          disabled={!canAddBathroom}
          class="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          aria-label="Increase bathrooms"
        >
          <Plus class="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>

  <!-- Duration limit warning -->
  {#if atDurationLimit}
    <div class="flex items-start gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
      <AlertCircle class="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
      <p class="text-sm text-amber-700 dark:text-amber-300">
        Maximum booking duration (10 hours) reached. Remove items to add more rooms.
      </p>
    </div>
  {/if}
</div>

<!-- Click outside to close popup -->
{#if showInfoPopup}
  <button
    type="button"
    class="fixed inset-0 z-0 cursor-default"
    onclick={closeInfoPopup}
    aria-label="Close popup"
  ></button>
{/if}
