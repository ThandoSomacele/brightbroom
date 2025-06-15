<!-- src/routes/payment/success/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { CheckCircle, Mail, Lock, Calendar, ArrowRight } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  
  // Get booking ID from URL params
  let bookingId = $page.url.searchParams.get('m_payment_id') || 
                 $page.url.searchParams.get('booking_id');
  let isGuest = $page.url.searchParams.get('guest') === 'true';
  
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

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function goToLogin() {
    goto('/auth/login');
  }

  function goToBookings() {
    goto('/profile/bookings');
  }

  function goHome() {
    goto('/');
  }
</script>

<svelte:head>
  <title>Payment Successful | BrightBroom</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
  <div class="max-w-4xl mx-auto px-4">
    {#if isLoading}
      <div class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-6"></div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Loading booking details...
        </h1>
      </div>
    {:else if error}
      <div class="text-center">
        <div class="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
          <h1 class="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">
            Error Loading Booking
          </h1>
          <p class="text-red-600 dark:text-red-300">{error}</p>
        </div>
        <Button on:click={goHome} variant="primary">
          Return to Home
        </Button>
      </div>
    {:else}
      <!-- Success Content -->
      <div class="text-center mb-8">
        <div class="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={32} class="text-green-500" />
        </div>
        
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Payment Successful!
        </h1>
        
        <p class="text-lg text-gray-600 dark:text-gray-300 mb-6">
          Your cleaning service has been booked and confirmed.
        </p>

        {#if isGuest}
          <!-- Guest-specific messaging -->
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
            <div class="flex items-center justify-center mb-4">
              <Mail size={24} class="text-blue-500 mr-2" />
              <h2 class="text-lg font-semibold text-blue-800 dark:text-blue-200">
                Account Created Successfully
              </h2>
            </div>
            <p class="text-blue-700 dark:text-blue-300 mb-4">
              We've created an account for you and sent a confirmation email with instructions 
              to set up your password. You can use this account to manage your bookings.
            </p>
            <div class="flex items-center justify-center text-sm text-blue-600 dark:text-blue-400">
              <Lock size={16} class="mr-1" />
              Check your email to activate your account
            </div>
          </div>
        {/if}
      </div>

      {#if booking}
        <!-- Booking Details -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Booking Details
          </h2>
          
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <h3 class="font-medium text-gray-900 dark:text-white mb-2">Service</h3>
              <p class="text-gray-600 dark:text-gray-300">{booking.service?.name || 'Loading...'}</p>
            </div>
            
            <div>
              <h3 class="font-medium text-gray-900 dark:text-white mb-2">Booking Reference</h3>
              <p class="text-gray-600 dark:text-gray-300 font-mono text-sm">
                {booking.id?.slice(0, 8).toUpperCase() || 'Loading...'}
              </p>
            </div>
            
            <div>
              <h3 class="font-medium text-gray-900 dark:text-white mb-2">Date & Time</h3>
              <p class="text-gray-600 dark:text-gray-300">
                {booking.scheduledDate ? formatDate(booking.scheduledDate) : 'Loading...'}
              </p>
              <p class="text-gray-600 dark:text-gray-300">
                {booking.scheduledDate ? formatTime(booking.scheduledDate) : 'Loading...'}
              </p>
            </div>
            
            <div>
              <h3 class="font-medium text-gray-900 dark:text-white mb-2">Total Paid</h3>
              <p class="text-gray-600 dark:text-gray-300 font-semibold">
                R{booking.price ? parseFloat(booking.price).toFixed(2) : '0.00'}
              </p>
            </div>
            
            <div class="md:col-span-2">
              <h3 class="font-medium text-gray-900 dark:text-white mb-2">Address</h3>
              <p class="text-gray-600 dark:text-gray-300">
                {#if booking.address}
                  {booking.address.street}, {booking.address.city}, {booking.address.state} {booking.address.zipCode}
                {:else}
                  Loading address...
                {/if}
              </p>
            </div>
          </div>
        </div>

        <!-- Next Steps -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            What happens next?
          </h2>
          
          <div class="space-y-4">
            <div class="flex items-start">
              <div class="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mr-4">
                <span class="text-primary font-semibold text-sm">1</span>
              </div>
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">Confirmation Email</h3>
                <p class="text-gray-600 dark:text-gray-300 text-sm">
                  You'll receive a confirmation email with all your booking details.
                  {#if isGuest}
                    This email will also include instructions to set up your password.
                  {/if}
                </p>
              </div>
            </div>
            
            <div class="flex items-start">
              <div class="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mr-4">
                <span class="text-primary font-semibold text-sm">2</span>
              </div>
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">Cleaner Assignment</h3>
                <p class="text-gray-600 dark:text-gray-300 text-sm">
                  We'll assign a professional cleaner to your booking and notify you with their details.
                </p>
              </div>
            </div>
            
            <div class="flex items-start">
              <div class="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mr-4">
                <span class="text-primary font-semibold text-sm">3</span>
              </div>
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">Service Day</h3>
                <p class="text-gray-600 dark:text-gray-300 text-sm">
                  Your cleaner will arrive at the scheduled time to provide the service.
                </p>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        {#if isGuest}
          <Button on:click={goToLogin} variant="primary" class="flex items-center">
            <Lock size={18} class="mr-2" />
            Set Up Your Account
          </Button>
          <Button on:click={goHome} variant="outline">
            Return to Home
          </Button>
        {:else}
          <Button on:click={goToBookings} variant="primary" class="flex items-center">
            <Calendar size={18} class="mr-2" />
            View Your Bookings
          </Button>
          <Button on:click={goHome} variant="outline">
            Return to Home
          </Button>
        {/if}
      </div>

      <!-- Support Information -->
      <div class="mt-8 text-center">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Need help? Contact our support team at 
          <a href="mailto:support@brightbroom.co.za" class="text-primary hover:underline">
            support@brightbroom.co.za
          </a>
        </p>
      </div>
    {/if}
  </div>
</div>
