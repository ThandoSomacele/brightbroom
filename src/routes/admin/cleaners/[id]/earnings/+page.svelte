<!-- src/routes/admin/cleaners/[id]/earnings/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import Button from "$lib/components/ui/Button.svelte";
  import {
    ArrowLeft,
    Calendar,
    ChevronDown,
    ChevronUp,
    Download,
    FileText,
    TrendingUp,
    Wallet,
  } from "lucide-svelte";

  // Get data from server
  export let data;
  const { cleaner, earnings, paymentHistory, pendingPayouts } = data;
  export let form;

  // Local state
  let isProcessingPayout = false;
  let selectedPayments = new Set<string>();
  let isConfirmingPayouts = false;
  let showAllPayments = false;

  // Display at most 10 payments by default
  $: displayedPayments = showAllPayments
    ? paymentHistory
    : paymentHistory.slice(0, 10);

  // Calculate selected payout amount
  $: selectedPayoutAmount = pendingPayouts
    .filter((payment) => selectedPayments.has(payment.id))
    .reduce((total, payment) => total + Number(payment.amount), 0);

  // Format currency
  function formatCurrency(amount: number | string): string {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    return `R${value.toFixed(2)}`;
  }

  // Format date
  function formatDate(dateString: string | Date | null): string {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Toggle all payments selection
  function toggleAllPayments() {
    if (selectedPayments.size === pendingPayouts.length) {
      // Deselect all
      selectedPayments = new Set();
    } else {
      // Select all
      selectedPayments = new Set(pendingPayouts.map((p) => p.id));
    }
  }

  // Toggle single payment selection
  function togglePayment(id: string) {
    if (selectedPayments.has(id)) {
      selectedPayments.delete(id);
    } else {
      selectedPayments.add(id);
    }
    // Force reactivity
    selectedPayments = new Set(selectedPayments);
  }

  // Start payout process
  function startPayout() {
    if (selectedPayments.size === 0) return;
    isConfirmingPayouts = true;
  }

  // Cancel payout process
  function cancelPayout() {
    isConfirmingPayouts = false;
  }
</script>

<svelte:head>
  <title
    >Cleaner Earnings | {cleaner.firstName}
    {cleaner.lastName} | BrightBroom Admin</title
  >
</svelte:head>

<!-- Page header with back button -->
<div class="mb-6 flex items-center">
  <a
    href={`/admin/cleaners/${cleaner.id}`}
    class="mr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
  >
    <ArrowLeft size={20} />
  </a>
  <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
    Earnings for {cleaner.firstName}
    {cleaner.lastName}
  </h1>
</div>

<!-- Success/Error messages -->
{#if form?.success}
  <div
    class="mb-6 rounded-md bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-300"
  >
    <p>{form.message}</p>
  </div>
{:else if form?.error}
  <div
    class="mb-6 rounded-md bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-200"
  >
    <p>{form.error}</p>
  </div>
{/if}

<!-- Main content grid -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <!-- Left column: Stats -->
  <div class="space-y-6">
    <!-- Earnings summary card -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div class="p-6">
        <h2
          class="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4"
        >
          <Wallet class="mr-2 text-primary" size={20} />
          Earnings Summary
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <!-- Total Earnings -->
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Total Earnings
            </p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(earnings.totalEarnings)}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {earnings.completedBookings} completed bookings
            </p>
          </div>

          <!-- Total Payout -->
          <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
            <p class="text-sm text-gray-500 dark:text-gray-400">Total Payout</p>
            <p class="text-2xl font-bold text-primary">
              {formatCurrency(earnings.totalPayout)}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              After {earnings.totalCommission > 0
                ? (
                    (earnings.totalCommission / earnings.totalEarnings) *
                    100
                  ).toFixed(1)
                : "25.0"}% commission
            </p>
          </div>
        </div>

        <!-- Recent period data -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3
            class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center"
          >
            <Calendar size={16} class="mr-2" />
            Period Summary
          </h3>

          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600 dark:text-gray-400"
                >Current Month</span
              >
              <span class="font-medium text-gray-900 dark:text-white">
                {formatCurrency(earnings.currentMonthEarnings)}
              </span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600 dark:text-gray-400"
                >Last Month</span
              >
              <span class="font-medium text-gray-900 dark:text-white">
                {formatCurrency(earnings.lastMonthEarnings)}
              </span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600 dark:text-gray-400"
                >Year To Date</span
              >
              <span class="font-medium text-gray-900 dark:text-white">
                {formatCurrency(earnings.yearToDateEarnings)}
              </span>
            </div>
          </div>
        </div>

        <!-- Commission details -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <h3
            class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center"
          >
            <TrendingUp size={16} class="mr-2" />
            Platform Commission
          </h3>

          <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-gray-600 dark:text-gray-400">Rate</span>
              <span class="font-medium text-gray-900 dark:text-white">25%</span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600 dark:text-gray-400"
                >Total Commission</span
              >
              <span class="font-medium text-gray-900 dark:text-white">
                {formatCurrency(earnings.totalCommission)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Right columns: Pending payouts and history -->
  <div class="lg:col-span-2 space-y-6">
    <!-- Pending payouts -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Pending Payouts
          </h2>

          {#if pendingPayouts.length > 0}
            <Button
              variant="primary"
              size="sm"
              disabled={selectedPayments.size === 0}
              on:click={startPayout}
            >
              Process Selected ({formatCurrency(selectedPayoutAmount)})
            </Button>
          {/if}
        </div>

        {#if pendingPayouts.length === 0}
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-md text-center">
            <p class="text-gray-600 dark:text-gray-400">No pending payouts</p>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table
              class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
            >
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" class="w-10 px-3 py-3 text-left">
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={selectedPayments.size ===
                          pendingPayouts.length && pendingPayouts.length > 0}
                        on:change={toggleAllPayments}
                      />
                    </div>
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                  >
                    Booking
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                  >
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody
                class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800"
              >
                {#each pendingPayouts as payment}
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td class="w-10 px-3 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <input
                          type="checkbox"
                          class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={selectedPayments.has(payment.id)}
                          on:change={() => togglePayment(payment.id)}
                        />
                      </div>
                    </td>
                    <td
                      class="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                    >
                      {formatDate(payment.createdAt)}
                    </td>
                    <td
                      class="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                    >
                      <a
                        href={`/admin/bookings/${payment.bookingId}`}
                        class="text-primary hover:underline"
                      >
                        {payment.bookingId.slice(0, 8)}...
                      </a>
                    </td>
                    <td
                      class="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right"
                    >
                      {formatCurrency(payment.amount)}
                    </td>
                  </tr>
                {/each}
              </tbody>
              <tfoot class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <td
                    colspan="3"
                    class="px-3 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Total Selected:
                  </td>
                  <td
                    class="px-3 py-2 text-right text-sm font-bold text-gray-900 dark:text-white"
                  >
                    {formatCurrency(selectedPayoutAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        {/if}
      </div>
    </div>

    <!-- Payment history -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h2
            class="text-lg font-semibold text-gray-900 dark:text-white flex items-center"
          >
            <FileText class="mr-2 text-primary" size={20} />
            Payment History
          </h2>

          <Button variant="outline" size="sm">
            <Download size={16} class="mr-1" />
            Export
          </Button>
        </div>

        {#if paymentHistory.length === 0}
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-md text-center">
            <p class="text-gray-600 dark:text-gray-400">
              No payment history available
            </p>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table
              class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
            >
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                  >
                    Booking
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                  >
                    Amount
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                  >
                    Commission
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                  >
                    Payout
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody
                class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800"
              >
                {#each displayedPayments as payment}
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td
                      class="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                    >
                      {formatDate(payment.createdAt)}
                    </td>
                    <td
                      class="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                    >
                      <a
                        href={`/admin/bookings/${payment.bookingId}`}
                        class="text-primary hover:underline"
                      >
                        {payment.bookingId.slice(0, 8)}...
                      </a>
                    </td>
                    <td
                      class="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right"
                    >
                      {formatCurrency(payment.amount)}
                    </td>
                    <td
                      class="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right"
                    >
                      {formatCurrency(payment.commission)}
                    </td>
                    <td
                      class="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white text-right"
                    >
                      {formatCurrency(payment.payout)}
                    </td>
                    <td class="px-3 py-4 whitespace-nowrap text-center">
                      {#if payment.isPaid}
                        <span
                          class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-300"
                        >
                          Paid {formatDate(payment.payoutDate)}
                        </span>
                      {:else}
                        <span
                          class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                        >
                          Pending
                        </span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          {#if paymentHistory.length > 10}
            <div class="mt-4 text-center">
              <button
                type="button"
                class="inline-flex items-center text-sm text-primary hover:text-primary-600 hover:underline"
                on:click={() => (showAllPayments = !showAllPayments)}
              >
                {#if showAllPayments}
                  <ChevronUp size={16} class="mr-1" />
                  Show Less
                {:else}
                  <ChevronDown size={16} class="mr-1" />
                  Show All ({paymentHistory.length} entries)
                {/if}
              </button>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Payout confirmation modal -->
{#if isConfirmingPayouts}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
  >
    <div
      class="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6"
    >
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Confirm Payout
      </h3>

      <p class="text-gray-700 dark:text-gray-300 mb-4">
        Are you sure you want to process a payout of <span
          class="font-bold text-primary"
          >{formatCurrency(selectedPayoutAmount)}</span
        >
        for {selectedPayments.size} payment{selectedPayments.size !== 1
          ? "s"
          : ""}?
      </p>

      <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md mb-4">
        <p class="text-yellow-800 dark:text-yellow-300 text-sm">
          This action will mark these payments as paid to the cleaner and cannot
          be undone. Ensure you have processed the actual bank transfer before
          confirming.
        </p>
      </div>

      <form
        method="POST"
        action="?/processPayout"
        use:enhance={() => {
          isProcessingPayout = true;

          return async ({ result, update }) => {
            isProcessingPayout = false;
            isConfirmingPayouts = false;

            // Update form status
            await update();

            // If successful, clear selections and refresh data
            if (result.type === "success") {
              selectedPayments = new Set();
              await invalidateAll();
            }
          };
        }}
      >
        <input
          type="hidden"
          name="paymentIds"
          value={JSON.stringify(Array.from(selectedPayments))}
        />

        <div class="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            on:click={cancelPayout}
            disabled={isProcessingPayout}
          >
            Cancel
          </Button>

          <Button type="submit" variant="primary" disabled={isProcessingPayout}>
            {#if isProcessingPayout}
              <svg
                class="animate-spin -ml-1 mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            {:else}
              Confirm Payout
            {/if}
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}
