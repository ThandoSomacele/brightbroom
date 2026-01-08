<!-- src/lib/components/booking/PriceSummary.svelte -->
<script lang="ts">
  import { Clock, Home, Bed, Bath, Sparkles, Tag } from "lucide-svelte";
  import { formatPrice, formatDuration } from "$lib/utils/pricing";
  import type { PriceBreakdown } from "$lib/utils/pricing";

  // Props using Svelte 5 runes
  interface Props {
    breakdown: PriceBreakdown;
    showDetails?: boolean;
    discountPercentage?: number;
    compact?: boolean;
  }

  let {
    breakdown,
    showDetails = true,
    discountPercentage = 0,
    compact = false,
  }: Props = $props();

  // Calculate discount if applicable
  let discountAmount = $derived((breakdown.totalPrice * discountPercentage) / 100);
  let finalPrice = $derived(breakdown.totalPrice - discountAmount);
</script>

{#if compact}
  <!-- Compact view for review pages -->
  <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {breakdown.bedroomCount} bedroom{breakdown.bedroomCount > 1 ? "s" : ""},
          {breakdown.bathroomCount} bathroom{breakdown.bathroomCount > 1 ? "s" : ""}
          {#if breakdown.addons.length > 0}
            + {breakdown.addons.length} add-on{breakdown.addons.length > 1 ? "s" : ""}
          {/if}
        </p>
        <p class="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <Clock class="h-4 w-4" />
          {formatDuration(breakdown.totalDurationMinutes)}
        </p>
      </div>
      <div class="text-right">
        {#if discountPercentage > 0}
          <p class="text-sm text-gray-500 line-through">{formatPrice(breakdown.totalPrice)}</p>
          <p class="text-xl font-bold text-primary-600 dark:text-primary-400">{formatPrice(finalPrice)}</p>
        {:else}
          <p class="text-xl font-bold text-primary-600 dark:text-primary-400">{formatPrice(breakdown.totalPrice)}</p>
        {/if}
      </div>
    </div>
  </div>
{:else}
  <!-- Full detailed view -->
  <div class="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
    <div class="border-b border-gray-200 p-4 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Price Summary
      </h3>
    </div>

    <div class="p-4">
      {#if showDetails}
        <!-- Line items -->
        <div class="space-y-3">
          <!-- Base (Living Room + Kitchen) -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Home class="h-4 w-4 text-gray-400" />
              <span class="text-gray-700 dark:text-gray-300">
                Living Room & Kitchen
              </span>
            </div>
            <span class="font-medium text-gray-900 dark:text-white">
              {formatPrice(breakdown.basePrice)}
            </span>
          </div>

          <!-- Bedrooms -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Bed class="h-4 w-4 text-gray-400" />
              <span class="text-gray-700 dark:text-gray-300">
                {breakdown.bedroomCount} Bedroom{breakdown.bedroomCount > 1 ? "s" : ""}
                <span class="text-sm text-gray-500">
                  ({breakdown.bedroomCount} × {formatPrice(breakdown.bedroomPricePerRoom)})
                </span>
              </span>
            </div>
            <span class="font-medium text-gray-900 dark:text-white">
              {formatPrice(breakdown.bedroomTotal)}
            </span>
          </div>

          <!-- Bathrooms -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Bath class="h-4 w-4 text-gray-400" />
              <span class="text-gray-700 dark:text-gray-300">
                {breakdown.bathroomCount} Bathroom{breakdown.bathroomCount > 1 ? "s" : ""}
                <span class="text-sm text-gray-500">
                  ({breakdown.bathroomCount} × {formatPrice(breakdown.bathroomPricePerRoom)})
                </span>
              </span>
            </div>
            <span class="font-medium text-gray-900 dark:text-white">
              {formatPrice(breakdown.bathroomTotal)}
            </span>
          </div>

          <!-- Addons -->
          {#if breakdown.addons.length > 0}
            <div class="border-t border-gray-100 pt-3 dark:border-gray-700">
              <div class="mb-2 flex items-center gap-2">
                <Sparkles class="h-4 w-4 text-primary-500" />
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Add-ons
                </span>
              </div>
              {#each breakdown.addons as addon}
                <div class="flex items-center justify-between py-1 pl-6">
                  <span class="text-gray-600 dark:text-gray-400">{addon.name}</span>
                  <span class="font-medium text-gray-900 dark:text-white">
                    {formatPrice(addon.price)}
                  </span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}

      <!-- Total section -->
      <div class="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
        <!-- Duration -->
        <div class="mb-3 flex items-center justify-between text-sm">
          <span class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Clock class="h-4 w-4" />
            Estimated Duration
          </span>
          <span class="font-medium text-gray-700 dark:text-gray-300">
            {formatDuration(breakdown.totalDurationMinutes)}
          </span>
        </div>

        <!-- Discount if applicable -->
        {#if discountPercentage > 0}
          <div class="mb-2 flex items-center justify-between">
            <span class="text-gray-600 dark:text-gray-400">Subtotal</span>
            <span class="text-gray-500 line-through">
              {formatPrice(breakdown.totalPrice)}
            </span>
          </div>
          <div class="mb-2 flex items-center justify-between text-green-600 dark:text-green-400">
            <span class="flex items-center gap-2">
              <Tag class="h-4 w-4" />
              Recurring Discount ({discountPercentage}%)
            </span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        {/if}

        <!-- Final total -->
        <div class="flex items-center justify-between">
          <span class="text-lg font-semibold text-gray-900 dark:text-white">
            {discountPercentage > 0 ? "Total (per clean)" : "Total"}
          </span>
          <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {formatPrice(discountPercentage > 0 ? finalPrice : breakdown.totalPrice)}
          </span>
        </div>
      </div>
    </div>
  </div>
{/if}
