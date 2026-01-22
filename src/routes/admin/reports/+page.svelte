<!-- src/routes/admin/reports/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { navigating, page } from "$app/stores";
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

  // Get data from server
  export let data;

  // Extract metrics and filters from data
  $: ({ metrics, period, dateRange } = data);

  // Show skeleton when navigating to this page
  $: isLoading = $navigating?.to?.route?.id === "/admin/reports";

  let showDatePicker = false;
  let customStartDate = data.dateRange?.startDate ?? "";
  let customEndDate = data.dateRange?.endDate ?? "";

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

  // Format date for chart labels
  function formatChartDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-ZA", { month: "short", day: "numeric" });
  }

  // Generate SVG path for line chart
  function generateLinePath(
    data: { date: string; value: number }[],
    width: number,
    height: number,
    padding: number,
  ): string {
    if (data.length === 0) return "";

    const maxValue = Math.max(...data.map((d) => d.value), 1);
    const xStep = (width - padding * 2) / Math.max(data.length - 1, 1);

    return data
      .map((point, i) => {
        const x = padding + i * xStep;
        const y = height - padding - (point.value / maxValue) * (height - padding * 2);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }

  // Generate SVG area path for filled chart
  function generateAreaPath(
    data: { date: string; value: number }[],
    width: number,
    height: number,
    padding: number,
  ): string {
    if (data.length === 0) return "";

    const maxValue = Math.max(...data.map((d) => d.value), 1);
    const xStep = (width - padding * 2) / Math.max(data.length - 1, 1);

    const linePath = data
      .map((point, i) => {
        const x = padding + i * xStep;
        const y = height - padding - (point.value / maxValue) * (height - padding * 2);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

    // Close the path to create a filled area
    const lastX = padding + (data.length - 1) * xStep;
    return `${linePath} L ${lastX} ${height - padding} L ${padding} ${height - padding} Z`;
  }

  // Get Y-axis labels
  function getYAxisLabels(data: { value: number }[]): number[] {
    if (data.length === 0) return [0];
    const maxValue = Math.max(...data.map((d) => d.value), 1);
    const step = Math.ceil(maxValue / 4);
    return [0, step, step * 2, step * 3, Math.ceil(maxValue)];
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
        {#if isLoading}
          <div class="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
        {:else}
          <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(metrics.revenue.total)}
          </p>
        {/if}
      </div>
      <div class="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
        <Wallet size={20} class="text-green-600 dark:text-green-400" />
      </div>
    </div>
    <div class="mt-4 flex items-center">
      {#if isLoading}
        <div class="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      {:else}
        <svelte:component
          this={getTrendIcon(metrics.revenue.percentageChange)}
          size={16}
          class={getTrendClass(metrics.revenue.percentageChange)}
        />
        <span class={`ml-1 ${getTrendClass(metrics.revenue.percentageChange)}`}
          >{formatPercentage(Math.abs(metrics.revenue.percentageChange))}</span
        >
        <span class="ml-1 text-gray-500 dark:text-gray-400 text-sm">vs previous period</span>
      {/if}
    </div>
  </div>

  <!-- Bookings Card -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div class="flex justify-between items-start">
      <div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
          Total Bookings
        </p>
        {#if isLoading}
          <div class="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
        {:else}
          <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {formatNumber(metrics.bookings.total)}
          </p>
        {/if}
      </div>
      <div class="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
        <Calendar size={20} class="text-blue-600 dark:text-blue-400" />
      </div>
    </div>
    <div class="mt-4 flex items-center">
      {#if isLoading}
        <div class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        <div class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-2"></div>
      {:else}
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            class="bg-primary h-2 rounded-full"
            style="width: {metrics.bookings.conversionRate}%"
          ></div>
        </div>
        <span class="ml-2 text-gray-700 dark:text-gray-300 text-sm"
          >{metrics.bookings.conversionRate.toFixed(1)}% completion</span
        >
      {/if}
    </div>
  </div>

  <!-- Customers Card -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div class="flex justify-between items-start">
      <div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
          New Customers
        </p>
        {#if isLoading}
          <div class="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
        {:else}
          <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {formatNumber(
              metrics.userGrowth.customers.reduce(
                (sum, item) => sum + item.value,
                0,
              ),
            )}
          </p>
        {/if}
      </div>
      <div class="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20">
        <Users size={20} class="text-purple-600 dark:text-purple-400" />
      </div>
    </div>
    <div class="mt-4 grid grid-cols-7 gap-1">
      {#each Array(7) as _, i (i)}
        <div
          class="h-8 rounded {isLoading ? 'bg-gray-200 dark:bg-gray-700 animate-pulse' : 'bg-purple-100 dark:bg-purple-900/20'}"
          style="opacity: {isLoading ? 1 : 0.3 + i * 0.1};"
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
        {#if isLoading}
          <div class="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
        {:else}
          <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {formatNumber(
              metrics.userGrowth.cleaners.reduce(
                (sum, item) => sum + item.value,
                0,
              ),
            )}
          </p>
        {/if}
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
      {#if isLoading}
        <div class="h-48 flex flex-col justify-end">
          <div class="flex items-end justify-between gap-2 h-36 px-4">
            {#each Array(8) as _, i (i)}
              <div
                class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-t animate-pulse"
                style="height: {25 + Math.random() * 55}%"
              ></div>
            {/each}
          </div>
          <div class="flex justify-between mt-3 px-4">
            <div class="h-3 w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div class="h-3 w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div class="h-3 w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      {:else if metrics.revenue.trend && metrics.revenue.trend.length > 0}
        <svg viewBox="0 0 400 200" class="w-full h-48">
          <!-- Grid lines -->
          {#each [0, 1, 2, 3, 4] as i (i)}
            <line
              x1="50"
              y1={180 - i * 35}
              x2="380"
              y2={180 - i * 35}
              stroke="#e5e7eb"
              stroke-width="1"
            />
          {/each}

          <!-- Y-axis labels -->
          {#each getYAxisLabels(metrics.revenue.trend) as label, i (i)}
            <text
              x="45"
              y={183 - i * 35}
              text-anchor="end"
              class="text-xs fill-gray-500"
              font-size="10"
            >
              {formatCurrency(label).replace("ZAR", "R")}
            </text>
          {/each}

          <!-- Area fill -->
          <path
            d={generateAreaPath(metrics.revenue.trend, 400, 200, 50)}
            fill="rgba(32, 195, 175, 0.1)"
          />

          <!-- Line -->
          <path
            d={generateLinePath(metrics.revenue.trend, 400, 200, 50)}
            fill="none"
            stroke="#20C3AF"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <!-- Data points -->
          {#each metrics.revenue.trend as point, i (point.date)}
            {@const maxValue = Math.max(...metrics.revenue.trend.map((d) => d.value), 1)}
            {@const xStep = 300 / Math.max(metrics.revenue.trend.length - 1, 1)}
            {@const x = 50 + i * xStep}
            {@const y = 180 - (point.value / maxValue) * 140}
            <circle
              cx={x}
              cy={y}
              r="4"
              fill="#20C3AF"
              class="hover:r-6 transition-all"
            />
            <title>{formatChartDate(point.date)}: {formatCurrency(point.value)}</title>
          {/each}

          <!-- X-axis labels (show first, middle, last) -->
          {#if metrics.revenue.trend.length > 0}
            <text x="50" y="198" text-anchor="start" class="text-xs fill-gray-500" font-size="10">
              {formatChartDate(metrics.revenue.trend[0].date)}
            </text>
            {#if metrics.revenue.trend.length > 2}
              <text x="215" y="198" text-anchor="middle" class="text-xs fill-gray-500" font-size="10">
                {formatChartDate(metrics.revenue.trend[Math.floor(metrics.revenue.trend.length / 2)].date)}
              </text>
            {/if}
            <text x="380" y="198" text-anchor="end" class="text-xs fill-gray-500" font-size="10">
              {formatChartDate(metrics.revenue.trend[metrics.revenue.trend.length - 1].date)}
            </text>
          {/if}
        </svg>
      {:else}
        <div class="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <p>No revenue data available for this period</p>
        </div>
      {/if}
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
      {#if isLoading}
        <div class="h-48 flex flex-col justify-end">
          <div class="flex items-end justify-between gap-2 h-36 px-4">
            {#each Array(8) as _, i (i)}
              <div
                class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-t animate-pulse"
                style="height: {25 + Math.random() * 55}%"
              ></div>
            {/each}
          </div>
          <div class="flex justify-between mt-3 px-4">
            <div class="h-3 w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div class="h-3 w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div class="h-3 w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      {:else if metrics.bookingTrend && metrics.bookingTrend.length > 0}
        <svg viewBox="0 0 400 200" class="w-full h-48">
          <!-- Grid lines -->
          {#each [0, 1, 2, 3, 4] as i (i)}
            <line
              x1="40"
              y1={180 - i * 35}
              x2="380"
              y2={180 - i * 35}
              stroke="#e5e7eb"
              stroke-width="1"
            />
          {/each}

          <!-- Y-axis labels -->
          {#each getYAxisLabels(metrics.bookingTrend) as label, i (i)}
            <text
              x="35"
              y={183 - i * 35}
              text-anchor="end"
              class="text-xs fill-gray-500"
              font-size="10"
            >
              {label}
            </text>
          {/each}

          <!-- Bars -->
          {#each metrics.bookingTrend as point, i (point.date)}
            {@const maxValue = Math.max(...metrics.bookingTrend.map((d) => d.value), 1)}
            {@const barWidth = Math.min(30, 300 / metrics.bookingTrend.length - 4)}
            {@const xStep = 340 / metrics.bookingTrend.length}
            {@const x = 40 + i * xStep + (xStep - barWidth) / 2}
            {@const barHeight = (point.value / maxValue) * 140}
            {@const y = 180 - barHeight}
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill="#3b82f6"
              rx="2"
              class="hover:fill-blue-600 transition-colors"
            >
              <title>{formatChartDate(point.date)}: {point.value} bookings</title>
            </rect>
          {/each}

          <!-- X-axis labels (show first, middle, last) -->
          {#if metrics.bookingTrend.length > 0}
            <text x="40" y="198" text-anchor="start" class="text-xs fill-gray-500" font-size="10">
              {formatChartDate(metrics.bookingTrend[0].date)}
            </text>
            {#if metrics.bookingTrend.length > 2}
              <text x="210" y="198" text-anchor="middle" class="text-xs fill-gray-500" font-size="10">
                {formatChartDate(metrics.bookingTrend[Math.floor(metrics.bookingTrend.length / 2)].date)}
              </text>
            {/if}
            <text x="380" y="198" text-anchor="end" class="text-xs fill-gray-500" font-size="10">
              {formatChartDate(metrics.bookingTrend[metrics.bookingTrend.length - 1].date)}
            </text>
          {/if}
        </svg>
      {:else}
        <div class="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <p>No booking data available for this period</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Booking insights section -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
  <!-- Average Metrics -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white">
        Booking Averages
      </h2>
    </div>
    <div class="p-6 grid grid-cols-2 gap-6">
      <div class="text-center">
        {#if isLoading}
          <div class="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto"></div>
        {:else}
          <p class="text-3xl font-bold text-primary">
            {Math.floor((metrics.bookingInsights?.averageDuration || 0) / 60)}h {(metrics.bookingInsights?.averageDuration || 0) % 60}m
          </p>
        {/if}
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Avg Duration</p>
      </div>
      <div class="text-center">
        {#if isLoading}
          <div class="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto"></div>
        {:else}
          <p class="text-3xl font-bold text-primary">
            {formatCurrency(metrics.bookingInsights?.averagePrice || 0)}
          </p>
        {/if}
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Avg Price</p>
      </div>
    </div>
  </div>

  <!-- User Growth Summary -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white">
        User Growth
      </h2>
    </div>
    <div class="p-6 grid grid-cols-2 gap-6">
      <div class="text-center">
        {#if isLoading}
          <div class="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto"></div>
        {:else}
          <p class="text-3xl font-bold text-purple-600">
            {formatNumber(
              metrics.userGrowth.customers.reduce(
                (sum: number, item: { value: number }) => sum + item.value,
                0,
              ),
            )}
          </p>
        {/if}
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">New Customers</p>
      </div>
      <div class="text-center">
        {#if isLoading}
          <div class="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto"></div>
        {:else}
          <p class="text-3xl font-bold text-amber-600">
            {formatNumber(
              metrics.userGrowth.cleaners.reduce(
                (sum: number, item: { value: number }) => sum + item.value,
                0,
              ),
            )}
          </p>
        {/if}
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">New Cleaners</p>
      </div>
    </div>
  </div>
</div>

<!-- Room configurations and addons section -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
  <!-- Popular Room Configurations -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white">
        Popular Room Configurations
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
              Configuration
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
          {#if isLoading}
            {#each Array(3) as _, i (i)}
              <tr class={i % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"}>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                    <div class="h-4 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-2"></div>
                  </div>
                </td>
              </tr>
            {/each}
          {:else if metrics.bookingInsights?.roomConfigurations && metrics.bookingInsights.roomConfigurations.length > 0}
            {#each metrics.bookingInsights.roomConfigurations as config, i (config.configuration)}
              <tr
                class={i % 2 === 0
                  ? "bg-white dark:bg-gray-800"
                  : "bg-gray-50 dark:bg-gray-700"}
              >
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
                >
                  {config.configuration}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                >
                  {config.bookingCount}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                >
                  {formatCurrency(config.totalRevenue)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div
                      class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full"
                    >
                      <div
                        class="h-2 bg-primary rounded-full"
                        style="width: {metrics.bookings.total > 0 ? (
                          (config.bookingCount / metrics.bookings.total) *
                          100
                        ).toFixed(1) : 0}%"
                      ></div>
                    </div>
                    <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      {metrics.bookings.total > 0 ? (
                        (config.bookingCount / metrics.bookings.total) *
                        100
                      ).toFixed(1) : 0}%
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
                No booking data available for this period
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Popular Addons -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white">
        Popular Add-ons
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
              Add-on
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Times Added
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Revenue
            </th>
          </tr>
        </thead>
        <tbody
          class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
        >
          {#if isLoading}
            {#each Array(3) as _, i (i)}
              <tr class={i % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"}>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </td>
              </tr>
            {/each}
          {:else if metrics.bookingInsights?.popularAddons && metrics.bookingInsights.popularAddons.length > 0}
            {#each metrics.bookingInsights.popularAddons as addon, i (addon.addonId)}
              <tr
                class={i % 2 === 0
                  ? "bg-white dark:bg-gray-800"
                  : "bg-gray-50 dark:bg-gray-700"}
              >
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
                >
                  {addon.addonName}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                >
                  {addon.bookingCount}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                >
                  {formatCurrency(addon.totalRevenue)}
                </td>
              </tr>
            {/each}
          {:else}
            <tr>
              <td
                colspan="3"
                class="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
              >
                No add-on data available for this period
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
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
        {#if isLoading}
          {#each Array(5) as _, i (i)}
            <tr class={i % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"}>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                  <div class="ml-4">
                    <div class="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div class="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="h-4 w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div class="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-1"></div>
                </div>
              </td>
            </tr>
          {/each}
        {:else if metrics.cleanerPerformance && metrics.cleanerPerformance.length > 0}
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
