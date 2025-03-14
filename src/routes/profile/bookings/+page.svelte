<!-- src/routes/profile/bookings/+page.svelte -->
<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import { Calendar, MapPin, Clock, CreditCard } from 'lucide-svelte';
  
  // Get data from the server load function
  export let data;
  const { bookings } = data;
  
  // Filter bookings by status
  let filterStatus = 'all';
  $: filteredBookings = filterStatus === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status === filterStatus);
    
  // Format date function
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  // Format time function
  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, { 
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
  function isPastBooking(dateString: string): boolean {
    const now = new Date();
    const bookingDate = new Date(dateString);
    return bookingDate < now;
  }
</script>

<svelte:head>
  <title>My Bookings | BrightBroom</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
  <div class="mx-auto max-w-6xl">
    <!-- Page header with back button -->
    <div class="mb-6 flex items-center">
      <Button variant="ghost" href="/profile" class="mr-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </Button>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">My Bookings</h1>
    </div>
    
    <!-- Filters and actions -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-wrap gap-2">
        <button 
          class={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${filterStatus === 'all' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'}`}
          on:click={() => filterStatus = 'all'}
        >
          All
        </button>
        <button 
          class={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${filterStatus === 'CONFIRMED' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'}`}
          on:click={() => filterStatus = 'CONFIRMED'}
        >
          Confirmed
        </button>
        <button 
          class={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${filterStatus === 'PENDING' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'}`}
          on:click={() => filterStatus = 'PENDING'}
        >
          Pending
        </button>
        <button 
          class={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${filterStatus === 'COMPLETED' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'}`}
          on:click={() => filterStatus = 'COMPLETED'}
        >
          Completed
        </button>
      </div>
      
      <Button variant="primary" href="/book">
        <Calendar size={18} class="mr-2" />
        Book New Cleaning
      </Button>
    </div>
    
    <!-- Bookings list -->
    <div class="space-y-6">
      {#if filteredBookings.length > 0}
        {#each filteredBookings as booking}
          <div class="rounded-lg bg-white p-6 shadow-md transition-all hover:shadow-lg dark:bg-gray-800">
            <div class="flex flex-wrap justify-between gap-4">
              <!-- Left column: Booking details -->
              <div class="flex-1">
                <div class="mb-4 flex items-center">
                  <span class={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeClass(booking.status)}`}>
                    {booking.status}
                  </span>
                  
                  {#if isPastBooking(booking.scheduledDate) && booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED'}
                    <span class="ml-3 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                      Past date
                    </span>
                  {/if}
                </div>
                
                <h2 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                  {booking.service.name}
                </h2>
                
                <div class="space-y-2">
                  <p class="flex items-center text-gray-600 dark:text-gray-300">
                    <Calendar size={18} class="mr-2 text-primary" />
                    {formatDate(booking.scheduledDate)}
                  </p>
                  
                  <p class="flex items-center text-gray-600 dark:text-gray-300">
                    <Clock size={18} class="mr-2 text-primary" />
                    {formatTime(booking.scheduledDate)} 
                    ({booking.duration / 60} {booking.duration / 60 === 1 ? 'hour' : 'hours'})
                  </p>
                  
                  <p class="flex items-center text-gray-600 dark:text-gray-300">
                    <MapPin size={18} class="mr-2 text-primary" />
                    {booking.address.street}, {booking.address.city}
                  </p>
                  
                  {#if booking.payment}
                    <p class="flex items-center text-gray-600 dark:text-gray-300">
                      <CreditCard size={18} class="mr-2 text-primary" />
                      Payment: {booking.payment.status}
                    </p>
                  {/if}
                </div>
              </div>
              
              <!-- Right column: Price and actions -->
              <div class="flex flex-col items-end justify-between">
                <div class="text-right">
                  <div class="mb-2 text-2xl font-bold text-primary">
                    R{typeof booking.price === 'number' 
                        ? booking.price.toFixed(2) 
                        : parseFloat(booking.price).toFixed(2)}
                  </div>
                </div>
                
                <div class="mt-4 flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    href={`/profile/bookings/${booking.id}`}
                  >
                    View Details
                  </Button>
                  
                  {#if booking.status === 'PENDING' || booking.status === 'CONFIRMED'}
                    {#if !isPastBooking(booking.scheduledDate)}
                      <form method="POST" action={`/profile/bookings/${booking.id}/cancel`}>
                        <Button 
                          type="submit"
                          variant="ghost" 
                          class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Cancel
                        </Button>
                      </form>
                    {/if}
                  {/if}
                </div>
              </div>
            </div>
          </div>
        {/each}
      {:else}
        <div class="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-white">No bookings found</h3>
          
          {#if filterStatus !== 'all'}
            <p class="mb-4 text-gray-600 dark:text-gray-400">
              No {filterStatus.toLowerCase()} bookings found. Try a different filter or book a new cleaning.
            </p>
            <Button 
              variant="outline" 
              on:click={() => filterStatus = 'all'}
            >
              Show all bookings
            </Button>
          {:else}
            <p class="mb-4 text-gray-600 dark:text-gray-400">
              You haven't booked any cleanings yet. Book your first cleaning now!
            </p>
            <Button 
              variant="primary" 
              href="/book"
            >
              Book a Cleaning
            </Button>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
</script>
