<!-- src/routes/cleaner/earnings/+page.svelte -->
<script lang="ts">
  import { Calendar, DollarSign } from 'lucide-svelte';
  
  export let data;
  
  const { summary, payoutDates, completedBookings, monthlyEarnings } = data;
  
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
</script>

<svelte:head>
  <title>Earnings | BrightBroom Cleaner</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
    Earnings & Payouts
  </h1>
  
  <!-- Earnings Summary Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Total Earnings -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0 bg-primary-100 rounded-full p-3 dark:bg-primary-900/20">
          <DollarSign class="h-6 w-6 text-primary" />
        </div>
        <div class="ml-5">
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Earnings
          </p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">
            {formatCurrency(summary.totalEarnings)}
          </p>
        </div>
      </div>
    </div>
    
    <!-- Current Month -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0 bg-primary-100 rounded-full p-3 dark:bg-primary-900/20">
          <Calendar class="h-6 w-6 text-primary" />
        </div>
        <div class="ml-5">
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
            This Month
          </p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">
            {formatCurrency(summary.totalEarningsCurrentMonth)}
          </p>
        </div>
      </div>
    </div>
    
    <!-- Last Month -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0 bg-primary-100 rounded-full p-3 dark:bg-primary-900/20">
          <Calendar class="h-6 w-6 text-primary" />
        </div>
        <div class="ml-5">
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Last Month
          </p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">
            {formatCurrency(summary.totalEarningsLastMonth)}
          </p>
        </div>
      </div>
    </div>
    
    <!-- Pending Payout -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0 bg-secondary-100 rounded-full p-3 dark:bg-secondary-900/20">
          <DollarSign class="h-6 w-6 text-secondary" />
        </div>
        <div class="ml-5">
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Pending Payout
          </p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">
            {formatCurrency(summary.pendingPayout)}
          </p>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Payout Schedule -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white">
        Upcoming Payouts
      </h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Payouts are processed every Thursday
      </p>
    </div>
    
    <div class="divide-y divide-gray-200 dark:divide-gray-700">
      {#each payoutDates as date, i}
        <div class="p-6 flex justify-between items-center">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              {formatDate(date)}
            </p>
            {#if i === 0}
              <p class="text-sm text-primary mt-1">
                Next payout
              </p>
            {/if}
          </div>
          
          {#if i === 0}
            <span class="font-semibold text-gray-900 dark:text-white">
              {formatCurrency(summary.pendingPayout)}
            </span>
          {:else}
            <span class="text-gray-500 dark:text-gray-400 text-sm">
              Will include bookings completed after {formatDate(payoutDates[i-1])}
            </span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
  
  <!-- Monthly Earnings Chart -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white">
        Monthly Earnings
      </h2>
    </div>
    
    <div class="p-6">
      <!-- Simple bar chart representation -->
      <div class="h-64 flex items-end">
        {#each monthlyEarnings as { month, year, earnings }, i}
          <div class="flex-1 flex flex-col items-center">
            <div 
              class="w-4/5 bg-primary rounded-t-md transition-all duration-500" 
              style="height: {Math.max(10, (earnings / Math.max(...monthlyEarnings.map(m => m.earnings))) * 80)}%"
            ></div>
            <div class="mt-2 text-center">
              <div class="text-xs font-medium text-gray-900 dark:text-white">
                {month} {year}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {formatCurrency(earnings)}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
  
  <!-- Completed Bookings (Earnings History) -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white">
        Earnings History
      </h2>
    </div>
    
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Service
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Customer
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Amount
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {#if completedBookings.length === 0}
            <tr>
              <td colspan="5" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                No completed bookings yet.
              </td>
            </tr>
          {:else}
            {#each completedBookings as booking}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {formatDate(booking.scheduledDate)}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {booking.service.name}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {booking.address.street}, {booking.address.city}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {booking.customer.firstName} {booking.customer.lastName}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(booking.price * 0.75)}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {#if booking.isPaid}
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                      Paid
                    </span>
                  {:else}
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                      Pending
                    </span>
                  {/if}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>
