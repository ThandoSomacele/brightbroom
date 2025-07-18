<!-- src/routes/profile/bookings/[id]/+page.svelte -->
<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import { Calendar, MapPin, Clock, CreditCard, Briefcase, User, MessageSquare } from 'lucide-svelte';
  import { notFound, forbidden } from '$lib/utils/errors';

  
  // Get data from the server load function
  export let data;
  const { booking } = data;
  
  
  // Format date function
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
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
  
  // Can the booking be cancelled?
  $: canCancel = (booking.status === 'PENDING' || booking.status === 'CONFIRMED') && 
                  !isPastBooking(booking.scheduledDate);
</script>

<svelte:head>
  <title>Booking Details | BrightBroom</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
  <div class="mx-auto max-w-4xl">
    <!-- Page header with back button -->
    <div class="mb-6 flex items-center">
      <Button variant="ghost" href="/profile/bookings" class="mr-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </Button>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Booking Details</h1>
    </div>
    
    <!-- Booking status banner -->
    <div class={`mb-6 flex items-center justify-between rounded-lg p-4 ${
      booking.status === 'CONFIRMED' ? 'bg-green-100 dark:bg-green-900/20' :
      booking.status === 'PENDING' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
      booking.status === 'IN_PROGRESS' ? 'bg-blue-100 dark:bg-blue-900/20' :
      booking.status === 'COMPLETED' ? 'bg-purple-100 dark:bg-purple-900/20' :
      'bg-red-100 dark:bg-red-900/20'
    }`}>
      <div class="flex items-center">
        <div class={`mr-4 rounded-full p-2 ${
          booking.status === 'CONFIRMED' ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' :
          booking.status === 'PENDING' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200' :
          booking.status === 'IN_PROGRESS' ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200' :
          booking.status === 'COMPLETED' ? 'bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200' :
          'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
        }`}>
          {#if booking.status === 'CONFIRMED'}
            <Calendar size={24} />
          {:else if booking.status === 'PENDING'}
            <Clock size={24} />
          {:else if booking.status === 'IN_PROGRESS'}
            <Briefcase size={24} />
          {:else if booking.status === 'COMPLETED'}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          {/if}
        </div>
        
        <div>
          <p class="font-medium text-gray-900 dark:text-white">
            Your booking is {booking.status.toLowerCase()}
          </p>
          
          <p class={`text-sm ${
            booking.status === 'CONFIRMED' ? 'text-green-800 dark:text-green-200' :
            booking.status === 'PENDING' ? 'text-yellow-800 dark:text-yellow-200' :
            booking.status === 'IN_PROGRESS' ? 'text-blue-800 dark:text-blue-200' :
            booking.status === 'COMPLETED' ? 'text-purple-800 dark:text-purple-200' :
            'text-red-800 dark:text-red-200'
          }`}>
            {#if booking.status === 'CONFIRMED'}
              Your booking has been confirmed and scheduled.
            {:else if booking.status === 'PENDING'}
              Your booking is waiting for confirmation.
            {:else if booking.status === 'IN_PROGRESS'}
              Your cleaning service is currently being performed.
            {:else if booking.status === 'COMPLETED'}
              Your cleaning service has been completed.
            {:else}
              Your booking has been cancelled.
            {/if}
          </p>
        </div>
      </div>
      
      <!-- {#if canCancel}
        <form method="POST" action={`/profile/bookings/${booking.id}/cancel`}>
          <Button 
            type="submit"
            variant="ghost" 
            class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Cancel Booking
          </Button>
        </form>
      {/if} -->
    </div>
    
    <!-- Booking details card -->
    <div class="mb-6 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <h2 class="mb-6 text-xl font-semibold text-gray-900 dark:text-white">Booking Information</h2>
      
      <div class="grid gap-6 md:grid-cols-2">
        <!-- Left column -->
        <div class="space-y-6">
          <div>
            <h3 class="mb-3 font-medium text-gray-700 dark:text-gray-300">Service Details</h3>
            <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/30">
              <p class="mb-1 text-lg font-semibold text-gray-900 dark:text-white">{booking.service.name}</p>
              <p class="text-sm text-gray-600 dark:text-gray-300">{booking.service.description}</p>
              <div class="mt-3 flex justify-between border-t border-gray-200 pt-3 dark:border-gray-600">
                <span class="text-gray-600 dark:text-gray-300">Duration:</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {booking.duration / 60} {booking.duration / 60 === 1 ? 'hour' : 'hours'}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 class="mb-3 font-medium text-gray-700 dark:text-gray-300">Booking Details</h3>
            <div class="space-y-3">
              <div class="flex items-start">
                <Calendar size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">Date</p>
                  <p class="text-sm text-gray-600 dark:text-gray-300">{formatDate(booking.scheduledDate)}</p>
                </div>
              </div>
              
              <div class="flex items-start">
                <Clock size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">Time</p>
                  <p class="text-sm text-gray-600 dark:text-gray-300">{formatTime(booking.scheduledDate)}</p>
                </div>
              </div>
              
              <div class="flex items-start">
                <MapPin size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">Location</p>
                  <p class="text-sm text-gray-600 dark:text-gray-300">
                    {booking.address ? booking.address.street : booking.guestAddress.street}<br>
                    {booking.address ? `${booking.address.city}, ${booking.address.state} ${booking.address.zipCode}` : `${booking.guestAddress.city}, ${booking.guestAddress.state} ${booking.guestAddress.zipCode}`}
                  </p>
                </div>
              </div>
              
              {#if booking.cleaner}
                <div class="flex items-start">
                  <User size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">Cleaner</p>
                    <p class="text-sm text-gray-600 dark:text-gray-300">
                      {booking.cleaner.firstName} {booking.cleaner.lastName}
                    </p>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>
        
        <!-- Right column -->
        <div class="space-y-6">
          <div>
            <h3 class="mb-3 font-medium text-gray-700 dark:text-gray-300">Payment Information</h3>
            <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/30">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-300">Service:</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  R{typeof booking.price === 'number' 
                      ? booking.price.toFixed(2) 
                      : parseFloat(booking.price).toFixed(2)}
                </span>
              </div>
              
              {#if booking.payment}
                <div class="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-600">
                  <div class="flex items-center text-gray-600 dark:text-gray-300">
                    <CreditCard size={16} class="mr-2" />
                    Payment Status:
                  </div>
                  <span class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(booking.payment.status)}`}>
                    {booking.payment.status}
                  </span>
                </div>
                
                {#if booking.payment.paymentMethod}
                  <div class="mt-2 flex justify-between text-sm">
                    <span class="text-gray-600 dark:text-gray-300">Payment Method:</span>
                    <span class="font-medium text-gray-900 dark:text-white">
                      {booking.payment.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                {/if}
              {:else}
                <div class="mt-4 border-t border-gray-200 pt-3 dark:border-gray-600">
                  <p class="text-sm text-gray-600 dark:text-gray-300">
                    No payment information available yet.
                  </p>
                </div>
              {/if}
            </div>
          </div>
          
          {#if booking.notes}
            <div>
              <h3 class="mb-3 font-medium text-gray-700 dark:text-gray-300">Additional Notes</h3>
              <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/30">
                <div class="flex items-start">
                  <MessageSquare size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
                  <p class="text-sm text-gray-600 dark:text-gray-300">{booking.notes}</p>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
    
    <!-- Action buttons -->
    <div class="flex flex-wrap justify-between gap-4">
      <Button variant="outline" href="/profile/bookings">
        Back to Bookings
      </Button>
      
      {#if booking.status === 'COMPLETED'}
        <Button variant="primary" href="/book?rebookFrom={booking.id}">
          Book Again
        </Button>
      {/if}
    </div>
  </div>
</div>
