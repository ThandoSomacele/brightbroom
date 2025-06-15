<!-- src/routes/payment/process/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  // Get booking ID from query parameters
  let bookingId = $page.url.searchParams.get('bookingId');
  let isLoading = true;
  let error = '';
  let isGuest = false;
  let bookingDetails: any = null;
  
  // Initialize PayFast redirect
  onMount(async () => {
    if (!bookingId) {
      error = 'No booking information found. Please try again.';
      isLoading = false;
      return;
    }
    
    try {
      console.log(`Initiating payment process for booking: ${bookingId}`);
      
      // Call the payment process API
      const response = await fetch('/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bookingId })
      });
      
      // Handle any HTTP errors
      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle authentication errors for guest users
        if (response.status === 401) {
          // This shouldn't happen with the updated API, but handle gracefully
          error = 'Session expired. Please try booking again.';
          isLoading = false;
          return;
        }
        
        throw new Error(errorData.error || 'Payment initialization failed');
      }
      
      // Get the PayFast redirect URL and booking details
      const data = await response.json();
      const { redirectUrl, bookingDetails: details } = data;
      
      if (details) {
        bookingDetails = details;
        isGuest = details.isGuestBooking;
        console.log(`Processing payment for ${isGuest ? 'guest' : 'authenticated'} user:`, details.userEmail);
      }
      
      if (!redirectUrl) {
        throw new Error('No redirect URL received from payment processor');
      }
      
      console.log('Redirecting to payment gateway...');
      
      // Small delay to ensure user sees the loading state
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1000);
    } catch (error) {
      console.error('Payment error:', error);
      isLoading = false;
      error = error instanceof Error 
        ? error.message 
        : 'Failed to initialize payment. Please try again later.';
    }
  });

  function goBack() {
    goto('/book/review');
  }
</script>

<svelte:head>
  <title>Processing Payment | BrightBroom</title>
</svelte:head>

<div class="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
  <div class="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
    {#if isLoading}
      <div class="text-center">
        <div class="mb-6">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Processing Payment
        </h1>
        <p class="text-gray-600 dark:text-gray-300 mb-4">
          Please wait while we connect to our secure payment gateway...
        </p>
        
        {#if bookingDetails}
          <div class="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-left">
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">
              <span class="font-medium">Booking for:</span> {bookingDetails.userFirstName} {bookingDetails.userLastName}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">
              <span class="font-medium">Amount:</span> R{parseFloat(bookingDetails.price).toFixed(2)}
            </p>
            {#if isGuest}
              <p class="text-xs text-blue-600 dark:text-blue-400 mt-2">
                ✓ Account will be created after successful payment
              </p>
            {/if}
          </div>
        {/if}
        
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">
          You will be redirected automatically in a few moments...
        </p>
      </div>
    {:else if error}
      <div class="text-center">
        <div class="mb-6">
          <div class="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
            <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Payment Error
        </h1>
        <p class="text-gray-600 dark:text-gray-300 mb-6">
          {error}
        </p>
        <button
          on:click={goBack}
          class="bg-primary hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Try Again
        </button>
      </div>
    {/if}
  </div>
</div>
