<!-- src/routes/admin/services/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import Button from "$lib/components/ui/Button.svelte";
  import { Clock, Edit, PlusCircle, Search, Trash2 } from "lucide-svelte";

  // Get the services from the server load function
  export let data;
  let { services } = data;

  // Get form data if it exists (after a form submission)
  export let form;

  // Local state
  let showAddModal = false;
  let showEditModal = false;
  let showDeleteModal = false;
  let selectedService = null;
  let searchTerm = "";
  let isLoading = false;

  // Filter services based on search term
  $: filteredServices = searchTerm
    ? services.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : services;

  // Format price as currency
  function formatPrice(price) {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(Number(price));
  }

  // Modal management
  function openAddModal() {
    showAddModal = true;
    showEditModal = false;
    showDeleteModal = false;
  }

  function openEditModal(service) {
    selectedService = service;
    showEditModal = true;
    showAddModal = false;
    showDeleteModal = false;
  }

  function openDeleteModal(service) {
    selectedService = service;
    showDeleteModal = true;
    showAddModal = false;
    showEditModal = false;
  }

  function closeAllModals() {
    showAddModal = false;
    showEditModal = false;
    showDeleteModal = false;
    selectedService = null;
  }

  // Close modals when Escape key is pressed
  function handleKeydown(event) {
    if (event.key === "Escape") {
      closeAllModals();
    }
  }
</script>

<svelte:head>
  <title>Manage Services | BrightBroom Admin</title>
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

<!-- Page header -->
<div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
  <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Services</h1>
  <div class="mt-4 sm:mt-0">
    <Button variant="primary" on:click={openAddModal}>
      <PlusCircle size={16} class="mr-2" />
      Add New Service
    </Button>
  </div>
</div>

<!-- Success or Error messages -->
{#if form?.success}
  <div
    class="mb-6 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 p-4 rounded-md"
  >
    {form.message}
  </div>
{:else if form?.error}
  <div
    class="mb-6 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 p-4 rounded-md"
  >
    {form.error}
  </div>
{/if}

<!-- Search and filter -->
<div class="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
  <div class="relative">
    <div
      class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
    >
      <Search size={16} class="text-gray-400" />
    </div>
    <input
      type="text"
      bind:value={searchTerm}
      placeholder="Search services..."
      class="pl-10 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
    />
  </div>
</div>

<!-- Services grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
  {#if filteredServices.length === 0}
    <div
      class="col-span-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center text-gray-500 dark:text-gray-400"
    >
      {searchTerm
        ? "No services found matching your search."
        : "No services available. Add a new service to get started."}
    </div>
  {:else}
    {#each filteredServices as service (service.id)}
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
      >
        <div class="p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {service.name}
          </h2>
          <p class="text-gray-600 dark:text-gray-300 mb-4">
            {service.description}
          </p>

          <div class="flex flex-wrap gap-4 mt-4">
            <div class="flex items-center text-gray-700 dark:text-gray-300">
              <span>{formatPrice(service.basePrice)}</span>
            </div>
            <div class="flex items-center text-gray-700 dark:text-gray-300">
              <Clock class="h-5 w-5 text-primary mr-1" />
              <span
                >{service.durationHours}
                {service.durationHours === 1 ? "hour" : "hours"}</span
              >
            </div>
          </div>
        </div>

        <div
          class="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 flex justify-end space-x-2"
        >
          <Button
            variant="ghost"
            size="sm"
            on:click={() => openEditModal(service)}
          >
            <Edit size={16} class="mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            on:click={() => openDeleteModal(service)}
            class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash2 size={16} class="mr-1" />
            Delete
          </Button>
        </div>
      </div>
    {/each}
  {/if}
</div>

<!-- Add service modal -->
{#if showAddModal}
  <div
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="flex items-center justify-center min-h-screen p-4 text-center sm:p-0"
    >
      <!-- Overlay -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        aria-hidden="true"
        on:click={closeAllModals}
      ></div>

      <!-- Modal content -->
      <div
        class="inline-block bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full"
      >
        <form
          method="POST"
          action="?/create"
          use:enhance={() => {
            isLoading = true;

            return async ({ result, update }) => {
              isLoading = false;

              if (result.type === "success" || result.type === "redirect") {
                closeAllModals();
              }

              await update();
            };
          }}
        >
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3
              class="text-lg font-medium text-gray-900 dark:text-white"
              id="modal-title"
            >
              Add New Service
            </h3>
          </div>

          <div class="px-6 py-4">
            <div class="space-y-4">
              <!-- Name -->
              <div>
                <label
                  for="name"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Service Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={form?.data?.name || ""}
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g. Deep Cleaning"
                />
              </div>

              <!-- Description -->
              <div>
                <label
                  for="description"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows="3"
                  value={form?.data?.description || ""}
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Describe what this service includes"
                ></textarea>
              </div>

              <!-- Price and Duration -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    for="basePrice"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Base Price (ZAR)
                  </label>
                  <input
                    type="number"
                    id="basePrice"
                    name="basePrice"
                    required
                    min="0"
                    step="0.01"
                    value={form?.data?.basePrice || ""}
                    class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g. 350"
                  />
                </div>

                <div>
                  <label
                    for="durationHours"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    id="durationHours"
                    name="durationHours"
                    required
                    min="1"
                    max="24"
                    step="1"
                    value={form?.data?.durationHours || ""}
                    class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g. 3"
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex flex-row-reverse gap-2"
          >
            <Button type="submit" variant="primary" disabled={isLoading}>
              {#if isLoading}
                <div
                  class="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"
                ></div>
                Creating...
              {:else}
                Create Service
              {/if}
            </Button>
            <Button type="button" variant="outline" on:click={closeAllModals}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- Edit service modal -->
{#if showEditModal && selectedService}
  <div
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="flex items-center justify-center min-h-screen p-4 text-center sm:p-0"
    >
      <!-- Overlay -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        aria-hidden="true"
        on:click={closeAllModals}
      ></div>

      <!-- Modal content -->
      <div
        class="inline-block bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full"
      >
        <form
          method="POST"
          action="?/update"
          use:enhance={() => {
            isLoading = true;

            return async ({ result, update }) => {
              isLoading = false;

              if (result.type === "success" || result.type === "redirect") {
                closeAllModals();
              }

              await update();
            };
          }}
        >
          <input type="hidden" name="id" value={selectedService.id} />

          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3
              class="text-lg font-medium text-gray-900 dark:text-white"
              id="modal-title"
            >
              Edit Service
            </h3>
          </div>

          <div class="px-6 py-4">
            <div class="space-y-4">
              <!-- Name -->
              <div>
                <label
                  for="edit-name"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Service Name
                </label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  required
                  value={form?.data?.name || selectedService.name}
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <!-- Description -->
              <div>
                <label
                  for="edit-description"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="edit-description"
                  name="description"
                  required
                  rows="3"
                  value={form?.data?.description || selectedService.description}
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                ></textarea>
              </div>

              <!-- Price and Duration -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    for="edit-basePrice"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Base Price (ZAR)
                  </label>
                  <input
                    type="number"
                    id="edit-basePrice"
                    name="basePrice"
                    required
                    min="0"
                    step="0.01"
                    value={form?.data?.basePrice || selectedService.basePrice}
                    class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label
                    for="edit-durationHours"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    id="edit-durationHours"
                    name="durationHours"
                    required
                    min="1"
                    max="24"
                    step="1"
                    value={form?.data?.durationHours ||
                      selectedService.durationHours}
                    class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex flex-row-reverse gap-2"
          >
            <Button type="submit" variant="primary" disabled={isLoading}>
              {#if isLoading}
                <div
                  class="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"
                ></div>
                Updating...
              {:else}
                Update Service
              {/if}
            </Button>
            <Button type="button" variant="outline" on:click={closeAllModals}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- Delete confirmation modal -->
{#if showDeleteModal && selectedService}
  <div
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="flex items-center justify-center min-h-screen p-4 text-center sm:p-0"
    >
      <!-- Overlay -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        aria-hidden="true"
        on:click={closeAllModals}
      ></div>

      <!-- Modal content -->
      <div
        class="inline-block bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full"
      >
        <form
          method="POST"
          action="?/delete"
          use:enhance={() => {
            isLoading = true;

            return async ({ result, update }) => {
              isLoading = false;

              if (result.type === "success" || result.type === "redirect") {
                closeAllModals();
              }

              await update();
            };
          }}
        >
          <input type="hidden" name="id" value={selectedService.id} />

          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3
              class="text-lg font-medium text-gray-900 dark:text-white"
              id="modal-title"
            >
              Confirm Deletion
            </h3>
          </div>

          <div class="px-6 py-4">
            <p class="text-gray-700 dark:text-gray-300">
              Are you sure you want to delete the service <span
                class="font-medium">{selectedService.name}</span
              >? This action cannot be undone.
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Note: Deleting this service may affect existing bookings that use
              it.
            </p>
          </div>

          <div
            class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex flex-row-reverse gap-2"
          >
            <Button
              type="submit"
              variant="primary"
              class="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {#if isLoading}
                <div
                  class="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"
                ></div>
                Deleting...
              {:else}
                Delete Service
              {/if}
            </Button>
            <Button type="button" variant="outline" on:click={closeAllModals}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}
