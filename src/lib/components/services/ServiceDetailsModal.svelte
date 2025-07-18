<!-- src/lib/components/services/ServiceDetailsModal.svelte -->
<script lang="ts">
  import {
    formatDuration,
    generateDefaultServiceDetails,
    type Service,
  } from "$lib/services";
  import { CheckCircle, X } from "lucide-svelte";
  import { createEventDispatcher, onMount } from "svelte";

  // Props
  export let service: Partial<Service> & {
    name: string;
    basePrice: number;
    durationHours: number;
  };

  const dispatch = createEventDispatcher();

  // Focus trap variables
  let modalElement: HTMLDivElement;
  let previouslyFocusedElement: HTMLElement | null = null;

  // Ensure service details are available, fallback to generated defaults
  $: details = service.details
    ? typeof service.details === "string"
      ? JSON.parse(service.details)
      : service.details
    : service.type
      ? generateDefaultServiceDetails(service.name, service.type)
      : generateDefaultServiceDetails(service.name, "regular");

  // Focus trap implementation
  onMount(() => {
    // Store the previously focused element
    previouslyFocusedElement = document.activeElement as HTMLElement;
    
    // Focus the first focusable element in the modal
    const focusableElements = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    // Return cleanup function
    return () => {
      // Restore focus to the previously focused element
      if (previouslyFocusedElement) {
        previouslyFocusedElement.focus();
      }
    };
  });

  // Handle tab key for focus trapping
  function handleTabKey(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;

    const focusableElements = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusableElement = focusableElements[0] as HTMLElement;
    const lastFocusableElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusableElement) {
        lastFocusableElement.focus();
        event.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusableElement) {
        firstFocusableElement.focus();
        event.preventDefault();
      }
    }
  }

  // Close modal
  function close() {
    dispatch("close");
  }

  // Handle escape key and clicking outside
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      close();
    }
    handleTabKey(event);
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      close();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
  on:click={handleBackdropClick}
  on:keydown={handleKeydown}
  role="presentation"
>
  <div
    bind:this={modalElement}
    class="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white shadow-xl dark:bg-gray-800"
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
        {service.name} Details
      </h2>
      <button
        type="button"
        class="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
        on:click={close}
        aria-label="Close"
      >
        <X size={20} />
      </button>
    </div>

    <!-- Modal content -->
    <div class="p-6">
      <!-- Service overview -->
      <div class="mb-6">
        <p class="text-gray-700 dark:text-gray-300">{service.description}</p>

        <div class="mt-4 grid grid-cols-1 gap-4">
          <!-- <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
            <p class="text-sm text-gray-500 dark:text-gray-400">Price</p>
            <p class="text-2xl font-bold text-primary">
              {formatCurrency(service.basePrice)}
            </p>
          </div> -->

          <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
            <p class="text-sm text-gray-500 dark:text-gray-400">Duration</p>
            <p class="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {formatDuration(service.durationHours)}
            </p>
          </div>
        </div>
      </div>

      <!-- Service details -->
      {#if details && details.items && details.items.length > 0}
        <div class="space-y-6">
          {#each details.items as item}
            <div class="rounded-lg border border-gray-200 dark:border-gray-700">
              <div class="bg-gray-50 px-4 py-3 dark:bg-gray-700">
                <h3 class="font-medium text-gray-800 dark:text-white">
                  {item.area}
                </h3>
              </div>
              <div class="p-4">
                <ul class="space-y-2">
                  {#each item.details as detail}
                    <li class="flex items-start">
                      <CheckCircle
                        size={16}
                        class="mr-2 mt-1 flex-shrink-0 text-primary"
                      />
                      <span class="text-gray-700 dark:text-gray-300"
                        >{detail}</span
                      >
                    </li>
                  {/each}
                </ul>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700/50">
          <p class="text-gray-500 dark:text-gray-400">
            No detailed information available for this service.
          </p>
        </div>
      {/if}

      <!-- Disclaimer -->
      <div
        class="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-700/50 dark:text-gray-300"
      >
        <p>
          <strong>Please note:</strong> Prices include VAT. Actual duration may vary
          slightly depending on the specific requirements of your space.
        </p>
      </div>
    </div>

    <!-- Modal footer -->
    <div
      class="flex justify-end border-t border-gray-200 px-6 py-4 dark:border-gray-700"
    >
      <button
        type="button"
        class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
        on:click={close}
      >
        Close
      </button>
    </div>
  </div>
</div>
