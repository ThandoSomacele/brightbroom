<!-- src/routes/admin/bookings/[id]/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import { Calendar, MapPin, User, Clock, CreditCard, Home, MessageSquare, ChevronLeft } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  
  export let data;
  const { booking, availableCleaners } = data;
  export let form;
  
  let isUpdateLoading = false;
  let showStatusChangeModal = false;
  let showCleanerAssignModal = false;
  let selectedStatus = booking.status;
  let selectedCleaner = booking.cleaner?.id || '';
  
  // Format date function
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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
  
  // Is the booking in the past?
  function isPastBooking(): boolean {
    const now = new Date();
    const bookingDate = new Date(booking.scheduledDate);
    return bookingDate < now;
  }
  
  // Format price
  function formatPrice(price): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(Number(price));
  }
  
  // Close modal on escape key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      showStatusChangeModal = false;
      showCleanerAssignModal = false;
    }
  }
</script>

<svelte:head>
  <title>Booking Details | BrightBroom Admin</title>
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

<!-- Page header with back button -->
<div class="mb-6 flex items-center">
  <a href="/admin/bookings" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mr-3">
    <ChevronLeft size={20} />
  </a>
  <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Booking Details</h1>
</div>

<!-- Status message if form action was performed -->
{#if form?.success}
  <div class="mb-6 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 p-4 rounded-md">
    {form.message}
  </div>
{:else if form?.error}
  <div class="mb-6 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 p-4 rounded-md">
    {form.error}
  </div>
{/if}

<!-- Booking status and actions header -->
<div class="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
  <div class="flex items-center">
    <span class={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(booking.status)}`}>
      {booking.status}
    </span>
    <span class="ml-2 text-gray-500 dark:text-gray-400">
      ID: {booking.id.substring(0, 8)}...
    </span>
  </div>
  
  <div class="mt-4 sm:mt-0 space-x-2">
    <Button 
      variant="outline" 
      on:click={() => showStatusChangeModal = true}
      disabled={booking.status === 'CANCELLED'}
    >
      Change Status
    </Button>
    
    <Button 
      variant="outline" 
      on:click={() => showCleanerAssignModal = true}
      disabled={booking.status === 'CANCELLED' || booking.status === 'COMPLETED' || isPastBooking()}
    >
      {booking.cleaner ? 'Reassign Cleaner' : 'Assign Cleaner'}
    </Button>
  </div>
</div>

<!-- Main content grid -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
  <!-- Left column: Booking details -->
  <div class="lg:col-span-2 space-y-6">
    <!-- Service details -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Service Details</h2>
      
      <div class="space-y-4">
        <div class="flex items-start">
          <Home size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Service Type</p>
            <p class="text-gray-600 dark:text-gray-300">{booking.service.name}</p>
          </div>
        </div>
        
        <div class="flex items-start">
          <Calendar size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Date</p>
            <p class="text-gray-600 dark:text-gray-300">{formatDate(booking.scheduledDate)}</p>
          </div>
        </div>
        
        <div class="flex items-start">
          <Clock size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Time</p>
            <p class="text-gray-600 dark:text-gray-300">{formatTime(booking.scheduledDate)}</p>
          </div>
        </div>
        
        <div class="flex items-start">
          <MapPin size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Location</p>
            <p class="text-gray-600 dark:text-gray-300">
              {booking.address.street}<br>
              {booking.address.city}, {booking.address.state} {booking.address.zipCode}
            </p>
          </div>
        </div>
        
        {#if booking.notes}
          <div class="flex items-start pt-3 border-t border-gray-200 dark:border-gray-700">
            <MessageSquare size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Customer Notes</p>
              <p class="text-gray-600 dark:text-gray-300">{booking.notes}</p>
            </div>
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Customer details -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Customer Details</h2>
      
      <div class="space-y-4">
        <div class="flex items-start">
          <User size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Name</p>
            <p class="text-gray-600 dark:text-gray-300">{booking.customer.firstName} {booking.customer.lastName}</p>
          </div>
        </div>
        
        <div class="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 mt-0.5 flex-shrink-0 text-primary h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Email</p>
            <p class="text-gray-600 dark:text-gray-300">{booking.customer.email}</p>
          </div>
        </div>
        
        {#if booking.customer.phone}
          <div class="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 mt-0.5 flex-shrink-0 text-primary h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Phone</p>
              <p class="text-gray-600 dark:text-gray-300">{booking.customer.phone}</p>
            </div>
          </div>
        {/if}
        
        <div class="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
          <a 
            href={`/admin/users/${booking.customer.id}`}
            class="text-primary hover:text-primary-600 font-medium text-sm"
          >
            View Customer Profile
          </a>
        </div>
      </div>
    </div>
    
    <!-- Cleaner details if assigned -->
    {#if booking.cleaner}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Assigned Cleaner</h2>
        
        <div class="space-y-4">
          <div class="flex items-start">
            <User size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Name</p>
              <p class="text-gray-600 dark:text-gray-300">{booking.cleaner.firstName} {booking.cleaner.lastName}</p>
            </div>
          </div>
          
          <div class="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 mt-0.5 flex-shrink-0 text-primary h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Email</p>
              <p class="text-gray-600 dark:text-gray-300">{booking.cleaner.email}</p>
            </div>
          </div>
          
          {#if booking.cleaner.phone}
            <div class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 mt-0.5 flex-shrink-0 text-primary h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Phone</p>
                <p class="text-gray-600 dark:text-gray-300">{booking.cleaner.phone}</p>
              </div>
            </div>
          {/if}
          
          {#if booking.cleaner.cleanerProfile && booking.cleaner.cleanerProfile.rating}
            <div class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 mt-0.5 flex-shrink-0 text-primary h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Rating</p>
                <p class="text-gray-600 dark:text-gray-300">{booking.cleaner.cleanerProfile.rating} / 5</p>
              </div>
            </div>
          {/if}
          
          <div class="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
            <a 
              href={`/admin/cleaners/${booking.cleaner.id}`}
              class="text-primary hover:text-primary-600 font-medium text-sm"
            >
              View Cleaner Profile
            </a>
          </div>
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Right column: Payment and actions -->
  <div class="space-y-6">
    <!-- Payment information -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Payment Details</h2>
      
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <span class="text-gray-600 dark:text-gray-300">Amount:</span>
          <span class="font-bold text-gray-900 dark:text-white">{formatPrice(booking.price)}</span>
        </div>
        
        {#if booking.payment}
          <div class="flex justify-between items-center">
            <span class="text-gray-600 dark:text-gray-300">Payment Status:</span>
            <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
              ${booking.payment.status === 'COMPLETED' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                : booking.payment.status === 'PENDING' 
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'}`}
            >
              {booking.payment.status}
            </span>
          </div>
          
          <div class="flex justify-between items-center">
            <span class="text-gray-600 dark:text-gray-300">Payment Method:</span>
            <span class="text-gray-900 dark:text-white">{booking.payment.paymentMethod.replace('_', ' ')}</span>
          </div>
          
          <div class="flex justify-between items-center">
            <span class="text-gray-600 dark:text-gray-300">Date:</span>
            <span class="text-gray-900 dark:text-white">{formatDate(booking.payment.createdAt)}</span>
          </div>
        {:else}
          <div class="py-2 text-center text-gray-500 dark:text-gray-400">
            No payment information available
          </div>
        {/if}
      </div>
      
      {#if booking.payment}
        <div class="mt-4 flex justify-end">
          <Button variant="outline" size="sm">
            <CreditCard size={16} class="mr-1" />
            View Receipt
          </Button>
        </div>
      {/if}
    </div>
    
    <!-- Booking timeline -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Booking Timeline</h2>
      
      <div class="space-y-4">
        <div class="flex">
          <div class="mr-3 flex flex-col items-center">
            <div class="bg-green-500 h-4 w-4 rounded-full"></div>
            <div class="bg-gray-200 dark:bg-gray-700 flex-grow w-px mt-1"></div>
          </div>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Booking Created</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">{formatDate(booking.createdAt)}</p>
          </div>
        </div>
        
        {#if booking.status !== 'PENDING'}
          <div class="flex">
            <div class="mr-3 flex flex-col items-center">
              <div class="bg-blue-500 h-4 w-4 rounded-full"></div>
              <div class="bg-gray-200 dark:bg-gray-700 flex-grow w-px mt-1"></div>
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Booking Confirmed</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">After payment completion</p>
            </div>
          </div>
        {/if}
        
        {#if booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED'}
          <div class="flex">
            <div class="mr-3 flex flex-col items-center">
              <div class="bg-yellow-500 h-4 w-4 rounded-full"></div>
              <div class="bg-gray-200 dark:bg-gray-700 flex-grow w-px mt-1"></div>
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Cleaning In Progress</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Cleaner started work</p>
            </div>
          </div>
        {/if}
        
        {#if booking.status === 'COMPLETED'}
          <div class="flex">
            <div class="mr-3 flex flex-col items-center">
              <div class="bg-purple-500 h-4 w-4 rounded-full"></div>
              <div class="bg-transparent flex-grow w-px mt-1"></div>
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Booking Completed</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Service successfully delivered</p>
            </div>
          </div>
        {:else if booking.status === 'CANCELLED'}
          <div class="flex">
            <div class="mr-3 flex flex-col items-center">
              <div class="bg-red-500 h-4 w-4 rounded-full"></div>
              <div class="bg-transparent flex-grow w-px mt-1"></div>
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Booking Cancelled</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Service was cancelled</p>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Status change modal -->
{#if showStatusChangeModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Booking Status</h3>
      
      <form 
        method="POST" 
        action="?/changeStatus"
        use:enhance={() => {
          isUpdateLoading = true;
          
          return async ({ result, update }) => {
            isUpdateLoading = false;
            showStatusChangeModal = false;
            
            await update();
          };
        }}
      >
        <div class="mb-4">
          <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            bind:value={selectedStatus}
            class="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        
        <div class="flex justify-end space-x-3">
          <Button 
            type="button" 
            variant="outline"
            on:click={() => showStatusChangeModal = false}
          >
            Cancel
          </Button>
          
          <Button 
            type="submit" 
            variant="primary"
            disabled={isUpdateLoading}
          >
            {#if isUpdateLoading}
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            {:else}
              Update Status
            {/if}
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Cleaner assignment modal -->
{#if showCleanerAssignModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        {booking.cleaner ? 'Reassign Cleaner' : 'Assign Cleaner'}
      </h3>
      
      <form 
        method="POST" 
        action="?/assignCleaner"
        use:enhance={() => {
          isUpdateLoading = true;
          
          return async ({ result, update }) => {
            isUpdateLoading = false;
            showCleanerAssignModal = false;
            
            await update();
          };
        }}
      >
        <div class="mb-4">
          <label for="cleanerId" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select Cleaner
          </label>
          <select
            id="cleanerId"
            name="cleanerId"
            bind:value={selectedCleaner}
            class="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">No Cleaner Assigned</option>
            {#each availableCleaners as cleaner}
              <option value={cleaner.id}>
                {cleaner.firstName} {cleaner.lastName}
                {#if cleaner.cleanerProfile && cleaner.cleanerProfile.rating}
                  (Rating: {cleaner.cleanerProfile.rating})
                {/if}
              </option>
            {/each}
          </select>
        </div>
        
        <div class="flex justify-end space-x-3">
          <Button 
            type="button" 
            variant="outline"
            on:click={() => showCleanerAssignModal = false}
          >
            Cancel
          </Button>
          
          <Button 
            type="submit" 
            variant="primary"
            disabled={isUpdateLoading}
          >
            {#if isUpdateLoading}
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            {:else}
              {booking.cleaner ? 'Update Assignment' : 'Assign Cleaner'}
            {/if}
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}
