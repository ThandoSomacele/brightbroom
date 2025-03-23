<!-- src/routes/admin/bookings/+page.svelte -->
<script lang="ts">
  import { Search, Filter, Download, Calendar, MapPin, User, Clock, ArrowRight, ArrowLeft } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  
  export let data;
  let { bookings, pagination, filters } = data;
  
  // Local state for filters
  let searchTerm = filters.search || '';
  let statusFilter = filters.status || 'ALL';
  let dateRangeStart = filters.dateStart || '';
  let dateRangeEnd = filters.dateEnd || '';
  let showFilters = false;
  
  // Status options
  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' }
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
  
  // Format time function
  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Get status badge class
  function getStatusBadgeClass(status: string): string {
    switch(status) {
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
    if (statusFilter && statusFilter !== 'ALL') searchParams.set('status', statusFilter);
    if (dateRangeStart) searchParams.set('dateStart', dateRangeStart);
    if (dateRangeEnd) searchParams.set('dateEnd', dateRangeEnd);
    
    // Add current page if it's not the first page
    if (pagination.page > 1) {
      searchParams.set('page', pagination.page.toString());
    }
    
    // Navigate to the same page with filters applied
    const url = searchParams.toString() ? `?${searchParams.toString()}` : '';
    window.location.href = `/admin/bookings${url}`;
  }
  
  // Reset filters
  function resetFilters() {
    searchTerm = '';
    statusFilter = 'ALL';
    dateRangeStart = '';
    dateRangeEnd = '';
    window.location.href = '/admin/bookings';
  }
  
  // Navigate to a specific page
  function goToPage(page: number) {
    if (page < 1 || page > pagination.totalPages) return;
    
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('page', page.toString());
    window.location.href = `/admin/bookings?${searchParams.toString()}`;
  }
  
  // View booking details
  function viewBookingDetails(bookingId: string) {
    window.location.href = `/admin/bookings/${bookingId}`;
  }
  
  // Export bookings as CSV
  function exportBookings() {
    alert('Export functionality would be implemented here');
    // In a real application, this would trigger a server request to generate and download a CSV
  }
</script>

<svelte:head>
  <title>Manage Bookings | BrightBroom Admin</title>
</svelte:head>

<!-- Page header -->
<div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
  <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Bookings</h1>
  <div class="mt-4 sm:mt-0">
    <Button variant="outline" on:click={exportBookings}>
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
        placeholder="Search bookings..."
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
        <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Status
        </label>
        <select
          id="status"
          bind:value={statusFilter}
          class="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          {#each statusOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>
      
      <div>
        <label for="dateStart" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          From Date
        </label>
        <input
          type="date"
          id="dateStart"
          bind:value={dateRangeStart}
          class="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
      
      <div>
        <label for="dateEnd" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          To Date
        </label>
        <input
          type="date"
          id="dateEnd"
          bind:value={dateRangeEnd}
          class="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
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

<!-- Bookings table -->
<div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-6">
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead class="bg-gray-50 dark:bg-gray-700">
        <tr>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Booking ID
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Customer
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Service
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Date & Time
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Status
          </th>
          <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        {#if bookings.length === 0}
          <tr>
            <td colspan="6" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
              No bookings found
            </td>
          </tr>
        {:else}
          {#each bookings as booking}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {booking.id.substring(0, 8)}...
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">{booking.customer.name}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">{booking.customer.email}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {booking.service.name}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">{formatDate(booking.scheduledDate)}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">{formatTime(booking.scheduledDate)}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}>
                  {booking.status}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  on:click={() => viewBookingDetails(booking.id)}
                  class="text-primary hover:text-primary-600"
                >
                  View
                </button>
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
          Showing <span class="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to <span class="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span class="font-medium">{pagination.total}</span> bookings
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
              <span class="inline-flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400">...</span>
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
