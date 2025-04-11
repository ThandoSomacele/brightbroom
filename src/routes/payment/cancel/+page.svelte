<!-- src/routes/payment/cancel/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { X } from 'lucide-svelte';

  // Get booking ID from URL params
  let bookingId = $page.url.searchParams.get('booking_id');
  
  // We'll track whether this was canceled by the user or if it's just missing params
  let userCanceled = $page.url.searchParams.has('canceled');
  let isLoading = false;
  
  onMount(() => {
    // If no booking ID was provided in the URL params, check local storage
    if (!bookingId) {
      // Try to recover the booking ID from localStorage (if the payment process saved it)
      const storedBookingData = localStorage.getItem('current_booking_id');
      if (storedBookingData) {
        bookingId = storedBookingData;
        console.log('Recovered booking ID from local storage:', bookingId);
      } else {
        console.error('No booking ID found in redirect parameters or local storage');
      }
    }
  });
  
  // Function to go to bookings page
  function viewBookings() {
    isLoading = true;
    goto('/profile/bookings');
  }
  
  // Function to go back to home
  function goHome() {
    isLoading = true;
    goto('/');
  }
  
  // Function to try booking again
  function bookAgain() {
    isLoading = true;
    goto('/book');
  }
</script>

<svelte:head>
  <title>Payment Cancelled | BrightBroom</title>
</svelte:head>

<div class="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
  <div class="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
    <div class="mb-6 flex justify-center">
      <div class="w-16 h-16 flex items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">
        <X size={32} />
      </div>
    </div>
    
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
      Payment Cancelled
    </h1>
    
    {#if userCanceled}
      <p class="text-gray-600 dark:text-gray-300 mb-6">
        You've cancelled your payment. Your booking will remain pending until payment is completed.
      </p>
    {:else}
      <p class="text-gray-600 dark:text-gray-300 mb-6">
        The payment process was interrupted. Your booking will remain pending until payment is completed.
      </p>
    {/if}
    
    {#if bookingId}
      <div class="space-y-3 mt-6">
        <Button 
          variant="primary" 
          href={`/payment/process?bookingId=${bookingId}`} 
          class="w-full"
        >
          Try Payment Again
        </Button>
        
        <Button 
          variant="outline" 
          href={`/profile/bookings/${bookingId}`} 
          class="w-full"
        >
          View Booking Details
        </Button>
      </div>
    {:else}
      <div class="space-y-3 mt-6">
        <Button 
          variant="primary" 
          on:click={viewBookings} 
          disabled={isLoading} 
          class="w-full"
        >
          View My Bookings
        </Button>
        
        <Button 
          variant="outline" 
          on:click={bookAgain} 
          disabled={isLoading} 
          class="w-full"
        >
          Book Again
        </Button>
        
        <Button 
          variant="ghost" 
          on:click={goHome} 
          disabled={isLoading} 
          class="w-full"
        >
          Back to Home
        </Button>
      </div>
    {/if}
  </div>
  
  <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
    Need help? Contact our support team.
  </p>
</div>
