<!-- src/routes/admin/applications/+page.svelte -->
<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte";
  import { ArrowLeft, ArrowRight, Eye, Filter, Search } from "lucide-svelte";

  export let data;
  let { applications, pagination, filters } = data;

  // Local state for filters
  let searchTerm = filters.search || "";
  let statusFilter = filters.status || "PENDING";
  let showFilters = false;

  // Status options
  const statusOptions = [
    { value: "ALL", label: "All Applications" },
    { value: "PENDING", label: "Pending Review" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
  ];

  // Format date function
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Apply filters
  function applyFilters() {
    const searchParams = new URLSearchParams();

    if (searchTerm) searchParams.set("search", searchTerm);
    if (statusFilter !== "ALL") searchParams.set("status", statusFilter);

    // Add current page if it's not the first page
    if (pagination.page > 1) {
      searchParams.set("page", pagination.page.toString());
    }

    // Navigate to the same page with filters applied
    const url = searchParams.toString() ? `?${searchParams.toString()}` : "";
    window.location.href = `/admin/applications${url}`;
  }

  // Reset filters
  function resetFilters() {
    searchTerm = "";
    statusFilter = "PENDING";
    window.location.href = "/admin/applications";
  }

  // Navigate to a specific page
  function goToPage(page: number) {
    if (page < 1 || page > pagination.totalPages) return;

    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("page", page.toString());
    window.location.href = `/admin/applications?${searchParams.toString()}`;
  }
</script>

<svelte:head>
  <title>Cleaner Applications | BrightBroom Admin</title>
</svelte:head>

<!-- Page header -->
<div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
  <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
    Cleaner Applications
  </h1>
</div>

<!-- Filters and search -->
<div class="mb-6 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
  <div
    class="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-x-3 sm:space-y-0"
  >
    <div class="relative flex-1">
      <div
        class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
      >
        <Search size={16} class="text-gray-400" />
      </div>
      <input
        type="text"
        bind:value={searchTerm}
        placeholder="Search applicants..."
        class="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      />
    </div>

    <div>
      <Button variant="outline" on:click={() => (showFilters = !showFilters)}>
        <Filter size={16} class="mr-1" />
        Filters
      </Button>
    </div>

    <div>
      <Button variant="primary" on:click={applyFilters}>Search</Button>
    </div>
  </div>

  {#if showFilters}
    <div
      class="mt-4 grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700 sm:grid-cols-2 lg:grid-cols-4"
    >
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
</div>

<!-- Applications table -->
<div class="mb-6 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead class="bg-gray-50 dark:bg-gray-700">
        <tr>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
          >
            Applicant
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
            Experience
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
          >
            Application Date
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
          >
            Status
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
          >
            Actions
          </th>
        </tr>
      </thead>
      <tbody
        class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800"
      >
        {#if applications.length === 0}
          <tr>
            <td
              colspan="6"
              class="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
            >
              No applications found
            </td>
          </tr>
        {:else}
          {#each applications as application}
            <tr
              class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="whitespace-nowrap px-6 py-4">
                <div class="flex items-center">
                  <div class="ml-4">
                    <div
                      class="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {application.firstName}
                      {application.lastName}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {application.city}
                    </div>
                  </div>
                </div>
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <div class="text-sm text-gray-900 dark:text-white">
                  {application.email}
                </div>
                {#if application.phone}
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {application.phone}
                  </div>
                {/if}
              </td>
              <td
                class="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white"
              >
                {application.experience}
              </td>
              <td
                class="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white"
              >
                {formatDate(application.createdAt)}
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                {#if application.status === "PENDING"}
                  <span
                    class="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                  >
                    Pending Review
                  </span>
                {:else if application.status === "APPROVED"}
                  <span
                    class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-300"
                  >
                    Approved
                  </span>
                {:else if application.status === "REJECTED"}
                  <span
                    class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/20 dark:text-red-300"
                  >
                    Rejected
                  </span>
                {/if}
              </td>
              <td
                class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium"
              >
                <div class="flex justify-end">
                  <a
                    href={`/admin/applications/${application.id}`}
                    class="text-primary hover:text-primary-600"
                  >
                    <Button variant="ghost" size="sm">
                      <Eye size={16} />
                      <span class="ml-1">View</span>
                    </Button>
                  </a>
                </div>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>

  {#if pagination.totalPages > 1}
    <div
      class="border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-700 dark:text-gray-300">
          Showing <span class="font-medium"
            >{(pagination.page - 1) * pagination.limit + 1}</span
          >
          to
          <span class="font-medium"
            >{Math.min(
              pagination.page * pagination.limit,
              pagination.total,
            )}</span
          >
          of <span class="font-medium">{pagination.total}</span> applications
        </div>

        <div class="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            on:click={() => goToPage(pagination.page - 1)}
          >
            <ArrowLeft size={16} />
          </Button>

          {#each Array(pagination.totalPages) as _, i}
            {#if pagination.totalPages <= 7 || i + 1 === 1 || i + 1 === pagination.totalPages || (i + 1 >= pagination.page - 1 && i + 1 <= pagination.page + 1)}
              <Button
                variant={pagination.page === i + 1 ? "primary" : "outline"}
                size="sm"
                on:click={() => goToPage(i + 1)}
              >
                {i + 1}
              </Button>
            {:else if i + 1 === 2 || i + 1 === pagination.totalPages - 1}
              <span
                class="inline-flex h-8 w-8 items-center justify-center text-gray-500 dark:text-gray-400"
                >...</span
              >
            {/if}
          {/each}

          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === pagination.totalPages}
            on:click={() => goToPage(pagination.page + 1)}
          >
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  {/if}
</div>
