<!-- src/routes/payment/cancel/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import { XCircle, AlertTriangle, Calendar, MapPin } from 'lucide-svelte';
  
  // Get data from the server load function
  export let data;
  
  // Destructure the data
  const { bookingId, bookingData, bookingFound, userCanceled, error, unauthorized } = data;
</script>

<svelte:head>
  <title>Payment Cancelled | BrightBroom</title>
</svelte:head>

<div class="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
  <div class="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
    <!-- Payment cancellation confirmation -->
    {#if userCanceled}
      <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-center">
        <XCircle size={60} class="text-red-500 dark:text-red-400" />
      </div>
      
      <div class="p-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
          Payment Cancelled
        </h1>
        
        {#if error}
          <div class="mb-6 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex items-start">
            <AlertTriangle class="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-red-500 dark:text-red-400" />
            <p class="text-red-700 dark:text-red-300">
              {error === 'missing_reference' ? 'No booking information found.' : 
               error === 'booking_not_found' ? 'The booking could not be found.' : 
               error === 'processing_error' ? 'There was an error processing your cancellation.' :
               error}
            </p>
          </div>
        {/if}
        
        {#if bookingFound && bookingData}
          <div class="mb-6">
            <p class="text-gray-600 dark:text-gray-300 mb-4">
              Your booking has been cancelled and no payment has been processed.
            </p>
            
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h2 class="font-medium text-gray-800 dark:text-gray-200 mb-2">Booking Details</h2>
              
              <div class="space-y-2">
                <div class="flex items-start">
                  <Calendar size={18} class="mr-2 mt-0.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <div>
                    <p class="text-sm text-gray-700 dark:text-gray-300">
                      {new Date(bookingData.booking.scheduledDate).toLocaleDateString('en-ZA', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(bookingData.booking.scheduledDate).toLocaleTimeString('en-ZA', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                
                <div class="flex items-start">
                  <MapPin size={18} class="mr-2 mt-0.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <p class="text-sm text-gray-700 dark:text-gray-300">
                    {bookingData.address.street}, {bookingData.address.city}
                  </p>
                </div>
                
                <div class="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600 mt-2">
                  <span class="text-sm text-gray-600 dark:text-gray-400">Service:</span>
                  <span class="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {bookingData.service.name}
                  </span>
                </div>
                
                <div class="flex justify-between">
                  <span class="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                  <span class="text-sm font-medium text-red-600 dark:text-red-400">
                    CANCELLED
                  </span>
                </div>
                
                <div class="flex justify-between">
                  <span class="text-sm text-gray-600 dark:text-gray-400">Amount:</span>
                  <span class="text-sm font-medium text-gray-800 dark:text-gray-200">
                    R{typeof bookingData.booking.price === 'number' 
                      ? bookingData.booking.price.toFixed(2) 
                      : parseFloat(bookingData.booking.price).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        {:else}
          <p class="text-gray-600 dark:text-gray-300 mb-6 text-center">
            Your payment has been cancelled. No charges have been made to your account.
          </p>
        {/if}
        
        <div class="flex flex-col space-y-3">
          {#if bookingFound}
            <Button variant="primary" href={`/profile/bookings`}>
              View My Bookings
            </Button>
          {/if}
          
          <Button variant="outline" href="/book">
            Book Another Service
          </Button>
          
          <Button variant="outline" href="/">
            Return to Home
          </Button>
        </div>
      </div>
    {:else}
      <!-- Default state if not a cancellation -->
      <div class="p-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
          Payment Page
        </h1>
        
        <p class="text-gray-600 dark:text-gray-300 mb-6 text-center">
          This page handles payment cancellations from our payment provider.
        </p>
        
        <div class="flex justify-center">
          <Button variant="primary" href="/">
            Return to Home
          </Button>
        </div>
      </div>
    {/if}
  </div>
</div>
