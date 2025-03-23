<!-- src/routes/admin/dashboard/+page.svelte -->
<script lang="ts">
  import {
    ArrowDown,
    ArrowUp,
    BarChart,
    Calendar,
    CreditCard,
    LineChart,
    Users,
  } from "lucide-svelte";

  // Import data from server load function
  export let data;
  const { metrics, bookingTrends, revenueTrends, recentActivity } = data;

  // Helper function to format currency
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  }

  // Helper function to determine trend color
  function getTrendColor(value: number): string {
    return value >= 0 ? "text-green-500" : "text-red-500";
  }

  // Helper function to format date
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
</script>

<svelte:head>
  <title>Admin Dashboard | BrightBroom</title>
</svelte:head>

<!-- Page header -->
<div class="mb-8">
  <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
  <p class="mt-1 text-gray-600 dark:text-gray-400">
    Overview of your cleaning service platform
  </p>
</div>

<!-- Metrics cards -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  <!-- Total Bookings -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div class="flex justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
          Total Bookings
        </p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
          {metrics.totalBookings}
        </p>
      </div>
      <div class="bg-primary-100 dark:bg-primary-900/20 p-3 rounded-full">
        <Calendar class="text-primary h-6 w-6" />
      </div>
    </div>
    <div class="mt-4 flex items-center">
      <span class={getTrendColor(metrics.bookingTrend)}>
        {#if metrics.bookingTrend >= 0}
          <ArrowUp class="inline h-4 w-4" />
        {:else}
          <ArrowDown class="inline h-4 w-4" />
        {/if}
        {Math.abs(metrics.bookingTrend)}%
      </span>
      <span class="text-gray-500 dark:text-gray-400 text-sm ml-2"
        >from last month</span
      >
    </div>
  </div>

  <!-- Total Revenue -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div class="flex justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
          Total Revenue
        </p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
          {formatCurrency(metrics.totalRevenue)}
        </p>
      </div>
      <div class="bg-green-100 dark:bg-green-900/20 p-3 rounded-full">
        <CreditCard class="text-green-500 h-6 w-6" />
      </div>
    </div>
    <div class="mt-4 flex items-center">
      <span class={getTrendColor(metrics.revenueTrend)}>
        {#if metrics.revenueTrend >= 0}
          <ArrowUp class="inline h-4 w-4" />
        {:else}
          <ArrowDown class="inline h-4 w-4" />
        {/if}
        {Math.abs(metrics.revenueTrend)}%
      </span>
      <span class="text-gray-500 dark:text-gray-400 text-sm ml-2"
        >from last month</span
      >
    </div>
  </div>

  <!-- Active Cleaners -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div class="flex justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
          Active Cleaners
        </p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
          {metrics.activeCleaners}
        </p>
      </div>
      <div class="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-full">
        <Users class="text-blue-500 h-6 w-6" />
      </div>
    </div>
    <div class="mt-4 flex items-center">
      <span class={getTrendColor(metrics.cleanerTrend)}>
        {#if metrics.cleanerTrend >= 0}
          <ArrowUp class="inline h-4 w-4" />
        {:else}
          <ArrowDown class="inline h-4 w-4" />
        {/if}
        {Math.abs(metrics.cleanerTrend)}%
      </span>
      <span class="text-gray-500 dark:text-gray-400 text-sm ml-2"
        >from last month</span
      >
    </div>
  </div>

  <!-- Pending Bookings -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div class="flex justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
          Pending Bookings
        </p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
          {metrics.pendingBookings}
        </p>
      </div>
      <div class="bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-full">
        <Calendar class="text-yellow-500 h-6 w-6" />
      </div>
    </div>
    <div class="mt-2 flex justify-end">
      <a
        href="/admin/bookings?status=PENDING"
        class="text-sm text-primary hover:underline"
      >
        View all
      </a>
    </div>
  </div>
</div>

<!-- Charts -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
  <!-- Booking Trends Chart -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
      Booking Trends
    </h2>
    <div class="h-64">
      <!-- SVG Chart Placeholder - In a real app, you would use a chart library -->
      <div
        class="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg"
      >
        <LineChart size={48} class="text-gray-400" />
        <span class="ml-2 text-gray-500 dark:text-gray-400"
          >Booking trends chart will appear here</span
        >
      </div>
    </div>
  </div>

  <!-- Revenue Chart -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
      Revenue
    </h2>
    <div class="h-64">
      <!-- SVG Chart Placeholder - In a real app, you would use a chart library -->
      <div
        class="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg"
      >
        <BarChart size={48} class="text-gray-400" />
        <span class="ml-2 text-gray-500 dark:text-gray-400"
          >Revenue chart will appear here</span
        >
      </div>
    </div>
  </div>
</div>

<!-- Recent Activity -->
<div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
  <div class="p-6 border-b border-gray-200 dark:border-gray-700">
    <h2 class="text-lg font-medium text-gray-900 dark:text-white">
      Recent Activity
    </h2>
  </div>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead class="bg-gray-50 dark:bg-gray-700">
        <tr>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
          >
            Type
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
          >
            Details
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
          >
            Date
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
          >
            Actions
          </th>
        </tr>
      </thead>
      <tbody
        class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
      >
        {#if recentActivity && recentActivity.length > 0}
          {#each recentActivity as activity}
            <tr
              class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                  ${
                    activity.type === "BOOKING"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                      : activity.type === "PAYMENT"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                        : activity.type === "USER"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
                  }`}
                >
                  {activity.type}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900 dark:text-white">
                  {activity.description}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {activity.user}
                </div>
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
              >
                {formatDate(activity.date)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <a
                  href={activity.link}
                  class="text-primary hover:text-primary-600"
                >
                  View
                </a>
              </td>
            </tr>
          {/each}
        {:else}
          <tr>
            <td
              colspan="4"
              class="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
            >
              No recent activity found
            </td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
  <div class="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
    <a
      href="#"
      class="text-primary hover:text-primary-600 text-sm font-medium hover:underline"
    >
      View all activity
    </a>
  </div>
</div>
