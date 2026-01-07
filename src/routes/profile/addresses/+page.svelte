<!-- src/routes/profile/addresses/+page.svelte -->
<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte";
  import DeleteAddressModal from "$lib/components/addresses/DeleteAddressModal.svelte";
  import { Edit, MapPin, Plus, Star, Trash2, AlertTriangle, CheckCircle } from "lucide-svelte";
  import { enhance, applyAction, deserialize } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import { page } from "$app/stores";
  import { fly, fade } from "svelte/transition";
  import { onMount } from "svelte";
  import type { Address } from "$lib/server/db/schema";

  export let data;
  export let form; // For form result handling

  // Use reactive statements to update when data changes after invalidateAll()
  $: ({ addresses, maxAddresses, hasReachedLimit, error: pageError, success: pageSuccess } = data);

  // State for delete confirmation - using compatible type with DeleteAddressModal
  let deleteModal: {
    isOpen: boolean;
    addressToDelete: {
      id: string;
      street: string;
      city: string;
      state: string;
      zipCode: string;
      aptUnit?: string;
    } | null;
    isProcessing: boolean;
    hasBookings: boolean;
  } = {
    isOpen: false,
    addressToDelete: null,
    isProcessing: false,
    hasBookings: false
  };

  // Success notification
  let showSuccessNotification = false;
  let successMessage = "";
  
  onMount(() => {
    // Show success notification if we have a success message from the URL
    if (pageSuccess) {
      successMessage = pageSuccess;
      showSuccessNotification = true;
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        showSuccessNotification = false;
      }, 5000);
    }
  });

  // Function to show delete confirmation
  async function confirmDelete(address: Address) {
    // Convert Address to modal-compatible type (null -> undefined for aptUnit)
    const modalAddress = {
      id: address.id,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      aptUnit: address.aptUnit ?? undefined
    };

    // Check if this address has bookings by making a quick API call
    try {
      const response = await fetch(`/api/addresses/${address.id}/has-bookings`);
      const data = await response.json();

      deleteModal = {
        isOpen: true,
        addressToDelete: modalAddress,
        isProcessing: false,
        hasBookings: data.hasBookings
      };
    } catch (error) {
      console.error("Error checking bookings:", error);
      // Fallback to showing the modal without booking info
      deleteModal = {
        isOpen: true,
        addressToDelete: modalAddress,
        isProcessing: false,
        hasBookings: false
      };
    }
  }

  // Function to close delete modal
  function closeDeleteModal() {
    deleteModal.isOpen = false;
  }

  // Function to set an address as default
  async function setAsDefault(id: string) {
    const formData = new FormData();
    formData.append("addressId", id);

    try {
      const response = await fetch(`?/setDefault`, {
        method: "POST",
        body: formData,
      });

      // Properly deserialize the SvelteKit form action response
      const result = deserialize(await response.text());

      if (result.type === 'success') {
        // Show success notification
        successMessage = "Default address updated successfully";
        showSuccessNotification = true;

        // Auto-hide after 5 seconds
        setTimeout(() => {
          showSuccessNotification = false;
        }, 5000);

        // Apply the action result and invalidate data to refresh
        await applyAction(result);
        await invalidateAll();
      } else if (result.type === 'failure') {
        console.error("Failed to set default address:", result.data);
      } else if (result.type === 'redirect') {
        await applyAction(result);
      }
    } catch (error) {
      console.error("Error setting default address:", error);
    }
  }
  
  // Function to handle address deletion
  async function handleDeleteAddress({ id }: { id: string }) {
    deleteModal.isProcessing = true;

    const formData = new FormData();
    formData.append("addressId", id);

    try {
      const response = await fetch(`?/deleteAddress`, {
        method: "POST",
        body: formData,
      });

      // Properly deserialize the SvelteKit form action response
      const result = deserialize(await response.text());

      if (result.type === 'success') {
        // Close modal
        deleteModal.isOpen = false;

        // Show success notification
        successMessage = "Address deleted successfully";
        showSuccessNotification = true;

        // Auto-hide after 5 seconds
        setTimeout(() => {
          showSuccessNotification = false;
        }, 5000);

        // Apply the action result and invalidate data to refresh without full page reload
        await applyAction(result);
        await invalidateAll();
      } else if (result.type === 'failure') {
        console.error("Failed to delete address:", result.data);
      } else if (result.type === 'redirect') {
        await applyAction(result);
      }
    } catch (error) {
      console.error("Error deleting address:", error);
    } finally {
      deleteModal.isProcessing = false;
    }
  }
</script>

<svelte:head>
  <title>My Addresses | BrightBroom</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
  <div class="mx-auto max-w-4xl">
    <!-- Page header with back button -->
    <div class="mb-6 flex items-center">
      <Button variant="ghost" href="/profile" class="mr-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </Button>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        My Addresses
      </h1>
    </div>

    <!-- Success notification -->
    {#if showSuccessNotification}
      <div 
        transition:fly={{ y: -20, duration: 300 }}
        class="fixed top-4 right-4 z-50 flex items-start rounded-lg bg-green-50 p-4 shadow-md dark:bg-green-900/30"
      >
        <CheckCircle class="mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-green-500 dark:text-green-400" />
        <div>
          <p class="text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      </div>
    {/if}

    <!-- Form feedback messages -->
    {#if form?.success}
      <div
        class="mb-6 rounded-md bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-200"
      >
        <p>{form.success}</p>
      </div>
    {/if}

    {#if form?.error || pageError}
      <div
        class="mb-6 rounded-md bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-200 flex items-start"
      >
        <AlertTriangle class="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
        <p>{form?.error || pageError}</p>
      </div>
    {/if}

    <!-- Address count and limit info -->
    <div class="mb-4 bg-blue-50 p-4 rounded-lg dark:bg-blue-900/20 flex items-start">
      <button
        type="button"
        class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary-50 hover:bg-primary-100 hover:text-primary-700 rounded-md transition-colors dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/40 mr-2 flex-shrink-0"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
        View Details
      </button>
      <div>
        <p class="text-blue-800 dark:text-blue-300">
          You are using <span class="font-semibold">{addresses.length}</span> of <span class="font-semibold">{maxAddresses}</span> available address slots.
        </p>
        {#if hasReachedLimit}
          <p class="text-sm text-blue-700 dark:text-blue-400 mt-1">
            To add a new address, you must first delete an existing one.
          </p>
        {/if}
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <DeleteAddressModal
      address={deleteModal.addressToDelete}
      isOpen={deleteModal.isOpen}
      isProcessing={deleteModal.isProcessing}
      hasBookings={deleteModal.hasBookings}
      on:close={closeDeleteModal}
      on:confirm={e => handleDeleteAddress(e.detail)}
    />

    <!-- Add new address button -->
    <div class="mb-6">
      {#if hasReachedLimit}
        <Button variant="primary" disabled={true} title="You have reached the maximum limit of addresses">
          <Plus size={18} class="mr-2" />
          Add New Address (Limit Reached)
        </Button>
      {:else}
        <Button variant="primary" href="/profile/addresses/new">
          <Plus size={18} class="mr-2" />
          Add New Address ({maxAddresses - addresses.length} remaining)
        </Button>
      {/if}
    </div>

    <!-- Addresses list -->
    <div class="space-y-4">
      {#if addresses.length > 0}
        {#each addresses as address (address.id)}
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 mb-4">
            <div class="flex justify-between">
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary dark:bg-primary-900/20"
                  >
                    <MapPin size={20} />
                  </div>
                </div>

                <div class="ml-3">
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
                        <Star size={12} class="mr-1" />
                        Default
                      </span>
                    {:else}
                      <!-- Add set as default button -->
                      <button
                        type="button"
                        class="ml-2 text-xs text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary-400"
                        on:click={() => setAsDefault(address.id)}
                      >
                        Set as default
                      </button>
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

                  {#if address.instructions}
                    <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span class="font-medium">Instructions:</span>
                      {address.instructions}
                    </p>
                  {/if}
                </div>
              </div>

              <div class="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  href={`/profile/addresses/${address.id}/edit`}
                  class="text-primary"
                >
                  <Edit size={16} class="mr-1" />
                  Edit
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  class="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  on:click={() => confirmDelete(address)}
                >
                  <Trash2 size={16} class="mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        {/each}
      {:else}
        <div
          class="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800"
        >
          <div
            class="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
          >
            <MapPin size={24} class="text-gray-500 dark:text-gray-400" />
          </div>
          <h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-white">
            No addresses found
          </h3>
          <p class="mb-4 text-gray-600 dark:text-gray-400">
            You haven't added any addresses yet. Add an address to use for your
            cleaning bookings.
          </p>
          <Button variant="primary" href="/profile/addresses/new">
            <Plus size={18} class="mr-2" />
            Add New Address
          </Button>
        </div>
      {/if}
    </div>
  </div>
</div>
