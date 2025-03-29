<!-- src/lib/components/services/ServiceDetailsModal.svelte -->
<script lang="ts">
  import type { ServiceLineItem } from "$lib/utils/service-data";
  import {
    calculateServiceTotals,
    groupServiceItemsByArea,
    loadServiceData,
  } from "$lib/utils/service-data";
  import { Clock, DollarSign, Info, X } from "lucide-svelte";
  import { onMount } from "svelte";
  import { fade, scale } from "svelte/transition";

  // Props
  export let serviceType: "regular" | "extended" = "regular";
  export let serviceName: string =
    serviceType === "regular" ? "Regular Cleaning" : "Extended Cleaning";

  // State
  let isOpen = false;
  let loading = false;
  let error: string | null = null;
  let lineItems: ServiceLineItem[] = [];
  let groupedItems: Record<string, ServiceLineItem[]> = {};
  let totals = { totalPrice: 0, totalDuration: 0 };

  // Function to open the modal
  export function open() {
    isOpen = true;
    if (lineItems.length === 0 && !loading) {
      loadItems();
    }
  }

  // Function to close the modal
  export function close() {
    isOpen = false;
  }

  // Load service items from CSV
  async function loadItems() {
    loading = true;
    error = null;

    try {
      lineItems = await loadServiceData(serviceType);
      groupedItems = groupServiceItemsByArea(lineItems);
      totals = calculateServiceTotals(lineItems);
    } catch (err) {
      console.error("Error loading service details:", err);
      error = "Failed to load service details. Please try again.";
    } finally {
      loading = false;
    }
  }

  // Format price to ZAR currency
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  }

  // Format duration to hours and minutes
  function formatDuration(hours: number): string {
    if (hours === 0) return "0 min";

    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);

    if (wholeHours === 0) return `${minutes} min`;
    if (minutes === 0)
      return `${wholeHours} ${wholeHours === 1 ? "hour" : "hours"}`;

    return `${wholeHours} ${wholeHours === 1 ? "hour" : "hours"} ${minutes} min`;
  }

  // Handle click outside to close
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains("modal-backdrop")) {
      close();
    }
  }

  // Handle escape key to close
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      close();
    }
  }

  // Add event listeners
  onMount(() => {
    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  });
</script>

<!-- Trigger button -->
<button
  type="button"
  on:click={open}
  class="inline-flex items-center text-sm font-medium text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
  aria-label="View service details"
>
  <Info size={18} class="mr-1" />
  <span>View Details</span>
</button>

<!-- Modal (only rendered when open) -->
{#if isOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop bg-black bg-opacity-50 dark:bg-opacity-60"
    on:click={handleClickOutside}
    transition:fade={{ duration: 200 }}
  >
    <div
      class="w-full max-h-[90vh] max-w-4xl overflow-auto rounded-lg bg-white shadow-xl dark:bg-gray-800"
      transition:scale={{ duration: 200, start: 0.95 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-details-title"
    >
      <!-- Modal header -->
      <div
        class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700"
      >
        <h2
          id="service-details-title"
          class="text-xl font-semibold text-gray-900 dark:text-white"
        >
          {serviceName} Details
        </h2>
        <button
          type="button"
          on:click={close}
          class="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      <!-- Modal content -->
      <div class="px-6 py-4">
        {#if loading}
          <div class="flex items-center justify-center py-10">
            <div
              class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
            ></div>
            <span class="ml-3 text-gray-600 dark:text-gray-300"
              >Loading service details...</span
            >
          </div>
        {:else if error}
          <div
            class="rounded-md bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-200"
          >
            <p>{error}</p>
            <button
              class="mt-2 text-sm font-medium text-red-700 underline dark:text-red-200"
              on:click={loadItems}
            >
              Try again
            </button>
          </div>
        {:else}
          <!-- Service overview -->
          <div class="mb-6">
            <p class="text-gray-700 dark:text-gray-300">
              Here's a detailed breakdown of what's included in our {serviceName.toLowerCase()}
              service. All prices are inclusive of VAT.
            </p>
          </div>

          <!-- Summary stats -->
          <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="rounded-lg bg-primary-50 p-4 dark:bg-primary-900/20">
              <div class="flex items-center">
                <Clock class="mr-2 h-5 w-5 text-primary" />
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  Total Duration
                </h3>
              </div>
              <p class="mt-2 text-2xl font-bold text-primary">
                {formatDuration(totals.totalDuration)}
              </p>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Estimated time for completion
              </p>
            </div>

            <div class="rounded-lg bg-primary-50 p-4 dark:bg-primary-900/20">
              <div class="flex items-center">
                <DollarSign class="mr-2 h-5 w-5 text-primary" />
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  Total Price
                </h3>
              </div>
              <p class="mt-2 text-2xl font-bold text-primary">
                {formatCurrency(totals.totalPrice)}
              </p>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                All prices include VAT
              </p>
            </div>
          </div>

          <!-- Detailed line items by area -->
          <div class="space-y-6">
            {#each Object.entries(groupedItems) as [area, items]}
              <div
                class="rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div class="bg-gray-50 px-4 py-3 dark:bg-gray-700">
                  <h3 class="font-medium text-gray-900 dark:text-white">
                    {area}
                  </h3>
                </div>
                <div class="px-4 py-2">
                  <table class="w-full">
                    <thead class="text-sm text-gray-600 dark:text-gray-400">
                      <tr>
                        <th class="py-2 text-left">Task</th>
                        <th class="py-2 text-right">Duration</th>
                        <th class="py-2 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody
                      class="divide-y divide-gray-200 dark:divide-gray-700"
                    >
                      {#each items as item}
                        <tr class="text-gray-800 dark:text-gray-200">
                          <td class="py-2 text-left">{item.area}</td>
                          <td class="py-2 text-right"
                            >{formatDuration(item.duration)}</td
                          >
                          <td class="py-2 text-right"
                            >{formatCurrency(item.price)}</td
                          >
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              </div>
            {/each}
          </div>

          <!-- Disclaimer -->
          <div
            class="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-700/50 dark:text-gray-300"
          >
            <p>
              <strong>Please note:</strong> Actual duration and prices may vary based
              on your specific requirements and the condition of your space. All
              services are subject to our terms and conditions.
            </p>
          </div>
        {/if}
      </div>

      <!-- Modal footer -->
      <div
        class="flex justify-end border-t border-gray-200 px-6 py-4 dark:border-gray-700"
      >
        <button
          type="button"
          on:click={close}
          class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}
