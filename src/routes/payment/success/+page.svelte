<!-- src/routes/payment/success/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { AlertTriangle, CheckCircle } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { formatDate, formatTime } from '$lib/utils/date-utils';
  
  // Get booking ID from URL params - try multiple possible parameters
  let bookingId = $page.url.searchParams.get('m_payment_id');
  let isLoading = true;
  let booking: any = null;
  let error = '';
  let webhookExecuted = false;
  
  // Execute the webhook to ensure email is sent
  async function executeWebhook(bookingId: string) {
    try {
      console.log('Executing webhook for booking:', bookingId);
      const response = await fetch('/api/bookings/execute-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bookingId })
      });
      
      const result = await response.json();
      console.log('Webhook execution result:', result);
      webhookExecuted = true;
      return result.success;
    } catch (err) {
      console.error('Error executing webhook:', err);
      return false;
    }
  }
  
  onMount(async () => {
    if (!bookingId) {
      // Try other possible parameter names from PayFast
      bookingId = $page.url.searchParams.get('custom_str1') || 
                 $page.url.searchParams.get('pf_payment_id') || 
                 $page.url.searchParams.get('payment_id') || 
                 $page.url.searchParams.get('booking_id');
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
      
      // IMPORTANT: Execute the webhook to ensure email is sent
      if (booking && booking.status === 'CONFIRMED') {
        await executeWebhook(bookingId);
      }
      
      isLoading = false;
      console.log('Booking details retrieved successfully');
    } catch (e) {
      console.error('Error fetching booking:', e);
      error = 'Error retrieving booking information.';
      isLoading = false;
    }
  });
  
  // Navigate to booking details
  function viewBookingDetails() {
    goto(`/profile/bookings/${booking.id}`);
  }
  
  // Go back to homepage
  function backToHome() {
    goto('/');
  }
</script>

<svelte:head>
<title>Payment Successful | BrightBroom</title>
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
      <AlertTriangle class="h-12 w-12 text-red-500 mx-auto mb-4" />
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
    <div class="bg-primary-400 p-4">
      <div class="flex justify-center">
        <CheckCircle size={80} class="text-white" />
      </div>
    </div>
    
    <div class="p-6">
      <h1 class="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
        Payment Successful!
      </h1>
      
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
              {formatDate(booking.scheduledDate)}
            </span>
          </div>

          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Time:</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {formatTime(booking.scheduledDate)}
            </span>
          </div>
          
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Location:</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {booking.address ? booking.address.street : booking.guestAddress.street}
            </span>
          </div>
          
          <div class="pt-2 border-t border-gray-200 dark:border-gray-600">
            <div class="flex justify-between text-lg">
              <span class="text-gray-600 dark:text-gray-400">Amount Paid:</span>
              <span class="font-bold text-primary">
                R{typeof booking.price === 'number' 
                    ? booking.price.toFixed(2) 
                    : parseFloat(booking.price).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="space-y-3">
        <Button
          on:click={viewBookingDetails}
          class="w-full px-6 py-2 bg-primary hover:bg-primary-600 text-white rounded-md 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          View Booking Details
        </Button>
        
        <Button
          on:click={backToHome}
          class="w-full px-6 py-2 border border-gray-300 dark:border-gray-600 
            hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Back to Home
        </Button>
      </div>
    </div>
  {/if}
</div>

<p class="mt-8 text-sm text-gray-500 dark:text-gray-400">
  A confirmation email has been sent to your registered email address.
</p>
</div>
