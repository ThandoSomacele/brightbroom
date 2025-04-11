<!-- src/routes/payment/cancel/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { AlertTriangle } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  
  // Get booking ID and error from URL params
  let bookingId = $page.url.searchParams.get('bookingId');
  let errorCode = $page.url.searchParams.get('error_code') || '';
  let errorMessage = $page.url.searchParams.get('error_message') || '';
  
  // Local state
  let isLoading = true;
  let booking: any = null;
  let error = '';
  
  onMount(async () => {
    if (!bookingId) {
      // Try other possible parameter names from PayFast
      bookingId = $page.url.searchParams.get('m_payment_id') || 
                 $page.url.searchParams.get('custom_str1') || 
                 $page.url.searchParams.get('payment_id');
    }
    
    if (!bookingId) {
      console.error('No booking ID found in redirect parameters:', $page.url.search);
      error = 'No booking information found.';
      isLoading = false;
      return;
    }
    
    try {
      console.log(`Fetching booking details for ID: ${bookingId}`);
      
      // Fetch booking details
      const response = await fetch(`/api/bookings/${bookingId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch booking details: ${response.status}`);
      }
      
      booking = await response.json();
      isLoading = false;
      console.log('Booking details retrieved successfully');
    } catch (e) {
      console.error('Error fetching booking:', e);
      error = 'Error retrieving booking information.';
      isLoading = false;
    }
  });
  
  // Navigate to retry payment
  function retryPayment() {
    goto(`/payment/process?bookingId=${bookingId}`);
  }
  
  // Go to bookings
  function viewBookings() {
    goto('/profile/bookings');
  }
  
  // Go back to homepage
  function backToHome() {
    goto('/');
  }
</script>

<svelte:head>
  <title>Payment Cancelled | BrightBroom</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
  <div class="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
    {#if isLoading}
      <div class="p-8 text-center">
        <div class="animate-pulse flex flex-col items-center justify-center">
          <div class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mb-4"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    {:else if error}
      <div class="p-8 text-center">
        <div class="text-red-500 mb-4">⚠️</div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
        <Button
          on:click={backToHome}
          class="px-6 py-2 bg-primary hover:bg-primary-600 text-white rounded-md 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Back to Home
        </Button>
      </div>
    {:else}
      <div class="bg-secondary-400 p-4">
        <div class="flex justify-center">
          <AlertTriangle size={80} class="text-white" />
        </div>
      </div>
      
      <div class="p-6">
        <h1 class="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
          Payment Cancelled
        </h1>
        
        <p class="text-gray-600 dark:text-gray-400 mb-6 text-center">
          {errorMessage || 'Your payment was not completed. You can try again or view your bookings.'}
        </p>
        
        {#if booking}
          <div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-6">
            <h2 class="font-medium text-gray-700 dark:text-gray-300 mb-2">Booking Details</h2>
            
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Service:</span>
                <span class="font-medium text-gray-900 dark:text-white">{booking.service.name}</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Date:</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {new Date(booking.scheduledDate).toLocaleDateString('en-ZA')}
                </span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Time:</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {new Date(booking.scheduledDate).toLocaleTimeString('en-ZA', { 
                    hour: '2-digit', 
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Status:</span>
                <span class="font-medium text-red-600 dark:text-red-400">
                  Payment Required
                </span>
              </div>
            </div>
          </div>
        {/if}
        
        <div class="space-y-3">
          <Button
            on:click={retryPayment}
            class="w-full px-6 py-2 bg-primary hover:bg-primary-600 text-white rounded-md 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Try Payment Again
          </Button>
          
          <Button
            on:click={viewBookings}
            class="w-full px-6 py-2 border border-gray-300 dark:border-gray-600 
              hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            View My Bookings
          </Button>
          
          <Button
            on:click={backToHome}
            variant="ghost"
            class="w-full px-6 py-2 text-gray-700 dark:text-gray-300"
          >
            Back to Home
          </Button>
        </div>
      </div>
    {/if}
  </div>

  <p class="mt-8 text-sm text-gray-500 dark:text-gray-400">
    Need assistance? <a href="/contact" class="text-primary hover:underline">Contact our support team</a>
  </p>
</div>
