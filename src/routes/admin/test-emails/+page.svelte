<!-- src/routes/admin/test-emails/+page.svelte -->
<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte";

  let emailAddress = "";
  let selectedType = "welcome";
  let isLoading = false;
  let result: { success?: boolean; message?: string; error?: string } | null =
    null;

  async function sendTestEmail() {
    if (!emailAddress) return;

    isLoading = true;
    result = null;

    try {
      const response = await fetch(
        `/api/test/email?to=${encodeURIComponent(emailAddress)}&type=${selectedType}`,
      );
      const data = await response.json();

      result = {
        success: response.ok,
        message: data.message || "Email sent successfully",
        error: data.error,
      };
    } catch (error) {
      result = {
        success: false,
        error: "Failed to send test email",
      };
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Test Emails | BrightBroom Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-4xl">
  <h1 class="text-3xl font-bold mb-6">Test Email Integration</h1>
  <p class="text-gray-600 dark:text-gray-300 mb-8">
    This tool allows you to test the email integration by sending test emails.
    <span class="text-red-500 font-medium"
      >This feature is only available in development mode.</span
    >
  </p>

  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
    <h2 class="text-xl font-semibold mb-4">Send Test Email</h2>

    {#if result}
      <div
        class="mb-6 p-4 rounded-md {result.success
          ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
          : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-200'}"
      >
        {#if result.success}
          <p>{result.message}</p>
        {:else}
          <p>Error: {result.error}</p>
        {/if}
      </div>
    {/if}

    <div class="space-y-4">
      <div>
        <label
          for="email"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Recipient Email Address
        </label>
        <input
          type="email"
          id="email"
          bind:value={emailAddress}
          placeholder="Enter email address"
          class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div>
        <label
          for="type"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Email Type
        </label>
        <select
          id="type"
          bind:value={selectedType}
          class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="welcome">Welcome Email</option>
          <option value="password-reset">Password Reset</option>
          <option value="booking-confirmation">Booking Confirmation</option>
          <option value="reminder">Booking Reminder</option>
        </select>
      </div>

      <Button
        variant="primary"
        on:click={sendTestEmail}
        disabled={!emailAddress || isLoading}
        loading={isLoading}
        class="w-full mt-4"
      >
        Send Test Email
      </Button>
    </div>
  </div>
</div>
