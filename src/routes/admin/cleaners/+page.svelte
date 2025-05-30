<!-- src/routes/admin/cleaners/+page.svelte -->
<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte";
  import { parseDateTimeString } from "$lib/utils/date-utils.js";
  import { Download, Map, PlusCircle, Star, User } from "lucide-svelte";

  export let data;
  let { cleaners, pagination, filters } = data;

  // Local state for filters
  let searchTerm = filters.search || "";
  let availabilityFilter = filters.availability || "ALL";
  let specialisationFilter = filters.specialisation || "";
  let statusFilter = filters.status || "ALL";
  let showFilters = false;

  // Availability options
  const availabilityOptions = [
    { value: "ALL", label: "All Cleaners" },
    { value: "AVAILABLE", label: "Available" },
    { value: "UNAVAILABLE", label: "Unavailable" },
  ];

  // Status options
  const statusOptions = [
    { value: "ALL", label: "All Statuses" },
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
  ];

  // Format date function
  function formatDate(dateString: string): string {
    const date = new Date(parseDateTimeString(dateString));
    return date.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Format rating with stars
  function formatRating(rating: number | null | string | undefined): string {
    if (rating === null || rating === undefined) return "Not rated";

    // Convert to number if it's not already
    const numericRating =
      typeof rating === "number" ? rating : parseFloat(String(rating));

    // Check if it's a valid number after conversion
    if (isNaN(numericRating)) return "Not rated";

    return `${numericRating.toFixed(1)} / 5.0`;
  }

  // Apply filters
  function applyFilters() {
    const searchParams = new URLSearchParams();

    if (searchTerm) searchParams.set("search", searchTerm);
    if (availabilityFilter && availabilityFilter !== "ALL")
      searchParams.set("availability", availabilityFilter);
    if (specialisationFilter)
      searchParams.set("specialisation", specialisationFilter);
    if (statusFilter && statusFilter !== "ALL")
      searchParams.set("status", statusFilter);

    // Add current page if it's not the first page
    if (pagination.page > 1) {
      searchParams.set("page", pagination.page.toString());
    }

    // Navigate to the same page with filters applied
    const url = searchParams.toString() ? `?${searchParams.toString()}` : "";
    window.location.href = `/admin/cleaners${url}`;
  }

  // Reset filters
  function resetFilters() {
    searchTerm = "";
    availabilityFilter = "ALL";
    specialisationFilter = "";
    statusFilter = "ALL";
    window.location.href = "/admin/cleaners";
  }

  // Navigate to a specific page
  function goToPage(page: number) {
    if (page < 1 || page > pagination.totalPages) return;

    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("page", page.toString());
    window.location.href = `/admin/cleaners?${searchParams.toString()}`;
  }

  // View cleaner details
  function viewCleanerDetails(cleanerId: string) {
    window.location.href = `/admin/cleaners/${cleanerId}`;
  }

  // Export cleaners as CSV
  function exportCleaners() {
    alert("Export functionality would be implemented here");
    // In a real application, this would trigger a server request to generate and download a CSV
  }
</script>

<svelte:head>
  <title>Manage Cleaners | BrightBroom Admin</title>
</svelte:head>

<!-- Page header -->
<div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
  <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Cleaners</h1>
  <div class="mt-4 flex space-x-2 sm:mt-0">
    <div class="mt-4 sm:mt-0 flex gap-2">
      <Button variant="primary" href="/admin/cleaners/new">
        <PlusCircle size={16} class="mr-1" />
        Add New Cleaner
      </Button>
    </div>
    <Button variant="outline" on:click={exportCleaners}>
      <Download size={16} class="mr-1" />
      Export
    </Button>
  </div>
</div>

<!-- Filters and search -->
{#if showFilters}
  <div
    class="mt-4 grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700 sm:grid-cols-2 lg:grid-cols-4"
  >
    <div>
      <label
        for="availability"
        class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Availability
      </label>
      <select
        id="availability"
        bind:value={availabilityFilter}
        class="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      >
        {#each availabilityOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>

    <div>
      <label
        for="status"
        class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Status
      </label>
      <select
        id="status"
        bind:value={statusFilter}
        class="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      >
        {#each statusOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>

    <div>
      <label
        for="specialisation"
        class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Specialisation
      </label>
      <select
        id="specialisation"
        bind:value={specialisationFilter}
        class="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      >
        <option value="">All Specialisations</option>
        {#if data.specialisations}
          {#each data.specialisations as spec}
            <option value={spec.id}>{spec.name}</option>
          {/each}
        {/if}
      </select>
    </div>

    <div class="flex items-end">
      <button
        type="button"
        on:click={resetFilters}
        class="text-sm text-primary hover:text-primary-600 hover:underline focus:outline-none"
      >
        Reset Filters
      </button>
    </div>
  </div>
{/if}

<!-- Cleaners table -->
<div class="mb-6 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead class="bg-gray-50 dark:bg-gray-700">
        <tr>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
          >
            Cleaner
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
          >
            Contact
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
          >
            Specialisations
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
          >
            Rating
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
          >
            Availability
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
          >
            Actions
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
          >
            Status
          </th>
        </tr>
      </thead>
      <tbody
        class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800"
      >
        {#if cleaners.length === 0}
          <tr>
            <td
              colspan="7"
              class="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
            >
              No cleaners found
            </td>
          </tr>
        {:else}
          {#each cleaners as cleaner}
            <tr
              class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="whitespace-nowrap px-6 py-4">
                <div class="flex items-center">
                  <div
                    class="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
                  >
                    {#if cleaner.cleanerProfile?.profileImageUrl}
                      <img
                        src={cleaner.cleanerProfile?.profileImageUrl}
                        alt="{cleaner.firstName} {cleaner.lastName}"
                        class="h-full w-full object-cover"
                      />
                    {:else}
                      <User
                        size={20}
                        class="text-gray-500 dark:text-gray-400"
                      />
                    {/if}
                  </div>
                  <div class="ml-4">
                    <div
                      class="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {cleaner.firstName}
                      {cleaner.lastName}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      ID: {cleaner.id.substring(0, 8)}...
                    </div>
                  </div>
                </div>
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <div class="text-sm text-gray-900 dark:text-white">
                  {cleaner.email}
                </div>
                {#if cleaner.phone}
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {cleaner.phone}
                  </div>
                {/if}
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  {#if cleaner.specialisations && cleaner.specialisations.length > 0}
                    {#each cleaner.specialisations as spec}
                      <span
                        class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                      >
                        {spec.name}
                      </span>
                    {/each}
                  {:else}
                    <span class="text-sm text-gray-500 dark:text-gray-400"
                      >None</span
                    >
                  {/if}
                </div>
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <div class="flex items-center">
                  <Star size={16} class="mr-1 text-yellow-400" />
                  <span class="text-sm text-gray-900 dark:text-white">
                    {formatRating(cleaner.cleanerProfile?.rating)}
                  </span>
                </div>
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                {#if cleaner.cleanerProfile?.isAvailable}
                  <span
                    class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-300"
                  >
                    Available
                  </span>
                {:else}
                  <span
                    class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/20 dark:text-red-300"
                  >
                    Unavailable
                  </span>
                {/if}
                {#if cleaner.cleanerProfile?.workRadius}
                  <div
                    class="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400"
                  >
                    <Map size={12} class="mr-1" />
                    {cleaner.cleanerProfile.workRadius} km radius
                  </div>
                {/if}
              </td>
              <td
                class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  on:click={() => viewCleanerDetails(cleaner.id)}
                  class="text-primary hover:text-primary-600"
                >
                  View
                </Button>
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                {#if cleaner.isActive === false}
                  <span
                    class="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                  >
                    Inactive
                  </span>
                {:else}
                  <span
                    class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-300"
                  >
                    Active
                  </span>
                {/if}
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>

  <!-- Pagination controls here... -->
</div>
