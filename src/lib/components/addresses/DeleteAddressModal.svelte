<!-- src/lib/components/addresses/DeleteAddressModal.svelte -->
<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte";
  import { AlertTriangle } from "lucide-svelte";
  import { createEventDispatcher } from "svelte";

  // Props
  export let address: {
    id: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    aptUnit?: string;
  } | null = null;
  export let isOpen = false;
  export let isProcessing = false;
  export let hasBookings = false;

  // Event dispatcher
  const dispatch = createEventDispatcher<{
    close: void;
    confirm: { id: string };
  }>();

  // Close the modal
  function close() {
    if (!isProcessing) {
      dispatch("close");
    }
  }

  // Confirm deletion
  function confirmDelete() {
    if (address) {
      dispatch("confirm", { id: address.id });
    }
  }

  // Click outside to close
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  // Keyboard accessibility
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      close();
    }
  }
</script>

{#if isOpen && address}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="delete-modal-title"
  >
    <div
      class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
    >
      <h2
        id="delete-modal-title"
        class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"
      >
        Confirm Address Deletion
      </h2>

      <div class="mb-6">
        <p class="mb-4 text-gray-700 dark:text-gray-300">
          Are you sure you want to delete this address?
        </p>

        <div class="mb-4 rounded-md bg-gray-100 p-3 dark:bg-gray-700">
          <p class="font-medium text-gray-900 dark:text-white">
            {address.street}{address.aptUnit ? `, Unit ${address.aptUnit}` : ""}
          </p>
          <p class="text-gray-600 dark:text-gray-400">
            {address.city}, {address.state}
            {address.zipCode}
          </p>
        </div>

        {#if hasBookings}
          <div
            class="mb-4 flex items-start rounded-md bg-amber-50 p-3 dark:bg-amber-900/20"
          >
            <AlertTriangle
              class="mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-amber-500 dark:text-amber-400"
            />
            <div>
              <p class="text-amber-800 dark:text-amber-300">
                This address is associated with one or more bookings.
              </p>
              <p class="text-sm text-amber-700 dark:text-amber-400">
                The address will be removed from your profile but will still be
                visible in your booking history.
              </p>
            </div>
          </div>
        {/if}
      </div>

      <div class="flex justify-end space-x-3">
        <Button variant="outline" on:click={close} disabled={isProcessing}>
          Cancel
        </Button>

        <Button
          variant="primary"
          on:click={confirmDelete}
          disabled={isProcessing}
          class="!bg-red-600 hover:!bg-red-700 dark:!bg-red-700 dark:hover:!bg-red-800"
        >
          {#if isProcessing}
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
            Deleting...
          {:else}
            Delete Address
          {/if}
        </Button>
      </div>
    </div>
  </div>
{/if}
