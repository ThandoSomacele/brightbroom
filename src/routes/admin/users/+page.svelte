<!-- src/routes/admin/users/+page.svelte -->
<script lang="ts">
  import { Search, Filter, Download, Users, Mail, Phone, Calendar, ArrowRight, ArrowLeft } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { TableSkeleton } from '$lib/components/ui/skeletons';

  export let data;
  let { filters } = data;

  // Local state for filters
  let searchTerm = filters.search || '';
  let roleFilter = filters.role || 'ALL';
  let showFilters = false;

  // Role options
  const roleOptions = [
    { value: 'ALL', label: 'All Roles' },
    { value: 'CUSTOMER', label: 'Customers' },
    { value: 'CLEANER', label: 'Cleaners' },
    { value: 'ADMIN', label: 'Administrators' }
  ];

  // Format date function
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Get role badge class
  function getRoleBadgeClass(role: string): string {
    switch(role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'CLEANER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'CUSTOMER':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  }

  // Apply filters
  function applyFilters() {
    const searchParams = new URLSearchParams();

    if (searchTerm) searchParams.set('search', searchTerm);
    if (roleFilter && roleFilter !== 'ALL') searchParams.set('role', roleFilter);

    const url = searchParams.toString() ? `?${searchParams.toString()}` : '';
    window.location.href = `/admin/users${url}`;
  }

  // Reset filters
  function resetFilters() {
    searchTerm = '';
    roleFilter = 'ALL';
    window.location.href = '/admin/users';
  }

  // Navigate to a specific page
  function goToPage(page: number, totalPages: number) {
    if (page < 1 || page > totalPages) return;

    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('page', page.toString());
    window.location.href = `/admin/users?${searchParams.toString()}`;
  }

  // View user details
  function viewUserDetails(userId: string) {
    window.location.href = `/admin/users/${userId}`;
  }

  // Export users as CSV
  function exportUsers() {
    alert('Export functionality would be implemented here');
  }
</script>

<svelte:head>
  <title>Manage Users | BrightBroom Admin</title>
</svelte:head>

<!-- Page header -->
<div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
  <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Users</h1>
  <div class="mt-4 sm:mt-0">
    <Button variant="outline" on:click={exportUsers}>
      <Download size={16} class="mr-1" />
      Export
    </Button>
  </div>
</div>

<!-- Filters and search -->
<div class="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
  <div class="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
    <div class="flex-1 relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search size={16} class="text-gray-400" />
      </div>
      <input
        type="text"
        bind:value={searchTerm}
        placeholder="Search users..."
        class="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
    </div>

    <div>
      <Button variant="outline" on:click={() => showFilters = !showFilters}>
        <Filter size={16} class="mr-1" />
        Filters
      </Button>
    </div>

    <div>
      <Button variant="primary" on:click={applyFilters}>
        Search
      </Button>
    </div>
  </div>

  {#if showFilters}
    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div>
        <label for="role" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Role
        </label>
        <select
          id="role"
          bind:value={roleFilter}
          class="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          {#each roleOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>

      <div class="flex items-end">
        <button
          type="button"
          on:click={resetFilters}
          class="text-primary hover:text-primary-600 hover:underline focus:outline-none text-sm"
        >
          Reset Filters
        </button>
      </div>
    </div>
  {/if}
</div>

<!-- Users table with streaming -->
{#await data.streamed.usersData}
  <TableSkeleton rows={10} columns={6} />
{:then usersData}
  {@const users = usersData.users}
  {@const pagination = usersData.pagination}

  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-6">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Email
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Role
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Joined
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Bookings
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {#if users.length === 0}
            <tr>
              <td colspan="6" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                No users found
              </td>
            </tr>
          {:else}
            {#each users as user}
              <tr
                class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                on:click={() => viewUserDetails(user.id)}
                role="link"
                tabindex="0"
                on:keydown={(e) => e.key === 'Enter' && viewUserDetails(user.id)}
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <Users size={20} class="text-gray-500 dark:text-gray-400" />
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center text-sm text-gray-900 dark:text-white">
                    <Mail size={16} class="mr-2 text-gray-400" />
                    {user.email}
                  </div>
                  {#if user.phone}
                    <div class="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <Phone size={16} class="mr-2 text-gray-400" />
                      {user.phone}
                    </div>
                  {/if}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar size={16} class="mr-2 text-gray-400" />
                    {formatDate(user.createdAt)}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {user.bookingsCount}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" on:click|stopPropagation>
                  <Button
                    variant="ghost"
                    size="sm"
                    on:click={() => viewUserDetails(user.id)}
                    class="text-primary hover:text-primary-600"
                  >
                    View
                  </Button>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    {#if pagination.totalPages > 1}
      <div class="px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Showing <span class="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to <span class="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span class="font-medium">{pagination.total}</span> users
          </div>

          <div class="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              on:click={() => goToPage(pagination.page - 1, pagination.totalPages)}
            >
              <ArrowLeft size={16} />
            </Button>

            {#each Array(pagination.totalPages) as _, i}
              {#if pagination.totalPages <= 7 || i + 1 === 1 || i + 1 === pagination.totalPages || (i + 1 >= pagination.page - 1 && i + 1 <= pagination.page + 1)}
                <Button
                  variant={pagination.page === i + 1 ? "primary" : "outline"}
                  size="sm"
                  on:click={() => goToPage(i + 1, pagination.totalPages)}
                >
                  {i + 1}
                </Button>
              {:else if i + 1 === 2 || i + 1 === pagination.totalPages - 1}
                <span class="inline-flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400">...</span>
              {/if}
            {/each}

            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              on:click={() => goToPage(pagination.page + 1, pagination.totalPages)}
            >
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    {/if}
  </div>
{:catch error}
  <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 text-center">
    <p class="text-red-600 dark:text-red-400">Failed to load users. Please refresh the page.</p>
  </div>
{/await}
