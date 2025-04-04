<!-- src/routes/profile/addresses/+page.svelte -->
<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte";
  import { Edit, MapPin, Plus, Star, Trash2, AlertTriangle, Info } from "lucide-svelte";
  import { enhance } from "$app/forms";

  export let data;
  export let form; // For form result handling
  const { addresses, maxAddresses, hasReachedLimit, error: pageError } = data;

  // State for delete confirmation
  let showDeleteModal = false;
  let addressToDelete = null;
  let isDeleting = false;

  // Function to show delete confirmation
  function confirmDelete(id) {
    addressToDelete = id;
    showDeleteModal = true;
  }

  // Function to handle address deletion
  async function deleteAddress() {
    if (!addressToDelete) return;

    isDeleting = true;

    const form = new FormData();
    form.append("addressId", addressToDelete);

    try {
      const response = await fetch(`?/deleteAddress`, {
        method: "POST",
        body: form,
      });

      if (response.ok) {
        // Close modal and refresh page
        showDeleteModal = false;
        window.location.reload();
      } else {
        console.error("Failed to delete address");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
    } finally {
      isDeleting = false;
    }
  }

  // Function to set an address as default
  async function setAsDefault(id) {
    const form = new FormData();
    form.append("addressId", id);

    try {
      const response = await fetch(`?/setDefault`, {
        method: "POST",
        body: form,
      });

      if (response.ok) {
        window.location.reload();
      } else {
        console.error("Failed to set default address");
      }
    } catch (error) {
      console.error("Error setting default address:", error);
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
      <Info class="h-5 w-5 mt-0.5 mr-2 flex-shrink-0 text-blue-500 dark:text-blue-400" />
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
    {#if showDeleteModal}
      <div
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        on:click|self={() => (showDeleteModal = false)}
        on:keydown={(e) => e.key === "Escape" && (showDeleteModal = false)}
        role="presentation"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
          role="dialog"
          aria-modal="true"
        >
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Confirm Deletion
          </h3>
          <p class="text-gray-600 dark:text-gray-300 mb-6">
            Are you sure you want to delete this address? This action cannot be
            undone.
          </p>

          <div class="flex justify-end space-x-3">
            <Button
              variant="outline"
              on:click={() => (showDeleteModal = false)}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              class="!bg-red-600 hover:!bg-red-700 dark:!bg-red-700 dark:hover:!bg-red-800"
              disabled={isDeleting}
              on:click={deleteAddress}
            >
              {#if isDeleting}
                <svg
                  class="animate-spin h-4 w-4 mr-2"
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
                  on:click={() => confirmDelete(address.id)}
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
