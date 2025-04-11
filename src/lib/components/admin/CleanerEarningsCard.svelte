<!-- src/lib/components/admin/CleanerEarningsCard.svelte -->
<script lang="ts">
  import { DollarSign, Calendar, TrendingUp, ArrowUpRight, Wallet } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  
  // Props
  export let cleanerId: string;
  export let earnings = {
    totalEarnings: 0,
    totalCommission: 0,
    totalPayout: 0,
    pendingPayout: 0,
    currentMonthEarnings: 0,
    lastMonthEarnings: 0,
    yearToDateEarnings: 0,
    lastPayoutAmount: 0,
    lastPayoutDate: null as Date | null,
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
  
  // Calculate commission percentage
  $: commissionPercentage = earnings.totalEarnings > 0 
    ? ((earnings.totalCommission / earnings.totalEarnings) * 100).toFixed(1)
    : "25.0";
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
        <!-- Total Earnings -->
        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Earnings</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(earnings.totalEarnings)}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Before {commissionPercentage}% commission</p>
        </div>
        
        <!-- Total Payout -->
        <div class="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Payout</p>
          <p class="text-2xl font-bold text-primary">{formatCurrency(earnings.totalPayout)}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">After platform commission</p>
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
