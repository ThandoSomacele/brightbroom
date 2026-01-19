<!-- src/routes/admin/dashboard/+page.svelte -->
<script lang="ts">
  import {
    ArrowDown,
    ArrowUp,
    Calendar,
    CreditCard,
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

  // Format date for chart labels
  function formatChartDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-ZA", { month: "short", day: "numeric" });
  }

  // Generate SVG path for line chart
  function generateLinePath(
    chartData: { date: string; value: number }[],
    width: number,
    height: number,
    padding: number,
  ): string {
    if (chartData.length === 0) return "";

    const maxValue = Math.max(...chartData.map((d) => d.value), 1);
    const xStep = (width - padding * 2) / Math.max(chartData.length - 1, 1);

    return chartData
      .map((point, i) => {
        const x = padding + i * xStep;
        const y = height - padding - (point.value / maxValue) * (height - padding * 2);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }

  // Generate SVG area path for filled chart
  function generateAreaPath(
    chartData: { date: string; value: number }[],
    width: number,
    height: number,
    padding: number,
  ): string {
    if (chartData.length === 0) return "";

    const maxValue = Math.max(...chartData.map((d) => d.value), 1);
    const xStep = (width - padding * 2) / Math.max(chartData.length - 1, 1);

    const linePath = chartData
      .map((point, i) => {
        const x = padding + i * xStep;
        const y = height - padding - (point.value / maxValue) * (height - padding * 2);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

    const lastX = padding + (chartData.length - 1) * xStep;
    return `${linePath} L ${lastX} ${height - padding} L ${padding} ${height - padding} Z`;
  }

  // Get Y-axis labels
  function getYAxisLabels(chartData: { value: number }[]): number[] {
    if (chartData.length === 0) return [0];
    const maxValue = Math.max(...chartData.map((d) => d.value), 1);
    const step = Math.ceil(maxValue / 4);
    return [0, step, step * 2, step * 3, Math.ceil(maxValue)];
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

<!-- Pending Cleaner Applications -->
{#if metrics.pendingCleaners && metrics.pendingCleaners.length > 0}
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
    <div
      class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
    >
      <h2 class="text-lg font-medium text-gray-900 dark:text-white">
        Pending Cleaner Applications
      </h2>
      <a
        href="/admin/cleaners?filter=pending"
        class="text-primary hover:text-primary-600 text-sm"
      >
        View all
      </a>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Name
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Email
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Applied
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody
          class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
        >
          {#each metrics.pendingCleaners as cleaner}
            <tr
              class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {cleaner.firstName}
                  {cleaner.lastName}
                </div>
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
              >
                {cleaner.email}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
              >
                {formatDate(cleaner.createdAt)}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
              >
                <a
                  href={`/admin/cleaners/${cleaner.id}`}
                  class="text-primary hover:text-primary-600"
                >
                  Review
                </a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}

<!-- Charts -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
  <!-- Booking Trends Chart -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
      Booking Trends (Last 30 Days)
    </h2>
    <div class="h-64">
      {#if bookingTrends && bookingTrends.length > 0}
        <svg viewBox="0 0 400 220" class="w-full h-full">
          <!-- Grid lines -->
          {#each [0, 1, 2, 3, 4] as i (i)}
            <line
              x1="40"
              y1={190 - i * 40}
              x2="380"
              y2={190 - i * 40}
              stroke="#e5e7eb"
              stroke-width="1"
            />
          {/each}

          <!-- Y-axis labels -->
          {#each getYAxisLabels(bookingTrends) as label, i (i)}
            <text
              x="35"
              y={193 - i * 40}
              text-anchor="end"
              class="text-xs fill-gray-500"
              font-size="10"
            >
              {label}
            </text>
          {/each}

          <!-- Area fill -->
          <path
            d={generateAreaPath(bookingTrends, 400, 220, 40)}
            fill="rgba(59, 130, 246, 0.1)"
          />

          <!-- Line -->
          <path
            d={generateLinePath(bookingTrends, 400, 220, 40)}
            fill="none"
            stroke="#3b82f6"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <!-- Data points -->
          {#each bookingTrends as point, i (point.date)}
            {@const maxValue = Math.max(...bookingTrends.map((d) => d.value), 1)}
            {@const xStep = 320 / Math.max(bookingTrends.length - 1, 1)}
            {@const x = 40 + i * xStep}
            {@const y = 190 - (point.value / maxValue) * 160}
            <circle cx={x} cy={y} r="3" fill="#3b82f6" />
            <title>{formatChartDate(point.date)}: {point.value} bookings</title>
          {/each}

          <!-- X-axis labels -->
          {#if bookingTrends.length > 0}
            <text x="40" y="210" text-anchor="start" class="text-xs fill-gray-500" font-size="9">
              {formatChartDate(bookingTrends[0].date)}
            </text>
            {#if bookingTrends.length > 2}
              <text x="210" y="210" text-anchor="middle" class="text-xs fill-gray-500" font-size="9">
                {formatChartDate(bookingTrends[Math.floor(bookingTrends.length / 2)].date)}
              </text>
            {/if}
            <text x="380" y="210" text-anchor="end" class="text-xs fill-gray-500" font-size="9">
              {formatChartDate(bookingTrends[bookingTrends.length - 1].date)}
            </text>
          {/if}
        </svg>
      {:else}
        <div class="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <span class="text-gray-500 dark:text-gray-400">No booking data available</span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Revenue Chart -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
      Revenue (Last 30 Days)
    </h2>
    <div class="h-64">
      {#if revenueTrends && revenueTrends.length > 0}
        <svg viewBox="0 0 400 220" class="w-full h-full">
          <!-- Grid lines -->
          {#each [0, 1, 2, 3, 4] as i (i)}
            <line
              x1="50"
              y1={190 - i * 40}
              x2="380"
              y2={190 - i * 40}
              stroke="#e5e7eb"
              stroke-width="1"
            />
          {/each}

          <!-- Y-axis labels -->
          {#each getYAxisLabels(revenueTrends) as label, i (i)}
            <text
              x="45"
              y={193 - i * 40}
              text-anchor="end"
              class="text-xs fill-gray-500"
              font-size="9"
            >
              R{label >= 1000 ? (label / 1000).toFixed(0) + "k" : label}
            </text>
          {/each}

          <!-- Bars -->
          {#each revenueTrends as point, i (point.date)}
            {@const maxValue = Math.max(...revenueTrends.map((d) => d.value), 1)}
            {@const barWidth = Math.min(20, 300 / revenueTrends.length - 2)}
            {@const xStep = 330 / revenueTrends.length}
            {@const x = 50 + i * xStep + (xStep - barWidth) / 2}
            {@const barHeight = (point.value / maxValue) * 160}
            {@const y = 190 - barHeight}
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill="#20C3AF"
              rx="2"
              class="hover:fill-teal-600 transition-colors"
            >
              <title>{formatChartDate(point.date)}: {formatCurrency(point.value)}</title>
            </rect>
          {/each}

          <!-- X-axis labels -->
          {#if revenueTrends.length > 0}
            <text x="50" y="210" text-anchor="start" class="text-xs fill-gray-500" font-size="9">
              {formatChartDate(revenueTrends[0].date)}
            </text>
            {#if revenueTrends.length > 2}
              <text x="215" y="210" text-anchor="middle" class="text-xs fill-gray-500" font-size="9">
                {formatChartDate(revenueTrends[Math.floor(revenueTrends.length / 2)].date)}
              </text>
            {/if}
            <text x="380" y="210" text-anchor="end" class="text-xs fill-gray-500" font-size="9">
              {formatChartDate(revenueTrends[revenueTrends.length - 1].date)}
            </text>
          {/if}
        </svg>
      {:else}
        <div class="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <span class="text-gray-500 dark:text-gray-400">No revenue data available</span>
        </div>
      {/if}
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
      href="#!"
      class="text-primary hover:text-primary-600 text-sm font-medium hover:underline"
    >
      View all activity
    </a>
  </div>
</div>
