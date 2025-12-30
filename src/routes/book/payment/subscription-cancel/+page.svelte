<!-- src/routes/book/payment/subscription-cancel/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { XCircle } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';

  // Navigate functions
  function tryAgain() {
    goto('/book');
  }

  function backToHome() {
    goto('/');
  }

  function contactSupport() {
    goto('/contact');
  }
</script>

<svelte:head>
<title>Subscription Cancelled | BrightBroom</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
<div class="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
  <div class="bg-orange-400 p-4">
    <div class="flex justify-center">
      <XCircle size={80} class="text-white" />
    </div>
  </div>

  <div class="p-6">
    <h1 class="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
      Subscription Cancelled
    </h1>

    <p class="text-center text-gray-600 dark:text-gray-300 mb-6">
      Your subscription setup was cancelled. No charges have been made to your account.
    </p>

    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
      <h2 class="font-medium text-gray-700 dark:text-gray-300 mb-2">What happened?</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        The subscription payment was either cancelled by you or timed out. You can try again at any time.
      </p>
    </div>

    <div class="space-y-3">
      <Button
        on:click={tryAgain}
        class="w-full px-6 py-2 bg-primary hover:bg-primary-600 text-white rounded-md
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        Try Again
      </Button>

      <Button
        on:click={contactSupport}
        class="w-full px-6 py-2 border border-gray-300 dark:border-gray-600
          hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      >
        Contact Support
      </Button>

      <Button
        on:click={backToHome}
        class="w-full px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
      >
        Back to Home
      </Button>
    </div>
  </div>
</div>

<p class="mt-8 text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
  Need help? Our support team is here to assist you.
</p>
</div>
