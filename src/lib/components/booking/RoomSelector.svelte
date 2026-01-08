<!-- src/lib/components/booking/RoomSelector.svelte -->
<script lang="ts">
  import { Bed, Bath, Minus, Plus } from "lucide-svelte";
  import { formatPrice } from "$lib/utils/pricing";

  // Props using Svelte 5 runes
  interface Props {
    bedroomCount?: number;
    bathroomCount?: number;
    bedroomMin?: number;
    bedroomMax?: number;
    bathroomMin?: number;
    bathroomMax?: number;
    bedroomPrice?: number;
    bathroomPrice?: number;
    onchange?: (data: { bedroomCount: number; bathroomCount: number }) => void;
  }

  let {
    bedroomCount = $bindable(1),
    bathroomCount = $bindable(1),
    bedroomMin = 1,
    bedroomMax = 10,
    bathroomMin = 1,
    bathroomMax = 6,
    bedroomPrice = 36,
    bathroomPrice = 36,
    onchange,
  }: Props = $props();

  // Increment/decrement handlers
  function incrementBedrooms() {
    if (bedroomCount < bedroomMax) {
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
    if (bathroomCount < bathroomMax) {
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

  // Reactive calculations
  let bedroomTotal = $derived(bedroomCount * bedroomPrice);
  let bathroomTotal = $derived(bathroomCount * bathroomPrice);
</script>

<div class="space-y-6">
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
            {formatPrice(bedroomPrice)} per bedroom
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
          disabled={bedroomCount >= bedroomMax}
          class="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          aria-label="Increase bedrooms"
        >
          <Plus class="h-5 w-5" />
        </button>
      </div>
    </div>

    {#if bedroomCount > 0}
      <div class="mt-3 text-right">
        <span class="text-sm font-medium text-primary-600 dark:text-primary-400">
          {formatPrice(bedroomTotal)}
        </span>
      </div>
    {/if}
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
            {formatPrice(bathroomPrice)} per bathroom
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
          disabled={bathroomCount >= bathroomMax}
          class="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          aria-label="Increase bathrooms"
        >
          <Plus class="h-5 w-5" />
        </button>
      </div>
    </div>

    {#if bathroomCount > 0}
      <div class="mt-3 text-right">
        <span class="text-sm font-medium text-secondary-600 dark:text-secondary-400">
          {formatPrice(bathroomTotal)}
        </span>
      </div>
    {/if}
  </div>

  <!-- What's included info -->
  <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
    <h4 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
      Each bedroom includes:
    </h4>
    <ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
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

    <h4 class="mb-2 mt-4 text-sm font-medium text-gray-700 dark:text-gray-300">
      Each bathroom includes:
    </h4>
    <ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
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
