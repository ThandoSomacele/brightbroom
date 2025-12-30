<!-- src/routes/book/payment/subscription-success/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { CheckCircle } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';

  // Get subscription ID from URL params
  let subscriptionId = $page.url.searchParams.get('m_payment_id');
  let isLoading = true;
  let subscription: any = null;
  let error = '';

  onMount(async () => {
    if (!subscriptionId) {
      // Try other possible parameter names from PayFast
      subscriptionId = $page.url.searchParams.get('pf_payment_id') ||
                 $page.url.searchParams.get('payment_id');
    }

    if (!subscriptionId) {
      console.error('No subscription ID found in redirect parameters:', $page.url.search);
      error = 'No subscription information found.';
      isLoading = false;
      return;
    }

    try {
      console.log(`Subscription payment successful for ID: ${subscriptionId}`);

      // For now, just show success message
      // You can fetch subscription details if needed
      isLoading = false;
      console.log('Subscription payment completed successfully');
    } catch (e) {
      console.error('Error processing subscription:', e);
      error = 'Error processing subscription information.';
      isLoading = false;
    }
  });

  // Navigate to subscriptions management
  function viewSubscriptions() {
    goto('/profile/subscriptions');
  }

  // Go back to homepage
  function backToHome() {
    goto('/');
  }
</script>

<svelte:head>
<title>Subscription Activated | BrightBroom</title>
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
    <div class="bg-primary-400 p-4">
      <div class="flex justify-center">
        <CheckCircle size={80} class="text-white" />
      </div>
    </div>

    <div class="p-6">
      <h1 class="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
        Subscription Activated!
      </h1>

      <div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-6">
        <h2 class="font-medium text-gray-700 dark:text-gray-300 mb-3">What happens next?</h2>

        <div class="space-y-3">
          <div class="flex items-start">
            <div class="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold mr-3">
              1
            </div>
            <div>
              <p class="text-sm text-gray-800 dark:text-gray-200 font-medium">
                Subscription Confirmed
              </p>
              <p class="text-xs text-gray-600 dark:text-gray-400">
                Your recurring cleaning service subscription is now active
              </p>
            </div>
          </div>

          <div class="flex items-start">
            <div class="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold mr-3">
              2
            </div>
            <div>
              <p class="text-sm text-gray-800 dark:text-gray-200 font-medium">
                Bookings Created Automatically
              </p>
              <p class="text-xs text-gray-600 dark:text-gray-400">
                We'll create bookings based on your schedule
              </p>
            </div>
          </div>

          <div class="flex items-start">
            <div class="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold mr-3">
              3
            </div>
            <div>
              <p class="text-sm text-gray-800 dark:text-gray-200 font-medium">
                Confirmation Email Sent
              </p>
              <p class="text-xs text-gray-600 dark:text-gray-400">
                Check your email for subscription details
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <Button
          on:click={viewSubscriptions}
          class="w-full px-6 py-2 bg-primary hover:bg-primary-600 text-white rounded-md
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          View My Subscriptions
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

<p class="mt-8 text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
  You can manage, pause, or cancel your subscription anytime from your profile.
</p>
</div>
