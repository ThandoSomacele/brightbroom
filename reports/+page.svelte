<!-- src/routes/admin/reports/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import Button from "$lib/components/ui/Button.svelte";
  import {
    BarChart,
    Briefcase,
    Calendar,
    ChevronDown,
    Filter,
    TrendingDown,
    TrendingUp,
    Users,
    Wallet,
  } from "lucide-svelte";
  import { onMount } from "svelte";

  // Get data from server
  export let data;

  // Extract metrics and filters from data
  let { metrics, period, dateRange } = data;

  let revenueChartEl: HTMLCanvasElement;
  let bookingsChartEl: HTMLCanvasElement;
  let userGrowthChartEl: HTMLCanvasElement;

  let showDatePicker = false;
  let customStartDate = dateRange.startDate;
  let customEndDate = dateRange.endDate;

  // Format currency
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  }

  // Format percentage
  function formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  // Format large numbers
  function formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  }

  // Get trend icon and color class
  function getTrendClass(value: number): string {
    return value >= 0 ? "text-green-500" : "text-red-500";
  }

  function getTrendIcon(value: number) {
    return value >= 0 ? TrendingUp : TrendingDown;
  }

  // Update period filter
  function updatePeriod(newPeriod: string) {
    const searchParams = new URLSearchParams($page.url.searchParams);
    searchParams.set("period", newPeriod);

    // Remove any custom date params if switching to preset periods
    if (newPeriod !== "custom") {
      searchParams.delete("startDate");
      searchParams.delete("endDate");
    }

    goto(`?${searchParams.toString()}`);
  }

  // Apply custom date range
  function applyCustomDateRange() {
    if (!customStartDate || !customEndDate) return;

    const searchParams = new URLSearchParams($page.url.searchParams);
    searchParams.set("period", "custom");
    searchParams.set("startDate", customStartDate);
    searchParams.set("endDate", customEndDate);

    goto(`?${searchParams.toString()}`);
    showDatePicker = false;
  }

  // Initialize charts after component is mounted
  onMount(() => {
    initRevenueChart();
    initBookingsChart();
    initUserGrowthChart();
  });

  // Initialize Revenue Chart
  function initRevenueChart() {
    if (!revenueChartEl) return;

    // In a real implementation, you would use a library like Chart.js
    // Here's an example of what it might look like with Chart.js
    /*
    import { Chart } from 'chart.js/auto';
    
    const revenueData = metrics.revenue.trend.map(item => item.value);
    const revenueLabels = metrics.revenue.trend.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
    });
    
    new Chart(revenueChartEl, {
      type: 'line',
      data: {
        labels: revenueLabels,
        datasets: [{
          label: 'Revenue',
          data: revenueData,
          borderColor: '#20C3AF',
          backgroundColor: 'rgba(32, 195, 175, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
    */

    // For the purposes of this example, we'll just show a placeholder
    const ctx = revenueChartEl.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(0, 0, revenueChartEl.width, revenueChartEl.height);

      ctx.font = "14px Arial";
      ctx.fillStyle = "#6b7280";
      ctx.textAlign = "center";
      ctx.fillText(
        "Revenue Chart (Placeholder)",
        revenueChartEl.width / 2,
        revenueChartEl.height / 2,
      );
    }
  }

  // Initialize Bookings Chart
  function initBookingsChart() {
    if (!bookingsChartEl) return;

    // Placeholder for real chart implementation
    const ctx = bookingsChartEl.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(0, 0, bookingsChartEl.width, bookingsChartEl.height);

      ctx.font = "14px Arial";
      ctx.fillStyle = "#6b7280";
      ctx.textAlign = "center";
      ctx.fillText(
        "Bookings Chart (Placeholder)",
        bookingsChartEl.width / 2,
        bookingsChartEl.height / 2,
      );
    }
  }

  // Initialize User Growth Chart
  function initUserGrowthChart() {
    if (!userGrowthChartEl) return;

    // Placeholder for real chart implementation
    const ctx = userGrowthChartEl.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(0, 0, userGrowthChartEl.width, userGrowthChartEl.height);

      ctx.font = "14px Arial";
      ctx.fillStyle = "#6b7280";
      ctx.textAlign = "center";
      ctx.fillText(
        "User Growth Chart (Placeholder)",
        userGrowthChartEl.width / 2,
        userGrowthChartEl.height / 2,
      );
    }
  }
</script>

<svelte:head>
  <title>Analytics Reports | BrightBroom Admin</title>
</svelte:head>

<!-- Page header -->
<div class="mb-6">
  <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
    Analytics Reports
  </h1>
  <p class="mt-1 text-gray-600 dark:text-gray-400">
    Business performance metrics and trends
  </p>
</div>

<!-- Filters section -->
<div class="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h2 class="text-sm font-medium text-gray-700 dark:text-gray-300">
        Time Period
      </h2>
      <div class="mt-2 flex flex-wrap gap-2">
        <Button
          variant={period === "week" ? "primary" : "outline"}
          size="sm"
          on:click={() => updatePeriod("week")}
        >
          Last 7 Days
        </Button>
        <Button
          variant={period === "month" ? "primary" : "outline"}
          size="sm"
          on:click={() => updatePeriod("month")}
        >
          Last 30 Days
        </Button>
        <Button
          variant={period === "quarter" ? "primary" : "outline"}
          size="sm"
          on:click={() => updatePeriod("quarter")}
        >
          Last Quarter
        </Button>
        <Button
          variant={period === "year" ? "primary" : "outline"}
          size="sm"
          on:click={() => updatePeriod("year")}
        >
          Last Year
        </Button>
        <Button
          variant={period === "custom" ? "primary" : "outline"}
          size="sm"
          on:click={() => (showDatePicker = !showDatePicker)}
        >
          <Calendar size={14} class="mr-1" />
          Custom Range
          <ChevronDown size={14} class="ml-1" />
        </Button>
      </div>

      <!-- Custom date range picker -->
      {#if showDatePicker}
        <div
          class="mt-3 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700/50"
        >
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                for="startDate"
                class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                bind:value={customStartDate}
                class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label
                for="endDate"
                class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                bind:value={customEndDate}
                class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div class="mt-3 flex justify-end">
            <Button
              variant="primary"
              size="sm"
              on:click={applyCustomDateRange}
              disabled={!customStartDate || !customEndDate}
            >
              Apply Range
            </Button>
          </div>
        </div>
      {/if}
    </div>

    <div>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {#if period === "custom"}
          Showing data from <span class="font-medium"
            >{dateRange.startDate}</span
          >
          to <span class="font-medium">{dateRange.endDate}</span>
        {:else}
          Showing data for the <span class="font-medium"
            >{period === "week"
              ? "last 7 days"
              : period === "month"
                ? "last 30 days"
                : period === "quarter"
                  ? "last quarter"
                  : "last year"}</span
          >
        {/if}
      </p>
    </div>
  </div>
</div>

<!-- High level metrics cards -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
  <!-- Revenue Card -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div class="flex justify-between items-start">
      <div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
          Total Revenue
        </p>
        <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
          {formatCurrency(metrics.revenue.total)}
        </p>
      </div>
      <div class="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
        <Wallet size={20} class="text-green-600 dark:text-green-400" />
      </div>
    </div>
    <div class="mt-4 flex items-center">
      <svelte:component
        this={getTrendIcon(metrics.revenue.percentageChange)}
        size={16}
        class={getTrendClass(metrics.revenue.percentageChange)}
      />
      <span class={`ml-1 ${getTrendClass(metrics.revenue.percentageChange)}`}
        >{formatPercentage(Math.abs(metrics.revenue.percentageChange))}</span
      >
      <span class="ml-1 text-gray-500 dark:text-gray-400 text-sm"
        >vs previous period</span
      >
    </div>
  </div>

  <!-- Bookings Card -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div class="flex justify-between items-start">
      <div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
          Total Bookings
        </p>
        <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
          {formatNumber(metrics.bookings.total)}
        </p>
      </div>
      <div class="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
        <Calendar size={20} class="text-blue-600 dark:text-blue-400" />
      </div>
    </div>
    <div class="mt-4 flex items-center">
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          class="bg-primary h-2 rounded-full"
          style="width: {metrics.bookings.conversionRate}%"
        ></div>
      </div>
      <span class="ml-2 text-gray-700 dark:text-gray-300 text-sm"
        >{metrics.bookings.conversionRate.toFixed(1)}% completion</span
      >
    </div>
  </div>

  <!-- Customers Card -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div class="flex justify-between items-start">
      <div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
          New Customers
        </p>
        <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
          {formatNumber(
            metrics.userGrowth.customers.reduce(
              (sum, item) => sum + item.value,
              0,
            ),
          )}
        </p>
      </div>
      <div class="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20">
        <Users size={20} class="text-purple-600 dark:text-purple-400" />
      </div>
    </div>
    <div class="mt-4 grid grid-cols-7 gap-1">
      {#each Array(7) as _, i}
        <div
          class="h-8 bg-purple-100 dark:bg-purple-900/20 rounded"
          style="opacity: {0.3 + i * 0.1};"
        ></div>
      {/each}
    </div>
  </div>

  <!-- Cleaners Card -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div class="flex justify-between items-start">
      <div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
          Active Cleaners
        </p>
        <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
          {formatNumber(
            metrics.userGrowth.cleaners.reduce(
              (sum, item) => sum + item.value,
              0,
            ),
          )}
        </p>
      </div>
      <div class="p-2 rounded-full bg-amber-100 dark:bg-amber-900/20">
        <Briefcase size={20} class="text-amber-600 dark:text-amber-400" />
      </div>
    </div>
    <div class="mt-4 flex justify-between text-sm">
      <div>
        <p class="text-gray-500 dark:text-gray-400">Avg. Rating</p>
        <p class="font-medium text-gray-900 dark:text-white">4.8/5</p>
      </div>
      <div>
        <p class="text-gray-500 dark:text-gray-400">Retention</p>
        <p class="font-medium text-gray-900 dark:text-white">92%</p>
      </div>
      <div>
        <p class="text-gray-500 dark:text-gray-400">Utilization</p>
        <p class="font-medium text-gray-900 dark:text-white">78%</p>
      </div>
    </div>
  </div>
</div>

<!-- Charts section -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
  <!-- Revenue Trend Chart -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white">
        Revenue Trend
      </h2>
    </div>
    <div class="p-4">
      <canvas bind:this={revenueChartEl} width="400" height="200"></canvas>
    </div>
  </div>

  <!-- Bookings Trend Chart -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white">
        Booking Trend
      </h2>
    </div>
    <div class="p-4">
      <canvas bind:this={bookingsChartEl} width="400" height="200"></canvas>
    </div>
  </div>
</div>

<!-- Top services and growth trend -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
  <!-- Top Services Table -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white">
        Top Services
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
              Service
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Bookings
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Revenue
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Share
            </th>
          </tr>
        </thead>
        <tbody
          class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
        >
          {#if metrics.topServices && metrics.topServices.length > 0}
            {#each metrics.topServices as service, i}
              <tr
                class={i % 2 === 0
                  ? "bg-white dark:bg-gray-800"
                  : "bg-gray-50 dark:bg-gray-700"}
              >
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
                >
                  {service.serviceName}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                >
                  {service.bookingCount}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                >
                  {formatCurrency(service.totalRevenue)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div
                      class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full"
                    >
                      <div
                        class="h-2 bg-primary rounded-full"
                        style="width: {(
                          (service.bookingCount / metrics.bookings.total) *
                          100
                        ).toFixed(1)}%"
                      ></div>
                    </div>
                    <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      {(
                        (service.bookingCount / metrics.bookings.total) *
                        100
                      ).toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            {/each}
          {:else}
            <tr>
              <td
                colspan="4"
                class="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
              >
                No service data available for this period
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  </div>

  <!-- User Growth Chart -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white">
        User Growth
      </h2>
    </div>
    <div class="p-4">
      <canvas bind:this={userGrowthChartEl} width="400" height="200"></canvas>
    </div>
  </div>
</div>

<!-- Cleaner Performance Section -->
<div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-6">
  <div
    class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
  >
    <h2 class="text-lg font-medium text-gray-900 dark:text-white">
      Cleaner Performance
    </h2>
    <Button variant="outline" size="sm">
      <Filter size={14} class="mr-1" />
      Filter
    </Button>
  </div>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead class="bg-gray-50 dark:bg-gray-700">
        <tr>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
          >
            Cleaner
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
          >
            Completed Bookings
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
          >
            Avg Booking Value
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
          >
            On-time %
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
          >
            Rating
          </th>
        </tr>
      </thead>
      <tbody
        class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
      >
        {#if metrics.cleanerPerformance && metrics.cleanerPerformance.length > 0}
          {#each metrics.cleanerPerformance as cleaner, i}
            <tr
              class={i % 2 === 0
                ? "bg-white dark:bg-gray-800"
                : "bg-gray-50 dark:bg-gray-700"}
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div
                    class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center"
                  >
                    <span class="text-gray-700 dark:text-gray-300 font-medium"
                      >{cleaner.cleanerName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}</span
                    >
                  </div>
                  <div class="ml-4">
                    <div
                      class="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {cleaner.cleanerName}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      ID: {cleaner.cleanerId.substring(0, 8)}...
                    </div>
                  </div>
                </div>
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
              >
                {cleaner.completedBookings}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
              >
                {formatCurrency(cleaner.averageBookingValue)}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
              >
                <!-- Simulated on-time percentage, in a real app this would come from the data -->
                {(85 + ((i * 2) % 15)).toFixed(1)}%
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  {#each Array(5) as _, j}
                    <svg
                      class="w-4 h-4 {j < 4
                        ? 'text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'}"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      ></path>
                    </svg>
                  {/each}
                  <span class="ml-1 text-sm text-gray-500 dark:text-gray-400"
                    >4.0</span
                  >
                </div>
              </td>
            </tr>
          {/each}
        {:else}
          <tr>
            <td
              colspan="5"
              class="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
            >
              No cleaner performance data available for this period
            </td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
</div>

<!-- Export and advanced analytics section -->
<div
  class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6"
>
  <div>
    <Button variant="outline">
      <BarChart size={16} class="mr-2" />
      Export Report
    </Button>
  </div>
  <div class="text-sm text-gray-500 dark:text-gray-400">
    * All data shown is for the selected time period. Trends are calculated by
    comparing with the previous equivalent period.
  </div>
</div>
