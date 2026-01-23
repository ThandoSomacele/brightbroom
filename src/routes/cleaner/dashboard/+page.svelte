<!-- src/routes/cleaner/dashboard/+page.svelte -->
<script lang="ts">
  import { Calendar, Clock, DollarSign, MapPin, User } from 'lucide-svelte';
  import { CustomerSkeleton } from '$lib/components/ui/skeletons';

  export let data;

  // Format currency
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  }

  // Format date
  function formatDate(dateString: string | Date): string {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Format time
  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<svelte:head>
  <title>Cleaner Dashboard | BrightBroom</title>
</svelte:head>

{#await data.streamed.dashboardData}
  <CustomerSkeleton variant="cleanerDashboard" />
{:then dashboardData}
  {@const upcomingBookings = dashboardData.upcomingBookings}
  {@const earnings = dashboardData.earnings}
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
      Cleaner Dashboard
    </h1>

    <!-- Earnings Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Total Earnings -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center dark:bg-primary-900/20">
            <DollarSign class="h-6 w-6 text-primary" />
          </div>
          <div class="ml-5">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Earnings
            </p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {formatCurrency(earnings.total)}
            </p>
          </div>
        </div>
      </div>

      <!-- Current Month -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center dark:bg-primary-900/20">
            <Calendar class="h-6 w-6 text-primary" />
          </div>
          <div class="ml-5">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              This Month
            </p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {formatCurrency(earnings.currentMonth)}
            </p>
          </div>
        </div>
      </div>

      <!-- Next Payout -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0 w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center dark:bg-secondary-900/20">
            <DollarSign class="h-6 w-6 text-secondary" />
          </div>
          <div class="ml-5">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Next Payout ({formatDate(earnings.nextPayout.date)})
            </p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {formatCurrency(earnings.nextPayout.amount)}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Upcoming Bookings -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">
          Upcoming Bookings
        </h2>
      </div>

      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        {#if upcomingBookings.length === 0}
          <div class="p-6 text-center text-gray-500 dark:text-gray-400">
            You have no upcoming bookings.
          </div>
        {:else}
          {#each upcomingBookings as booking}
            <div class="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div class="flex flex-col md:flex-row md:items-center md:justify-between">
                <div class="space-y-3">
                  <div class="flex items-start">
                    <Calendar class="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <div>
                      <p class="font-medium text-gray-900 dark:text-white">
                        {formatDate(booking.scheduledDate)}
                      </p>
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(booking.scheduledDate)}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-start">
                    <MapPin class="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <p class="text-gray-700 dark:text-gray-300">
                      {booking.address.street}, {booking.address.city}
                    </p>
                  </div>

                  <div class="flex items-start">
                    <User class="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <p class="text-gray-700 dark:text-gray-300">
                      {booking.customer.firstName} {booking.customer.lastName}
                    </p>
                  </div>
                </div>

                <div class="mt-4 md:mt-0 md:ml-4 flex flex-col items-end">
                  <span class="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(booking.price * 0.75)}
                  </span>
                  <span class="text-sm text-gray-500 dark:text-gray-400">
                    {booking.service.name}
                  </span>
                  <a
                    href={`/cleaner/bookings/${booking.id}`}
                    class="mt-2 text-primary hover:text-primary-600 font-medium text-sm"
                  >
                    View Details
                  </a>
                </div>
              </div>
            </div>
          {/each}
        {/if}
      </div>

      {#if upcomingBookings.length > 0}
        <div class="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <a
            href="/cleaner/bookings"
            class="text-primary hover:text-primary-600 text-sm font-medium"
          >
            View all bookings
          </a>
        </div>
      {/if}
    </div>
  </div>
{:catch error}
  <div class="rounded-lg border border-dashed border-red-300 bg-red-50 p-8 text-center dark:border-red-700 dark:bg-red-900/10">
    <h3 class="mb-2 text-lg font-medium text-red-800 dark:text-red-300">Failed to load dashboard</h3>
    <p class="text-red-600 dark:text-red-400">
      Please try again later or contact support if the problem persists.
    </p>
  </div>
{/await}
