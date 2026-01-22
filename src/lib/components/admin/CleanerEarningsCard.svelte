<!-- src/lib/components/admin/CleanerEarningsCard.svelte -->
<script lang="ts">
  import { Calendar, TrendingUp, ArrowUpRight, Wallet, Clock } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";

  // Props
  export let cleanerId: string;
  export let earnings = {
    totalEarnings: 0,
    totalPayFastFees: 0,
    totalCommission: 0,
    totalPayout: 0,
    pendingPayout: 0,
    currentMonthEarnings: 0,
    lastMonthEarnings: 0,
    yearToDateEarnings: 0,
    lastPayoutAmount: 0,
    lastPayoutDate: null as Date | null,
  };
  export let upcomingEarnings = {
    potentialEarnings: 0,
    upcomingBookingsCount: 0,
  };
  export let isLoading = false;
  export let error: string | null = null;

  // Format currency function
  function formatCurrency(amount: number): string {
    return `R${amount.toFixed(2)}`;
  }

  // Format date function
  function formatDate(date: Date | null): string {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  // Calculate net after PayFast fees
  $: netAfterPayFast = earnings.totalEarnings - earnings.totalPayFastFees;
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
  <div class="p-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
        <Wallet class="mr-2 text-primary" size={20} />
        Earnings Summary
      </h2>
      
      <Button variant="outline" size="sm" href={`/admin/cleaners/${cleanerId}/earnings`}>
        <span>View Details</span>
        <ArrowUpRight size={16} class="ml-1" />
      </Button>
    </div>
    
    {#if isLoading}
      <div class="flex justify-center py-6">
        <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    {:else if error}
      <div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-4 rounded-md mb-4">
        <p>{error}</p>
      </div>
    {:else}
      <!-- Summary cards grid -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <!-- Total Payout (Earned) -->
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Earned</p>
          <p class="text-2xl font-bold text-primary">{formatCurrency(earnings.totalPayout)}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">From completed bookings</p>
        </div>

        <!-- Potential Earnings (Upcoming) -->
        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            <Clock size={14} class="mr-1" />
            Incoming
          </p>
          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(upcomingEarnings.potentialEarnings)}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {upcomingEarnings.upcomingBookingsCount} upcoming booking{upcomingEarnings.upcomingBookingsCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <!-- Payout breakdown -->
      <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-4">
        <div class="flex justify-between items-center text-sm">
          <span class="text-gray-600 dark:text-gray-400">Gross Bookings</span>
          <span class="text-gray-900 dark:text-white">{formatCurrency(earnings.totalEarnings)}</span>
        </div>
        <div class="flex justify-between items-center text-sm mt-1">
          <span class="text-gray-600 dark:text-gray-400">PayFast Fees</span>
          <span class="text-red-600 dark:text-red-400">-{formatCurrency(earnings.totalPayFastFees)}</span>
        </div>
        <div class="flex justify-between items-center text-sm mt-1">
          <span class="text-gray-600 dark:text-gray-400">Net After Fees</span>
          <span class="text-gray-900 dark:text-white">{formatCurrency(netAfterPayFast)}</span>
        </div>
        <div class="flex justify-between items-center text-sm mt-1">
          <span class="text-gray-600 dark:text-gray-400">Platform Commission (20%)</span>
          <span class="text-red-600 dark:text-red-400">-{formatCurrency(earnings.totalCommission)}</span>
        </div>
        <div class="flex justify-between items-center text-sm mt-1 pt-1 border-t border-gray-200 dark:border-gray-600">
          <span class="font-medium text-gray-700 dark:text-gray-300">Cleaner Payout</span>
          <span class="font-medium text-primary">{formatCurrency(earnings.totalPayout)}</span>
        </div>
      </div>
      
      <!-- Recent earnings section -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          <Calendar size={16} class="inline mr-1" />
          Recent Earnings
        </h3>
        
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600 dark:text-gray-400">This Month</span>
            <span class="font-medium text-gray-900 dark:text-white">{formatCurrency(earnings.currentMonthEarnings)}</span>
          </div>
          
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600 dark:text-gray-400">Last Month</span>
            <span class="font-medium text-gray-900 dark:text-white">{formatCurrency(earnings.lastMonthEarnings)}</span>
          </div>
          
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600 dark:text-gray-400">Year To Date</span>
            <span class="font-medium text-gray-900 dark:text-white">{formatCurrency(earnings.yearToDateEarnings)}</span>
          </div>
        </div>
      </div>
      
      <!-- Payout status -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          <TrendingUp size={16} class="inline mr-1" />
          Payout Status
        </h3>
        
        {#if earnings.pendingPayout > 0}
          <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md mb-3">
            <p class="text-sm text-yellow-800 dark:text-yellow-300 flex justify-between">
              <span>Pending Payout</span>
              <span class="font-bold">{formatCurrency(earnings.pendingPayout)}</span>
            </p>
          </div>
        {/if}
        
        <div class="flex justify-between items-center text-sm">
          <span class="text-gray-600 dark:text-gray-400">Last Payout</span>
          <div class="text-right">
            <div class="font-medium text-gray-900 dark:text-white">
              {formatCurrency(earnings.lastPayoutAmount || 0)}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(earnings.lastPayoutDate)}
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
