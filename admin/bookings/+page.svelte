<!-- src/routes/admin/bookings/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import Button from "$lib/components/ui/Button.svelte";
  import {
    Search,
    Filter,
    Download,
    Calendar,
    Users,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
  } from "lucide-svelte";

  // Get data from server
  export let data;
  let { bookings, pagination, filters, statusOptions } = data;

  // Local state for filters
  let searchTerm = filters.search || "";
  let statusFilter = filters.status || "ALL";
  let dateRangeStart = filters.dateStart || "";
  let dateRangeEnd = filters.dateEnd || "";
  let showFilters = false;
  let showBulkActions = false;
  let selectedBookings = new Set();
  let isLoadingBulk = false;
  let bulkAction = "status";
  let bulkStatusValue = "CONFIRMED";

  // Format date
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  // Format time
  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-ZA", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  // Get status badge class
  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  }

  // Get status icon
  function getStatusIcon(status: string) {
    switch (status) {
      case "CONFIRMED":
        return CheckCircle;
      case "PENDING":
        return Clock;
      case "IN_PROGRESS":
        return Users;
      case "COMPLETED":
        return CheckCircle;
      case "CANCELLED":
        return XCircle;
      default:
        return AlertCircle;
    }
  }

  // Apply filters
  function applyFilters() {
    const searchParams = new URLSearchParams();
    
    if (searchTerm) searchParams.set("search", searchTerm);
    if (statusFilter && statusFilter !== "ALL") searchParams.set("status", statusFilter);
    if (dateRangeStart) searchParams.set("dateStart", dateRangeStart);
    if (dateRangeEnd) searchParams.set("dateEnd", dateRangeEnd);
    
    // Add current page if it's not the first page
    if (pagination.page > 1) {
      searchParams.set("page", pagination.page.toString());
    }
    
    // Navigate to the same page with filters applied
    const url = searchParams.toString() ? `?${searchParams.toString()}` : "";
    window.location.href = `/admin/bookings${url}`;
  }

  // Reset filters
  function resetFilters() {
    searchTerm = "";
    statusFilter = "ALL";
    dateRangeStart = "";
    dateRangeEnd = "";
    window.location.href = "/admin/bookings";
  }

  // Navigate to a specific page
  function goToPage(page: number) {
    if (page < 1 || page > pagination.totalPages) return;
    
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("page", page.toString());
    window.location.href = `/admin/bookings?${searchParams.toString()}`;
  }

  // View booking details
  function viewBookingDetails(bookingId: string) {
    window.location.href = `/admin/bookings/${bookingId}`;
  }

  // Export bookings as CSV
  async function exportBookings() {
    try {
      const response = await fetch(`/api/admin/bookings/export?${new URLSearchParams(window.location.search)}`);
      if (!response.ok) throw new Error('Failed to export');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error exporting bookings:', error);
      alert('Failed to export bookings. Please try again.');
    }
  }

  // Toggle selection of all bookings
  function toggleSelectAll(event) {
    const checked = event.target.checked;
    if (checked) {
      bookings.forEach(booking => selectedBookings.add(booking.id));
    } else {
      selectedBookings.clear();
    }
    selectedBookings = selectedBookings; // Trigger reactivity
  }

  // Toggle individual booking selection
  function toggleBookingSelection(id: string) {
    if (selectedBookings.has(id)) {
      selectedBookings.delete(id);
    } else {
      selectedBookings.add(id);
    }
    selectedBookings = new Set(selectedBookings); // Trigger reactivity
  }

  // Format currency
  function formatCurrency(amount: number | string): string {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(value);
  }

  // Quick status change
  async function quickStatusChange(bookingId: string, status: string) {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status. Please try again.');
    }
  }

  // Process bulk action
  async function processBulkAction() {
    if (selectedBookings.size === 0) {
      alert('Please select at least one booking');
      return;
    }

    isLoadingBulk = true;

    try {
      const response = await fetch('/api/admin/bookings/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingIds: Array.from(selectedBookings),
          action: bulkAction,
          value: bulkAction === 'status' ? bulkStatusValue : null
        })
      });

      if (!response.ok) throw new Error('Failed to process bulk action');
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error processing bulk action:', error);
      alert('Failed to process bulk action. Please try again.');
    } finally {
      isLoadingBulk = false;
    }
  }

  $: allSelected = bookings.length > 0 && selectedBookings.size === bookings.length;
</script>

<svelte:head>
  <title>Manage Bookings | BrightBroom Admin</title>
</svelte:head>

<!-- Page header -->
<div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
  <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Bookings</h1>
  <div class="mt-4 sm:mt-0 flex gap-2">
    <Button variant="outline" on:click={exportBookings}>
      <Download size={16} class="mr-1" />
      Export
    </Button>
    <Button 
      variant={showBulkActions ? "primary" : "outline"}
      on:click={() => showBulkActions = !showBulkActions}
    >
      Bulk Actions
    </Button>
  </div>
</div>

<!-- Bulk actions panel -->
{#if showBulkActions}
  <div class="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-primary">
    <div class="flex flex-col sm:flex-row sm:items-center gap-4">
      <div class="flex-1">
        <div class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Action
        </div>
        <select
          bind:value={bulkAction}
          class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="status">Change Status</option>
          <option value="assign">Assign Cleaner</option>
          <option value="reminder">Send Reminder</option>
        </select>
      </div>

      {#if bulkAction === 'status'}
        <div class="flex-1">
          <div class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </div>
          <select
            bind:value={bulkStatusValue}
            class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      {/if}

      <div class="flex items-end">
        <Button 
          variant="primary" 
          on:click={processBulkAction}
          disabled={isLoadingBulk || selectedBookings.size === 0}
        >
          {#if isLoadingBulk}
            <span class="inline-block animate-pulse">Processing...</span>
          {:else}
            Apply to {selectedBookings.size} booking{selectedBookings.size !== 1 ? 's' : ''}
          {/if}
        </Button>
      </div>
    </div>
    
    <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
      Selected {selectedBookings.size} of {bookings.length} bookings
    </div>
  </div>
{/if}

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
        placeholder="Search bookings by customer, service, or address..."
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

  <!-- Active filters display -->
  {#if statusFilter !== 'ALL' || dateRangeStart || dateRangeEnd || searchTerm}
    <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
      <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">Active filters:</div>
      <div class="flex flex-wrap gap-2">
        {#if searchTerm}
          <div class="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center">
            <span>Search: {searchTerm}</span>
            <button 
              class="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              on:click={() => { searchTerm = ''; applyFilters(); }}
            >
              <XCircle size={14} />
            </button>
          </div>
        {/if}
        
        {#if statusFilter !== 'ALL'}
          <div class="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center">
            <span>Status: {statusFilter}</span>
            <button 
              class="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              on:click={() => { statusFilter = 'ALL'; applyFilters(); }}
            >
              <XCircle size={14} />
            </button>
          </div>
        {/if}
        
        {#if dateRangeStart}
          <div class="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center">
            <span>From: {dateRangeStart}</span>
            <button 
              class="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              on:click={() => { dateRangeStart = ''; applyFilters(); }}
            >
              <XCircle size={14} />
            </button>
          </div>
        {/if}
        
        {#if dateRangeEnd}
          <div class="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center">
            <span>To: {dateRangeEnd}</span>
            <button 
              class="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              on:click={() => { dateRangeEnd = ''; applyFilters(); }}
            >
              <XCircle size={14} />
            </button>
          </div>
        {/if}
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
          {#if showBulkActions}
            <th scope="col" class="px-3 py-3 text-left">
              <input 
                type="checkbox" 
                checked={allSelected}
                on:change={toggleSelectAll}
                class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </th>
          {/if}
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Booking Info
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
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Payment
          </th>
          <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        {#if bookings.length === 0}
          <tr>
            <td colspan={showBulkActions ? 8 : 7} class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
              No bookings found
            </td>
          </tr>
        {:else}
          {#each bookings as booking}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              {#if showBulkActions}
                <td class="px-3 py-4 whitespace-nowrap">
                  <input 
                    type="checkbox" 
                    checked={selectedBookings.has(booking.id)}
                    on:change={() => toggleBookingSelection(booking.id)}
                    class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </td>
              {/if}
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  #{booking.id.substring(0, 6)}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {booking.address.street}, {booking.address.city}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">{booking.customer.firstName} {booking.customer.lastName}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">{booking.customer.email}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {booking.service.name}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">{formatDate(booking.scheduledDate)}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatTime(booking.scheduledDate)}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}>
                  <svelte:component this={getStatusIcon(booking.status)} class="h-3.5 w-3.5 mr-1" />
                  {booking.status}
                </span>
                
                <!-- Quick status change buttons -->
                <div class="mt-2 flex flex-wrap gap-1">
                  {#if booking.status !== 'CONFIRMED'}
                    <button 
                      class="px-1.5 py-0.5 bg-green-50 text-green-600 text-xs rounded hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/40"
                      title="Set as Confirmed"
                      on:click={() => quickStatusChange(booking.id, 'CONFIRMED')}
                    >
                      Confirm
                    </button>
                  {/if}
                  
                  {#if booking.status !== 'IN_PROGRESS' && booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED'}
                    <button 
                      class="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40"
                      title="Set as In Progress"
                      on:click={() => quickStatusChange(booking.id, 'IN_PROGRESS')}
                    >
                      Start
                    </button>
                  {/if}
                  
                  {#if booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED'}
                    <button 
                      class="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-xs rounded hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:bg-purple-900/40"
                      title="Set as Completed"
                      on:click={() => quickStatusChange(booking.id, 'COMPLETED')}
                    >
                      Complete
                    </button>
                  {/if}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(booking.price)}
                </div>
                {#if booking.paymentStatus}
                  <span class={`text-xs mt-1 ${booking.paymentStatus === 'COMPLETED' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    {booking.paymentStatus}
                  </span>
                {:else}
                  <span class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    No payment
                  </span>
                {/if}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    on:click={() => viewBookingDetails(booking.id)}
                  >
                    View
                  </Button>
                  
                
                </div>
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
