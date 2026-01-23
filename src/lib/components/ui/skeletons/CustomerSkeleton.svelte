<!-- src/lib/components/ui/skeletons/CustomerSkeleton.svelte -->
<script lang="ts">
  import Skeleton from '../Skeleton.svelte';

  export let variant: 'profile' | 'bookings' | 'cleanerDashboard' | 'earnings' | 'bookingDetail' | 'magazineList' | 'magazineArticle' = 'profile';
</script>

{#if variant === 'profile'}
  <!-- Profile page skeleton -->
  <div class="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
    <div class="mx-auto max-w-6xl">
      <!-- Profile header -->
      <div class="mb-8">
        <Skeleton variant="title" class="w-32 h-9 mb-2" />
        <Skeleton variant="text" class="w-64" />
      </div>

      <!-- Main content grid -->
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <!-- Left column: User info -->
        <div>
          <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <div class="mb-6 flex items-center">
              <Skeleton variant="avatar" class="h-16 w-16" />
              <div class="ml-4">
                <Skeleton variant="title" class="w-32 mb-1" />
                <Skeleton variant="text" class="w-40" />
              </div>
            </div>

            <div class="mb-6 border-t border-gray-200 pt-6 dark:border-gray-700">
              <Skeleton variant="title" class="w-40 mb-3" />
              <div class="space-y-3">
                {#each [1, 2, 3] as _}
                  <div>
                    <Skeleton variant="text" class="w-16 mb-1" />
                    <Skeleton variant="text" class="w-28" />
                  </div>
                {/each}
              </div>
            </div>

            <div class="space-y-3">
              {#each [1, 2, 3] as _}
                <Skeleton variant="button" class="w-full h-10" />
              {/each}
            </div>
          </div>
        </div>

        <!-- Right column: Bookings and quick actions -->
        <div class="lg:col-span-2">
          <!-- Quick Actions -->
          <div class="mb-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <Skeleton variant="title" class="w-32 mb-4" />
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {#each [1, 2, 3] as _}
                <Skeleton class="h-32 w-full rounded-lg" />
              {/each}
            </div>
          </div>

          <!-- Upcoming Bookings -->
          <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-between">
              <Skeleton variant="title" class="w-40" />
              <Skeleton variant="button" class="w-20 h-8" />
            </div>

            <div class="space-y-4">
              {#each [1, 2, 3] as _}
                <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <div class="flex items-start justify-between">
                    <div class="space-y-2">
                      <Skeleton variant="title" class="w-32" />
                      <Skeleton variant="text" class="w-48" />
                      <Skeleton variant="text" class="w-40" />
                    </div>
                    <div class="text-right">
                      <Skeleton variant="button" class="w-20 h-6 mb-2" />
                      <Skeleton variant="title" class="w-16" />
                    </div>
                  </div>
                  <div class="mt-3 flex justify-end">
                    <Skeleton variant="button" class="w-28 h-8" />
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

{:else if variant === 'bookings'}
  <!-- Bookings list skeleton -->
  <div class="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
    <div class="mx-auto max-w-6xl">
      <!-- Page header -->
      <div class="mb-6 flex items-center">
        <Skeleton variant="button" class="w-10 h-10 mr-2" />
        <Skeleton variant="title" class="w-36 h-9" />
      </div>

      <!-- Filters and actions -->
      <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div class="space-y-3">
          <div class="flex flex-wrap gap-2">
            <Skeleton variant="text" class="w-12 h-10" />
            {#each [1, 2, 3] as _}
              <Skeleton variant="button" class="w-20 h-10 rounded-full" />
            {/each}
          </div>
          <div class="flex flex-wrap gap-2">
            <Skeleton variant="text" class="w-12 h-10" />
            {#each [1, 2, 3, 4] as _}
              <Skeleton variant="button" class="w-24 h-10 rounded-full" />
            {/each}
          </div>
        </div>
        <Skeleton variant="button" class="w-44 h-10" />
      </div>

      <!-- Bookings list -->
      <div class="space-y-6">
        {#each [1, 2, 3, 4] as _}
          <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <div class="flex flex-wrap justify-between gap-4">
              <!-- Left column: Booking details -->
              <div class="flex-1">
                <div class="mb-4 flex items-center">
                  <Skeleton variant="button" class="w-24 h-7 rounded-full" />
                </div>
                <Skeleton variant="text" class="w-56 mb-2" />
                <Skeleton variant="title" class="w-64 mb-2" />
                <div class="space-y-2">
                  {#each [1, 2, 3] as _inner}
                    <div class="flex items-center">
                      <Skeleton variant="avatar" class="w-5 h-5 mr-2 rounded" />
                      <Skeleton variant="text" class="w-40" />
                    </div>
                  {/each}
                </div>
              </div>

              <!-- Right column: Price and actions -->
              <div class="flex flex-col items-end justify-between">
                <Skeleton variant="title" class="w-20 h-8 mb-4" />
                <div class="mt-4 flex flex-wrap gap-2">
                  <Skeleton variant="button" class="w-28 h-10" />
                  <Skeleton variant="button" class="w-20 h-10" />
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

{:else if variant === 'cleanerDashboard'}
  <!-- Cleaner dashboard skeleton -->
  <div class="space-y-6">
    <Skeleton variant="title" class="w-48 h-8" />

    <!-- Earnings Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      {#each [1, 2, 3] as _}
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <Skeleton variant="avatar" class="w-12 h-12" />
            <div class="ml-5">
              <Skeleton variant="text" class="w-24 mb-2" />
              <Skeleton variant="title" class="w-28" />
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Upcoming Bookings -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <Skeleton variant="title" class="w-40" />
      </div>

      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        {#each [1, 2, 3, 4, 5] as _}
          <div class="p-6">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between">
              <div class="space-y-3">
                <div class="flex items-start">
                  <Skeleton variant="avatar" class="w-5 h-5 mr-2 rounded" />
                  <div>
                    <Skeleton variant="text" class="w-40 mb-1" />
                    <Skeleton variant="text" class="w-20" />
                  </div>
                </div>
                <div class="flex items-start">
                  <Skeleton variant="avatar" class="w-5 h-5 mr-2 rounded" />
                  <Skeleton variant="text" class="w-48" />
                </div>
                <div class="flex items-start">
                  <Skeleton variant="avatar" class="w-5 h-5 mr-2 rounded" />
                  <Skeleton variant="text" class="w-32" />
                </div>
              </div>

              <div class="mt-4 md:mt-0 md:ml-4 flex flex-col items-end">
                <Skeleton variant="title" class="w-20 mb-1" />
                <Skeleton variant="text" class="w-24 mb-2" />
                <Skeleton variant="button" class="w-24 h-6" />
              </div>
            </div>
          </div>
        {/each}
      </div>

      <div class="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
        <Skeleton variant="button" class="w-28 h-5" />
      </div>
    </div>
  </div>

{:else if variant === 'earnings'}
  <!-- Earnings page skeleton -->
  <div class="space-y-6">
    <Skeleton variant="title" class="w-44 h-8" />

    <!-- Earnings Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {#each [1, 2, 3, 4] as _}
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <Skeleton variant="avatar" class="w-12 h-12" />
            <div class="ml-5">
              <Skeleton variant="text" class="w-24 mb-2" />
              <Skeleton variant="title" class="w-28" />
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Payout Schedule -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <Skeleton variant="title" class="w-36 mb-1" />
        <Skeleton variant="text" class="w-52" />
      </div>

      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        {#each [1, 2, 3, 4] as _}
          <div class="p-6 flex justify-between items-center">
            <div>
              <Skeleton variant="text" class="w-48 mb-1" />
              <Skeleton variant="text" class="w-20" />
            </div>
            <Skeleton variant="title" class="w-24" />
          </div>
        {/each}
      </div>
    </div>

    <!-- Monthly Earnings Chart -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <Skeleton variant="title" class="w-36" />
      </div>
      <div class="p-6">
        <Skeleton class="h-64 w-full" />
      </div>
    </div>

    <!-- Earnings History Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <Skeleton variant="title" class="w-36" />
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              {#each [1, 2, 3, 4, 5] as _}
                <th class="px-6 py-3">
                  <Skeleton variant="text" class="w-16" />
                </th>
              {/each}
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each [1, 2, 3, 4, 5] as _}
              <tr>
                <td class="px-6 py-4"><Skeleton variant="text" class="w-32" /></td>
                <td class="px-6 py-4">
                  <Skeleton variant="text" class="w-28 mb-1" />
                  <Skeleton variant="text" class="w-36" />
                </td>
                <td class="px-6 py-4"><Skeleton variant="text" class="w-28" /></td>
                <td class="px-6 py-4"><Skeleton variant="text" class="w-20" /></td>
                <td class="px-6 py-4"><Skeleton variant="button" class="w-16 h-5 rounded-full" /></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>

{:else if variant === 'bookingDetail'}
  <!-- Booking detail skeleton for customer -->
  <div class="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
    <div class="mx-auto max-w-4xl">
      <!-- Page header -->
      <div class="mb-6 flex items-center">
        <Skeleton variant="button" class="w-10 h-10 mr-2" />
        <Skeleton variant="title" class="w-44 h-9" />
      </div>

      <!-- Status and actions bar -->
      <div class="mb-6 bg-white rounded-lg p-4 shadow-md dark:bg-gray-800">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <Skeleton variant="button" class="w-24 h-8 rounded-full" />
            <Skeleton variant="text" class="w-36" />
          </div>
          <div class="flex gap-2">
            <Skeleton variant="button" class="w-24 h-10" />
            <Skeleton variant="button" class="w-28 h-10" />
          </div>
        </div>
      </div>

      <!-- Booking details -->
      <div class="space-y-6">
        {#each [1, 2, 3] as _}
          <div class="bg-white rounded-lg p-6 shadow-md dark:bg-gray-800">
            <Skeleton variant="title" class="w-32 mb-4" />
            <div class="space-y-4">
              {#each [1, 2, 3] as _inner}
                <div class="flex items-start">
                  <Skeleton variant="avatar" class="w-5 h-5 mr-3 rounded" />
                  <div>
                    <Skeleton variant="text" class="w-20 mb-1" />
                    <Skeleton variant="text" class="w-40" />
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

{:else if variant === 'magazineList'}
  <!-- Magazine list skeleton -->
  <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
    {#each [1, 2, 3, 4, 5, 6] as _}
      <div class="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
        <Skeleton class="w-full h-48" />
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-4">
            <Skeleton variant="text" class="w-24" />
            <Skeleton variant="text" class="w-20" />
          </div>
          <Skeleton variant="title" class="w-full h-6" />
          <Skeleton variant="text" class="w-full" />
          <Skeleton variant="text" class="w-3/4" />
          <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <Skeleton variant="button" class="w-24 h-6 rounded" />
            <Skeleton variant="text" class="w-20" />
          </div>
        </div>
      </div>
    {/each}
  </div>

{:else if variant === 'magazineArticle'}
  <!-- Magazine article skeleton (for related articles) -->
  <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
    {#each [1, 2, 3] as _}
      <div class="group">
        <Skeleton class="w-full h-48 rounded-lg mb-4" />
        <div class="space-y-2">
          <div class="flex items-center gap-4">
            <Skeleton variant="text" class="w-24" />
            <Skeleton variant="text" class="w-20" />
          </div>
          <Skeleton variant="title" class="w-full" />
          <Skeleton variant="text" class="w-full" />
          <Skeleton variant="button" class="w-24 h-6 rounded" />
        </div>
      </div>
    {/each}
  </div>
{/if}
