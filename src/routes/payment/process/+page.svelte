<!-- src/routes/payment/process/+page.svelte -->
<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { page } from "$app/stores";
  import { secureAPIFetch } from "$lib/utils/api-helpers";
  import { onMount } from "svelte";

  // Get booking ID from query parameters
  let bookingId = $page.url.searchParams.get("bookingId");
  let isRecurring = $page.url.searchParams.get("recurring") === "true";
  let isLoading = true;
  let error = "";

  // Initialise PayFast redirect
  onMount(async () => {
    // For recurring payments without a booking ID, we need to create a subscription
    if (isRecurring && !bookingId) {
      try {
        console.log("Initiating recurring subscription process");

        // Reload page data to get fresh CSRF token after login
        await invalidateAll();

        // Wait a bit for the page data to refresh
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Call the subscription creation API
        const response = await secureAPIFetch("/api/subscription/create", {
          method: "POST",
          body: JSON.stringify({}),
        });

        // Handle any HTTP errors
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Subscription initialization failed",
          );
        }

        // Get the PayFast redirect URL
        const data = await response.json();
        const { redirectUrl } = data;

        if (!redirectUrl) {
          throw new Error("No redirect URL received from payment processor");
        }

        console.log("Redirecting to PayFast for subscription...");
        window.location.href = redirectUrl;
        return;
      } catch (err) {
        console.error("Subscription error:", err);
        isLoading = false;
        error =
          err instanceof Error
            ? err.message
            : "Failed to Initialise subscription. Please try again later.";
        return;
      }
    }

    // For one-time payments, we need a booking ID
    if (!bookingId) {
      error = "No booking information found. Please try again.";
      isLoading = false;
      return;
    }

    try {
      console.log(`Initiating payment process for booking: ${bookingId}`);

      // Call the payment process API with CSRF token
      const response = await secureAPIFetch("/api/payments/process", {
        method: "POST",
        body: JSON.stringify({ bookingId }),
      });

      // Handle any HTTP errors
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Payment initialization failed");
      }

      // Get the PayFast redirect URL
      const data = await response.json();
      const { redirectUrl } = data;

      if (!redirectUrl) {
        throw new Error("No redirect URL received from payment processor");
      }

      console.log("Redirecting to payment gateway...");

      // Redirect to PayFast
      window.location.href = redirectUrl;
    } catch (error) {
      console.error("Payment error:", error);
      isLoading = false;
      error =
        error instanceof Error
          ? error.message
          : "Failed to Initialise payment. Please try again later.";
    }
  });
</script>

<svelte:head>
  <title>Processing Payment | BrightBroom</title>
</svelte:head>

<div
  class="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900"
>
  <div
    class="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-8"
  >
    {#if isLoading}
      <div class="text-center">
        <div class="mb-6">
          <div
            class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"
          ></div>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Processing Payment
        </h1>
        <p class="text-gray-600 dark:text-gray-300 mb-4">
          Please wait while we connect to our payment gateway...
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          You will be redirected automatically in a few moments.
        </p>
      </div>
    {:else if error}
      <div class="text-center">
        <div class="text-red-500 mb-4 dark:text-red-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-12 w-12 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Payment Error
        </h1>
        <p class="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
        <div class="flex flex-col space-y-3">
          <button
            on:click={() => window.location.reload()}
            class="w-full px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Try Again
          </button>
          <button
            on:click={() => goto("/profile/bookings")}
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            View My Bookings
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
