<!-- src/routes/cleaner/bookings/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import Button from '$lib/components/ui/Button.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  import { Calendar, Filter, MapPin, Search, X } from 'lucide-svelte';

  export let data;

  const { filters } = data;

  // Local state for filters
  let showFilters = false;
  let searchTerm = filters.search || '';
  let statusFilter = filters.status || '';
  let dateFrom = filters.dateFrom || '';
  let dateTo = filters.dateTo || '';
  
  // Format date
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  // Format time
  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Format currency
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  }
  
  // Get status badge class
  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  }
  
  // Apply filters
  function applyFilters() {
    const searchParams = new URLSearchParams();
    
    if (searchTerm) searchParams.set('search', searchTerm);
    if (statusFilter) searchParams.set('status', statusFilter);
    if (dateFrom) searchParams.set('from', dateFrom);
    if (dateTo) searchParams.set('to', dateTo);
    
    // Add page parameter if not on first page
    if (pagination.page > 1) {
      searchParams.set('page', pagination.page.toString());
    }
    
    // Navigate to same page with filters
    const url = searchParams.toString() ? `?${searchParams.toString()}` : '';
    window.location.href = `/cleaner/bookings${url}`;
  }
  
  // Reset filters
  function resetFilters() {
    searchTerm = '';
    statusFilter = '';
    dateFrom = '';
    dateTo = '';
    window.location.href = '/cleaner/bookings';
  }
  
  // Navigate to specific page
  function goToPage(targetPage: number, totalPages: number) {
    if (targetPage < 1 || targetPage > totalPages) return;

    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('page', targetPage.toString());
    window.location.href = `/cleaner/bookings?${searchParams.toString()}`;
  }
</script>

<svelte:head>
  <title>My Bookings | BrightBroom Cleaner</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
    My Bookings
  </h1>
  
  <!-- Filters -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
    <div class="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
      <div class="relative flex-1">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} class="text-gray-400" />
        </div>
        <input
          type="text"
          bind:value={searchTerm}
          placeholder="Search bookings..."
          class="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
      
      <div>
        <Button variant="outline" on:click={() => showFilters = !showFilters}>
          <Filter size={16} class="mr-1" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>
      
      <div>
        <Button variant="primary" on:click={applyFilters}>
          Search
        </Button>
      </div>
    </div>
    
    {#if showFilters}
      <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select 
            bind:value={statusFilter}
            class="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            From Date
          </label>
          <input
            type="date"
            bind:value={dateFrom}
            class="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            To Date
          </label>
          <input
            type="date"
            bind:value={dateTo}
            class="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>
      
      <div class="mt-4 flex justify-end">
        <button
          type="button"
          on:click={resetFilters}
          class="text-primary hover:text-primary-600 hover:underline focus:outline-none text-sm"
        >
          Reset Filters
        </button>
      </div>
    {/if}
    
    <!-- Active filters display -->
    {#if statusFilter || dateFrom || dateTo || searchTerm}
      <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Active filters:
        </div>
        <div class="flex flex-wrap gap-2">
          {#if searchTerm}
            <div class="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center">
              <span>Search: {searchTerm}</span>
              <button
                class="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                on:click={() => {
                  searchTerm = '';
                  applyFilters();
                }}
              >
                <X size={14} />
              </button>
            </div>
          {/if}
          
          {#if statusFilter}
            <div class="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center">
              <span>Status: {statusFilter}</span>
              <button
                class="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                on:click={() => {
                  statusFilter = '';
                  applyFilters();
                }}
              >
                <X size={14} />
              </button>
            </div>
          {/if}
          
          {#if dateFrom}
            <div class="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center">
              <span>From: {dateFrom}</span>
              <button
                class="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                on:click={() => {
                  dateFrom = '';
                  applyFilters();
                }}
              >
                <X size={14} />
              </button>
            </div>
          {/if}
          
          {#if dateTo}
            <div class="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center">
              <span>To: {dateTo}</span>
              <button
                class="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                on:click={() => {
                  dateTo = '';
                  applyFilters();
                }}
              >
                <X size={14} />
              </button>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Bookings List -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    {#await data.streamed.bookingsData}
      <!-- Loading skeleton -->
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        {#each [1, 2, 3, 4, 5] as _}
          <div class="p-6">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div class="flex-1 space-y-3">
                <div class="flex items-start">
                  <Skeleton variant="avatar" class="w-5 h-5 mr-2 rounded" />
                  <div>
                    <Skeleton variant="text" class="w-48 mb-1" />
                    <Skeleton variant="text" class="w-20" />
                  </div>
                </div>
                <div class="flex items-start">
                  <Skeleton variant="avatar" class="w-5 h-5 mr-2 rounded" />
                  <div>
                    <Skeleton variant="text" class="w-64 mb-1" />
                    <Skeleton variant="text" class="w-40" />
                  </div>
                </div>
              </div>
              <div class="mt-4 lg:mt-0 lg:ml-4 flex flex-col items-end">
                <div class="flex items-center">
                  <Skeleton variant="title" class="w-24 mr-3" />
                  <Skeleton variant="button" class="w-20 h-6 rounded-full" />
                </div>
                <Skeleton variant="text" class="w-32 mt-2" />
                <Skeleton variant="button" class="w-24 h-5 mt-3" />
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:then bookingsData}
      {@const bookings = bookingsData.bookings}
      {@const pagination = bookingsData.pagination}
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        {#if bookings.length === 0}
          <div class="p-6 text-center text-gray-500 dark:text-gray-400">
            No bookings found matching your filters.
          </div>
        {:else}
          {#each bookings as booking}
          <div class="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div class="flex-1">
                <div class="flex items-start">
                  <Calendar class="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {formatDate(booking.scheduledDate)}
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(booking.scheduledDate)}
                    </p>
                  </div>
                </div>
                
                <div class="flex items-start mt-3">
                  <MapPin class="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <div>
                    <p class="text-gray-700 dark:text-gray-300">
                      {booking.address.street}, {booking.address.city}, {booking.address.state}
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      General Clean - {booking.bedroomCount} bed, {booking.bathroomCount} bath
                    </p>
                  </div>
                </div>
              </div>
              
              <div class="mt-4 lg:mt-0 lg:ml-4 flex flex-col items-start lg:items-end">
                <div class="flex items-center">
                  <span class="text-lg font-semibold text-gray-900 dark:text-white mr-3">
                    {formatCurrency(booking.price * 0.80)}
                  </span>
                  <span class={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
                
                <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {booking.customer.firstName} {booking.customer.lastName}
                </div>
                
                <div class="mt-3">
                  <a 
                    href={`/cleaner/bookings/${booking.id}`} 
                    class="text-primary hover:text-primary-600 text-sm font-medium"
                  >
                    View Details
                  </a>
                </div>
              </div>
            </div>
          </div>
          {/each}
        {/if}
      </div>

      <!-- Pagination -->
      {#if pagination.totalPages > 1}
        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700 dark:text-gray-300">
              Showing <span class="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to <span class="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span class="font-medium">{pagination.total}</span> bookings
            </div>

            <nav class="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                on:click={() => goToPage(pagination.page - 1, pagination.totalPages)}
              >
                Previous
              </Button>

              {#each Array(Math.min(5, pagination.totalPages)) as _, i}
                {#if pagination.totalPages <= 5 || i + 1 === 1 || i + 1 === pagination.totalPages || (i + 1 >= pagination.page - 1 && i + 1 <= pagination.page + 1)}
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
                Next
              </Button>
            </nav>
          </div>
        </div>
      {/if}
    {:catch error}
      <div class="p-6 text-center">
        <p class="text-red-600 dark:text-red-400">Failed to load bookings. Please try again later.</p>
      </div>
    {/await}
  </div>
</div>
