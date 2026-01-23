<!-- src/routes/admin/payouts/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import Button from "$lib/components/ui/Button.svelte";
  import { MetricCardSkeleton, TableSkeleton } from "$lib/components/ui/skeletons";
  import {
    Banknote,
    Check,
    ChevronLeft,
    CreditCard,
    Download,
    Phone,
    Smartphone,
  } from "lucide-svelte";

  export let data;
  export let form;

  let isLoading = false;
  let selectedEftCleaners: Set<string> = new Set();
  let selectedInstantMoneyCleaners: Set<string> = new Set();
  let payoutReference = "";

  // Toggle selection
  function toggleEftSelection(id: string) {
    if (selectedEftCleaners.has(id)) {
      selectedEftCleaners.delete(id);
    } else {
      selectedEftCleaners.add(id);
    }
    selectedEftCleaners = new Set(selectedEftCleaners);
  }

  function toggleInstantMoneySelection(id: string) {
    if (selectedInstantMoneyCleaners.has(id)) {
      selectedInstantMoneyCleaners.delete(id);
    } else {
      selectedInstantMoneyCleaners.add(id);
    }
    selectedInstantMoneyCleaners = new Set(selectedInstantMoneyCleaners);
  }

  // Format currency
  function formatCurrency(amount: number | string): string {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return `R${num.toFixed(2)}`;
  }

  // Format date
  function formatDate(date: Date | string | null): string {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Download helper
  function downloadCsv(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
</script>

<svelte:head>
  <title>Batch Payouts | BrightBroom Admin</title>
</svelte:head>

<!-- Page header -->
<div class="mb-6 flex items-center justify-between">
  <div class="flex items-center">
    <a
      href="/admin"
      class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mr-3"
    >
      <ChevronLeft size={20} />
    </a>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
      Weekly Payouts
    </h1>
  </div>
</div>

<!-- Success/Error messages -->
{#if form?.success}
  <div
    class="mb-6 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 p-4 rounded-md"
  >
    {form.message}
  </div>
{:else if form?.error}
  <div
    class="mb-6 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 p-4 rounded-md"
  >
    {form.error}
  </div>
{/if}

{#await data.streamed.payoutData}
  <!-- Summary Cards Skeleton -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
    <MetricCardSkeleton count={3} />
  </div>

  <!-- Main Grid Skeleton -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    <TableSkeleton rows={5} columns={3} />
    <TableSkeleton rows={5} columns={3} />
  </div>

  <!-- Recent Payouts Skeleton -->
  <TableSkeleton rows={5} columns={4} />
{:then payoutData}
  {@const cleaners = payoutData.cleaners}
  {@const recentPayouts = payoutData.recentPayouts}
  {@const totals = payoutData.totals}
  {@const eftCleaners = cleaners.filter(c => c.payoutMethod === "EFT" && Number(c.pendingPayout) > 0)}
  {@const instantMoneyCleaners = cleaners.filter(c => c.payoutMethod !== "EFT" && Number(c.pendingPayout) > 0)}
  {@const selectedEftTotal = eftCleaners.filter(c => selectedEftCleaners.has(c.id)).reduce((sum, c) => sum + Number(c.pendingPayout), 0)}
  {@const selectedInstantMoneyTotal = instantMoneyCleaners.filter(c => selectedInstantMoneyCleaners.has(c.id)).reduce((sum, c) => sum + Number(c.pendingPayout), 0)}

  <!-- Summary Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div class="flex items-center">
        <div class="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
          <Banknote class="h-6 w-6 text-primary" />
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Pending
          </p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totals.eftTotal + totals.instantMoneyTotal)}
          </p>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div class="flex items-center">
        <div class="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
          <CreditCard class="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
            EFT Payouts
          </p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totals.eftTotal)}
          </p>
          <p class="text-sm text-gray-500">{totals.eftCount} cleaners</p>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div class="flex items-center">
        <div class="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
          <Smartphone class="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Instant Money
          </p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totals.instantMoneyTotal)}
          </p>
          <p class="text-sm text-gray-500">{totals.instantMoneyCount} cleaners</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Grid -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    <!-- EFT Payouts Section -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <CreditCard class="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Bank Transfer (EFT)
            </h2>
          </div>
          <Button
            variant="primary"
            size="sm"
            disabled={selectedEftCleaners.size === 0}
          >
            <Download size={16} class="mr-1" />
            Export CSV
          </Button>
        </div>
        {#if selectedEftCleaners.size > 0}
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Selected: {selectedEftCleaners.size} cleaners ({formatCurrency(selectedEftTotal)})
          </p>
        {/if}
      </div>

      <div class="p-4">
        {#if eftCleaners.length > 0}
          <div class="mb-3">
            <label class="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedEftCleaners.size === eftCleaners.length}
                on:change={() => {
                  if (selectedEftCleaners.size === eftCleaners.length) {
                    selectedEftCleaners = new Set();
                  } else {
                    selectedEftCleaners = new Set(eftCleaners.map(c => c.id));
                  }
                }}
                class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">
                Select All ({eftCleaners.length})
              </span>
            </label>
          </div>

          <div class="space-y-2 max-h-80 overflow-y-auto">
            {#each eftCleaners as cleaner}
              <div
                class="flex items-center justify-between p-3 rounded-lg border {selectedEftCleaners.has(cleaner.id)
                  ? 'border-primary bg-primary-50 dark:bg-primary-900/10'
                  : 'border-gray-200 dark:border-gray-700'}"
              >
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedEftCleaners.has(cleaner.id)}
                    on:change={() => toggleEftSelection(cleaner.id)}
                    class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-3"
                  />
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {cleaner.firstName} {cleaner.lastName}
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {cleaner.bankName || "No bank"} - ****{cleaner.bankAccountNumber?.slice(-4) || "****"}
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(cleaner.pendingPayout)}
                  </p>
                  <p class="text-xs text-gray-500">
                    {cleaner.pendingBookingsCount} bookings
                  </p>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-center py-8 text-gray-500 dark:text-gray-400">
            No EFT payouts pending
          </p>
        {/if}
      </div>
    </div>

    <!-- Instant Money Section -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <Smartphone class="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Instant Money
            </h2>
          </div>
          <Button
            variant="primary"
            size="sm"
            disabled={selectedInstantMoneyCleaners.size === 0}
          >
            <Download size={16} class="mr-1" />
            Export CSV
          </Button>
        </div>
        {#if selectedInstantMoneyCleaners.size > 0}
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Selected: {selectedInstantMoneyCleaners.size} cleaners ({formatCurrency(selectedInstantMoneyTotal)})
          </p>
        {/if}
      </div>

      <div class="p-4">
        {#if instantMoneyCleaners.length > 0}
          <div class="mb-3">
            <label class="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedInstantMoneyCleaners.size === instantMoneyCleaners.length}
                on:change={() => {
                  if (selectedInstantMoneyCleaners.size === instantMoneyCleaners.length) {
                    selectedInstantMoneyCleaners = new Set();
                  } else {
                    selectedInstantMoneyCleaners = new Set(instantMoneyCleaners.map(c => c.id));
                  }
                }}
                class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">
                Select All ({instantMoneyCleaners.length})
              </span>
            </label>
          </div>

          <div class="space-y-2 max-h-80 overflow-y-auto">
            {#each instantMoneyCleaners as cleaner}
              <div
                class="flex items-center justify-between p-3 rounded-lg border {selectedInstantMoneyCleaners.has(cleaner.id)
                  ? 'border-primary bg-primary-50 dark:bg-primary-900/10'
                  : 'border-gray-200 dark:border-gray-700'}"
              >
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedInstantMoneyCleaners.has(cleaner.id)}
                    on:change={() => toggleInstantMoneySelection(cleaner.id)}
                    class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-3"
                  />
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {cleaner.firstName} {cleaner.lastName}
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      <Phone class="h-3 w-3 inline mr-1" />
                      {cleaner.phone || "No phone"}
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(cleaner.pendingPayout)}
                  </p>
                  <p class="text-xs text-gray-500">
                    {cleaner.pendingBookingsCount} bookings
                  </p>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-center py-8 text-gray-500 dark:text-gray-400">
            No Instant Money payouts pending
          </p>
        {/if}
      </div>
    </div>
  </div>

  <!-- Mark as Paid Section -->
  {#if selectedEftCleaners.size > 0 || selectedInstantMoneyCleaners.size > 0}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Mark Payouts as Paid
      </h3>

      <form
        method="POST"
        action="?/markAsPaid"
        use:enhance={() => {
          isLoading = true;

          return async ({ result, update }) => {
            isLoading = false;

            if (result.type === "success") {
              selectedEftCleaners = new Set();
              selectedInstantMoneyCleaners = new Set();
              payoutReference = "";
            }

            await update();

            if (result.type === "success") {
              await invalidateAll();
            }
          };
        }}
      >
        <div class="space-y-4">
          <div>
            <label
              for="payoutReference"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Payout Reference (optional)
            </label>
            <input
              type="text"
              id="payoutReference"
              name="payoutReference"
              bind:value={payoutReference}
              placeholder="e.g., BATCH-2024-01-18 or bank reference number"
              class="w-full max-w-md rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <input
            type="hidden"
            name="cleanerIds"
            value={JSON.stringify([...selectedEftCleaners, ...selectedInstantMoneyCleaners])}
          />

          <div class="flex items-center gap-4">
            <Button type="submit" variant="primary" disabled={isLoading}>
              {#if isLoading}
                <svg
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                <Check size={16} class="mr-2" />
                Mark {selectedEftCleaners.size + selectedInstantMoneyCleaners.size} Payout(s) as Paid
              {/if}
            </Button>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Total: {formatCurrency(selectedEftTotal + selectedInstantMoneyTotal)}
            </p>
          </div>
        </div>
      </form>
    </div>
  {/if}

  <!-- Recent Paid Payments -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
        Recently Paid Payments
      </h2>
    </div>

    <div class="overflow-x-auto">
      {#if recentPayouts.length > 0}
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Date Paid
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Cleaner
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Booking Amount
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Cleaner Payout
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {#each recentPayouts as payout}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(payout.paidDate)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {payout.cleanerFirstName} {payout.cleanerLastName}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                  {formatCurrency(payout.amount)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                  {formatCurrency(payout.cleanerPayoutAmount)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <p class="text-center py-8 text-gray-500 dark:text-gray-400">
          No paid payments yet
        </p>
      {/if}
    </div>
  </div>
{:catch error}
  <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 text-center">
    <p class="text-red-600 dark:text-red-400">Failed to load payout data. Please refresh the page.</p>
  </div>
{/await}
