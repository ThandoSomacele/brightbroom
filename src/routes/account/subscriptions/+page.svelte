<!-- src/routes/account/subscriptions/+page.svelte -->
<script lang="ts">
  import { Calendar, Clock, DollarSign, Pause, Play, X, ChevronRight, RotateCw, WalletIcon } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
  const { subscriptions } = data;

  let isLoading = false;
  let actionSubscriptionId = '';

  async function pauseSubscription(subscriptionId: string) {
    if (!confirm('Are you sure you want to pause this subscription? You can resume it anytime.')) {
      return;
    }

    isLoading = true;
    actionSubscriptionId = subscriptionId;

    try {
      const response = await fetch(`/api/subscription/${subscriptionId}/pause`, {
        method: 'POST',
      });

      if (response.ok) {
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        alert('Failed to pause subscription. Please try again.');
      }
    } catch (error) {
      console.error('Error pausing subscription:', error);
      alert('An error occurred. Please try again.');
    } finally {
      isLoading = false;
      actionSubscriptionId = '';
    }
  }

  async function resumeSubscription(subscriptionId: string) {
    isLoading = true;
    actionSubscriptionId = subscriptionId;

    try {
      const response = await fetch(`/api/subscription/${subscriptionId}/resume`, {
        method: 'POST',
      });

      if (response.ok) {
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        alert('Failed to resume subscription. Please try again.');
      }
    } catch (error) {
      console.error('Error resuming subscription:', error);
      alert('An error occurred. Please try again.');
    } finally {
      isLoading = false;
      actionSubscriptionId = '';
    }
  }

  async function cancelSubscription(subscriptionId: string) {
    if (!confirm('Are you sure you want to cancel this subscription? This action cannot be undone.')) {
      return;
    }

    const reason = prompt('Please let us know why you are cancelling (optional):');

    isLoading = true;
    actionSubscriptionId = subscriptionId;

    try {
      const response = await fetch(`/api/subscription/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        alert('Failed to cancel subscription. Please try again.');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('An error occurred. Please try again.');
    } finally {
      isLoading = false;
      actionSubscriptionId = '';
    }
  }

  function formatFrequency(frequency: string): string {
    const frequencies: Record<string, string> = {
      WEEKLY: 'Weekly',
      BIWEEKLY: 'Bi-weekly',
      TWICE_WEEKLY: 'Twice weekly',
    };
    return frequencies[frequency] || frequency;
  }

  function formatDate(date: string | Date | null): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 bg-green-100';
      case 'PAUSED':
        return 'text-yellow-600 bg-yellow-100';
      case 'CANCELLED':
        return 'text-red-600 bg-red-100';
      case 'EXPIRED':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  }
</script>

<svelte:head>
  <title>My Subscriptions | BrightBroom</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-2">
        <RotateCw class="h-8 w-8 text-teal-600" />
        My Recurring Subscriptions
      </h1>
      <p class="mt-2 text-gray-600">
        Manage your recurring cleaning subscriptions
      </p>
    </div>

    <!-- New Subscription Button -->
    <div class="mb-6">
      <Button href="/book" variant="primary">
        Start New Recurring Subscription
      </Button>
    </div>

    <!-- Subscriptions List -->
    {#if subscriptions && subscriptions.length > 0}
      <div class="space-y-4">
        {#each subscriptions as subscription}
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  {subscription.service.name}
                </h3>
                <span class={`inline-block px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(subscription.status)}`}>
                  {subscription.status}
                </span>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-2">
                {#if subscription.status === 'ACTIVE'}
                  <Button
                    variant="outline"
                    size="sm"
                    on:click={() => pauseSubscription(subscription.id)}
                    disabled={isLoading && actionSubscriptionId === subscription.id}
                  >
                    <Pause class="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                {:else if subscription.status === 'PAUSED'}
                  <Button
                    variant="outline"
                    size="sm"
                    on:click={() => resumeSubscription(subscription.id)}
                    disabled={isLoading && actionSubscriptionId === subscription.id}
                  >
                    <Play class="h-4 w-4 mr-1" />
                    Resume
                  </Button>
                {/if}

                {#if subscription.status !== 'CANCELLED' && subscription.status !== 'EXPIRED'}
                  <Button
                    variant="outline"
                    size="sm"
                    on:click={() => cancelSubscription(subscription.id)}
                    disabled={isLoading && actionSubscriptionId === subscription.id}
                  >
                    <X class="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                {/if}
              </div>
            </div>

            <!-- Subscription Details -->
            <div class="grid md:grid-cols-2 gap-4 text-sm">
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-gray-600">
                  <Calendar class="h-4 w-4" />
                  <span>
                    <strong>Frequency:</strong> {formatFrequency(subscription.frequency)}
                  </span>
                </div>

                {#if subscription.preferredDays && subscription.preferredDays.length > 0}
                  <div class="flex items-center gap-2 text-gray-600">
                    <Calendar class="h-4 w-4" />
                    <span>
                      <strong>Days:</strong> {subscription.preferredDays.join(', ')}
                    </span>
                  </div>
                {/if}

                {#if subscription.monthlyDates && subscription.monthlyDates.length > 0}
                  <div class="flex items-center gap-2 text-gray-600">
                    <Calendar class="h-4 w-4" />
                    <span>
                      <strong>Monthly dates:</strong> {subscription.monthlyDates.map(d => `${d}${d === 1 ? 'st' : d === 15 ? 'th' : 'th'}`).join(' and ')}
                    </span>
                  </div>
                {/if}

                {#if subscription.preferredTimeSlot}
                  <div class="flex items-center gap-2 text-gray-600">
                    <Clock class="h-4 w-4" />
                    <span>
                      <strong>Time slot:</strong> {subscription.preferredTimeSlot}
                    </span>
                  </div>
                {/if}
              </div>

              <div class="space-y-2">
                <div class="flex items-center gap-2 text-gray-600">
                  <WalletIcon class="h-4 w-4" />
                  <span>
                    <strong>Price per clean:</strong> R{parseFloat(subscription.finalPrice).toFixed(2)}
                    {#if subscription.discountPercentage && parseFloat(subscription.discountPercentage) > 0}
                      <span class="text-green-600">
                        ({parseFloat(subscription.discountPercentage).toFixed(0)}% discount)
                      </span>
                    {/if}
                  </span>
                </div>

                <div class="text-gray-600">
                  <strong>Start date:</strong> {formatDate(subscription.startDate)}
                </div>

                {#if subscription.nextBillingDate}
                  <div class="text-gray-600">
                    <strong>Next billing:</strong> {formatDate(subscription.nextBillingDate)}
                  </div>
                {/if}

                {#if subscription.cleaner}
                  <div class="text-gray-600">
                    <strong>Assigned cleaner:</strong> {subscription.cleaner.firstName} {subscription.cleaner.lastName}
                  </div>
                {/if}
              </div>
            </div>

            <!-- Address -->
            {#if subscription.address}
              <div class="mt-4 pt-4 border-t text-sm text-gray-600">
                <strong>Service address:</strong> {subscription.address.street}, {subscription.address.city}
              </div>
            {/if}

            <!-- View Bookings Link -->
            <div class="mt-4 pt-4 border-t">
              <a
                href="/account/bookings?subscription={subscription.id}"
                class="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-1"
              >
                View booking history
                <ChevronRight class="h-4 w-4" />
              </a>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="bg-white rounded-lg shadow-md p-12 text-center">
        <RotateCw class="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          No recurring subscriptions yet
        </h3>
        <p class="text-gray-600 mb-6">
          Set up a recurring cleaning subscription and save up to 15%!
        </p>
        <Button href="/book" variant="primary">
          Start Your First Subscription
        </Button>
      </div>
    {/if}
  </div>
</div>
