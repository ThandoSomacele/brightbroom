<!-- src/routes/profile/subscriptions/+page.svelte -->
<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import { Calendar, MapPin, Clock, CreditCard, Repeat, DollarSign } from 'lucide-svelte';
  import { enhance } from '$app/forms';

  // Get data from the server load function
  export let data;
  export let form;
  const { subscriptions } = data;

  // Filter subscriptions by status
  let filterStatus = 'all';

  // State for confirmation dialogs
  let confirmingAction: { action: string; subscriptionId: string } | null = null;
  let cancellationReason = '';

  $: filteredSubscriptions = subscriptions.filter(subscription => {
    return filterStatus === 'all' || subscription.status === filterStatus;
  });

  // Format date function
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Format frequency for display
  function formatFrequency(frequency: string): string {
    switch(frequency) {
      case 'WEEKLY':
        return 'Weekly';
      case 'BIWEEKLY':
        return 'Bi-weekly';
      case 'TWICE_WEEKLY':
        return 'Twice per week';
      case 'TWICE_MONTHLY':
        return 'Twice per month';
      default:
        return frequency;
    }
  }

  // Format days for display
  function formatDays(days: string[] | null): string {
    if (!days || days.length === 0) return '';
    return days.join(', ');
  }

  // Get status badge class
  function getStatusBadgeClass(status: string): string {
    switch(status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'PAUSED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  }

  // Get address display
  function getAddressDisplay(address: any): string {
    if (!address) return 'No address';
    return `${address.street || ''}, ${address.city || ''}`;
  }

  // Show confirmation dialog
  function showConfirmation(action: string, subscriptionId: string) {
    confirmingAction = { action, subscriptionId };
  }

  // Cancel confirmation
  function cancelConfirmation() {
    confirmingAction = null;
    cancellationReason = '';
  }
</script>

<svelte:head>
  <title>My Subscriptions | BrightBroom</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
  <div class="mx-auto max-w-6xl">
    <!-- Page header with back button -->
    <div class="mb-6 flex items-center">
      <Button variant="ghost" href="/profile" class="mr-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </Button>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">My Subscriptions</h1>
    </div>

    <!-- Info banner for pending subscriptions -->
    {#if subscriptions.some(s => s.status === 'PENDING')}
      <div class="mb-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <p class="text-sm text-blue-700 dark:text-blue-200">
              Your subscription payment is being processed. This may take a few moments. The subscription will become active once the payment is confirmed.
            </p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Form response messages -->
    {#if form?.success}
      <div class="mb-6 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
        <p class="text-sm text-green-700 dark:text-green-200">Action completed successfully!</p>
      </div>
    {:else if form?.error}
      <div class="mb-6 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
        <p class="text-sm text-red-700 dark:text-red-200">{form.error}</p>
      </div>
    {/if}

    <!-- Filters and actions -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-wrap gap-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2 py-2">Status:</span>
        <button
          class={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${filterStatus === 'all' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'}`}
          on:click={() => filterStatus = 'all'}
        >
          All
        </button>
        <button
          class={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${filterStatus === 'ACTIVE' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'}`}
          on:click={() => filterStatus = 'ACTIVE'}
        >
          Active
        </button>
        <button
          class={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${filterStatus === 'PAUSED' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'}`}
          on:click={() => filterStatus = 'PAUSED'}
        >
          Paused
        </button>
        <button
          class={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${filterStatus === 'CANCELLED' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'}`}
          on:click={() => filterStatus = 'CANCELLED'}
        >
          Cancelled
        </button>
      </div>

      <Button variant="primary" href="/book">
        <Calendar size={18} class="mr-2" />
        New Subscription
      </Button>
    </div>

    <!-- Subscriptions list -->
    <div class="space-y-6">
      {#if filteredSubscriptions.length > 0}
        {#each filteredSubscriptions as subscription}
          <div class="rounded-lg bg-white p-6 shadow-md transition-all hover:shadow-lg dark:bg-gray-800">
            <div class="flex flex-wrap justify-between gap-4">
              <!-- Left column: Subscription details -->
              <div class="flex-1">
                <div class="mb-4 flex items-center">
                  <span class={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeClass(subscription.status)}`}>
                    {subscription.status}
                  </span>
                </div>

                <h2 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                  {subscription.service.name}
                </h2>

                <div class="space-y-2">
                  <p class="flex items-center text-gray-600 dark:text-gray-300">
                    <Repeat size={18} class="mr-2 text-primary" />
                    {formatFrequency(subscription.frequency)}
                    {#if subscription.preferredDays && subscription.preferredDays.length > 0}
                      <span class="ml-2 text-sm">({formatDays(subscription.preferredDays)})</span>
                    {/if}
                  </p>

                  {#if subscription.preferredTimeSlot}
                    <p class="flex items-center text-gray-600 dark:text-gray-300">
                      <Clock size={18} class="mr-2 text-primary" />
                      {subscription.preferredTimeSlot}
                    </p>
                  {/if}

                  <p class="flex items-center text-gray-600 dark:text-gray-300">
                    <MapPin size={18} class="mr-2 text-primary" />
                    {getAddressDisplay(subscription.address)}
                  </p>

                  {#if subscription.nextBillingDate}
                    <p class="flex items-center text-gray-600 dark:text-gray-300">
                      <Calendar size={18} class="mr-2 text-primary" />
                      Next billing: {formatDate(subscription.nextBillingDate)}
                    </p>
                  {/if}

                  <p class="flex items-center text-gray-600 dark:text-gray-300">
                    <DollarSign size={18} class="mr-2 text-primary" />
                    Created: {formatDate(subscription.createdAt)}
                  </p>

                  <!-- Payment history summary -->
                  {#if subscription.payments && subscription.payments.length > 0}
                    <div class="mt-4 border-t border-gray-200 pt-3 dark:border-gray-700">
                      <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Payments:</p>
                      <div class="space-y-1">
                        {#each subscription.payments.slice(0, 3) as payment}
                          <div class="flex items-center justify-between text-sm">
                            <span class="text-gray-600 dark:text-gray-400">
                              {formatDate(payment.processedAt || payment.billingPeriodStart)}
                            </span>
                            <span class={`font-medium ${payment.status === 'COMPLETED' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              R{typeof payment.amount === 'number' ? payment.amount.toFixed(2) : parseFloat(payment.amount).toFixed(2)}
                            </span>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
              </div>

              <!-- Right column: Price and actions -->
              <div class="flex flex-col items-end justify-between">
                <div class="text-right">
                  <div class="mb-1 text-sm text-gray-500 dark:text-gray-400">
                    Per cleaning
                  </div>
                  <div class="mb-2 text-2xl font-bold text-primary">
                    R{typeof subscription.finalPrice === 'number'
                        ? subscription.finalPrice.toFixed(2)
                        : parseFloat(subscription.finalPrice).toFixed(2)}
                  </div>
                </div>

                <div class="mt-4 flex flex-wrap gap-2 justify-end">
                  {#if subscription.status === 'ACTIVE' && subscription.payFastToken}
                    <Button
                      variant="outline"
                      on:click={() => showConfirmation('pause', subscription.id)}
                    >
                      Pause
                    </Button>
                  {/if}

                  {#if subscription.status === 'PAUSED' && subscription.payFastToken}
                    <Button
                      variant="outline"
                      on:click={() => showConfirmation('resume', subscription.id)}
                    >
                      Resume
                    </Button>
                  {/if}

                  {#if (subscription.status === 'ACTIVE' || subscription.status === 'PAUSED') && subscription.payFastToken}
                    <Button
                      variant="ghost"
                      class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      on:click={() => showConfirmation('cancel', subscription.id)}
                    >
                      Cancel
                    </Button>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        {/each}
      {:else}
        <div class="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-white">No subscriptions found</h3>

          {#if filterStatus !== 'all'}
            <p class="mb-4 text-gray-600 dark:text-gray-400">
              No subscriptions found for the selected filter. Try adjusting your filter or create a new subscription.
            </p>
            <div class="flex flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                on:click={() => filterStatus = 'all'}
              >
                Clear filter
              </Button>
              <Button
                variant="secondary"
                href="/book"
              >
                New Subscription
              </Button>
            </div>
          {:else}
            <p class="mb-4 text-gray-600 dark:text-gray-400">
              You don't have any active subscriptions. Subscribe now for recurring cleaning services!
            </p>
            <Button
              variant="secondary"
              href="/book"
            >
              Subscribe Now
            </Button>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Confirmation Dialog -->
{#if confirmingAction}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
    <div class="max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
      <h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
        Confirm {confirmingAction.action.charAt(0).toUpperCase() + confirmingAction.action.slice(1)}
      </h3>

      <p class="mb-6 text-gray-600 dark:text-gray-300">
        {#if confirmingAction.action === 'pause'}
          Are you sure you want to pause this subscription? You can resume it anytime.
        {:else if confirmingAction.action === 'resume'}
          Are you sure you want to resume this subscription? Billing will continue as scheduled.
        {:else if confirmingAction.action === 'cancel'}
          Are you sure you want to cancel this subscription? This action cannot be undone.
        {/if}
      </p>

      {#if confirmingAction.action === 'cancel'}
        <div class="mb-4">
          <label for="reason" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reason for cancellation (optional):
          </label>
          <textarea
            id="reason"
            bind:value={cancellationReason}
            class="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            rows="3"
            placeholder="Tell us why you're cancelling..."
          ></textarea>
        </div>
      {/if}

      <div class="flex gap-3 justify-end">
        <Button variant="outline" on:click={cancelConfirmation}>
          Cancel
        </Button>

        <form method="POST" action={`?/${confirmingAction.action}`} use:enhance>
          <input type="hidden" name="subscriptionId" value={confirmingAction.subscriptionId} />
          <input type="hidden" name="token" value={subscriptions.find(s => s.id === confirmingAction.subscriptionId)?.payFastToken || ''} />
          {#if confirmingAction.action === 'cancel' && cancellationReason}
            <input type="hidden" name="reason" value={cancellationReason} />
          {/if}

          <Button
            type="submit"
            variant={confirmingAction.action === 'cancel' ? 'ghost' : 'primary'}
            class={confirmingAction.action === 'cancel' ? 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300' : ''}
          >
            Confirm {confirmingAction.action.charAt(0).toUpperCase() + confirmingAction.action.slice(1)}
          </Button>
        </form>
      </div>
    </div>
  </div>
{/if}
