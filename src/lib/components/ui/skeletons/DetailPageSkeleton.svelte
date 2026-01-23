<!-- src/lib/components/ui/skeletons/DetailPageSkeleton.svelte -->
<script lang="ts">
  import Skeleton from '../Skeleton.svelte';

  export let variant: 'booking' | 'cleaner' | 'user' | 'application' | 'pricing' | 'reports' = 'booking';
</script>

{#if variant === 'booking'}
  <!-- Booking detail skeleton -->
  <div class="mb-6 flex items-center">
    <Skeleton variant="avatar" class="w-6 h-6 mr-3" />
    <Skeleton variant="title" class="w-48" />
  </div>

  <div class="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-3">
        <Skeleton variant="button" class="w-24 h-8" />
        <Skeleton variant="text" class="w-32" />
      </div>
      <div class="flex gap-2 mt-4 sm:mt-0">
        <Skeleton variant="button" class="w-28" />
        <Skeleton variant="button" class="w-32" />
        <Skeleton variant="button" class="w-36" />
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 space-y-6">
      {#each [1, 2, 3, 4] as _}
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <Skeleton variant="title" class="w-40 mb-4" />
          <div class="space-y-4">
            {#each [1, 2, 3] as _inner}
              <div class="flex items-start">
                <Skeleton variant="avatar" class="w-5 h-5 mr-3 rounded" />
                <div class="flex-1">
                  <Skeleton variant="text" class="w-24 mb-1" />
                  <Skeleton variant="text" class="w-48" />
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>

    <div class="space-y-6">
      {#each [1, 2, 3] as _}
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <Skeleton variant="title" class="w-32 mb-4" />
          <div class="space-y-3">
            {#each [1, 2, 3, 4] as _inner}
              <div class="flex justify-between items-center">
                <Skeleton variant="text" class="w-24" />
                <Skeleton variant="text" class="w-20" />
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>

{:else if variant === 'cleaner'}
  <!-- Cleaner detail skeleton -->
  <div class="mb-6 flex items-center">
    <Skeleton variant="avatar" class="w-6 h-6 mr-3" />
    <Skeleton variant="title" class="w-40" />
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="space-y-6">
      {#each [1, 2] as _}
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div class="flex justify-between items-center mb-4">
            <Skeleton variant="title" class="w-36" />
            <Skeleton variant="button" class="w-16 h-8" />
          </div>
          <div class="space-y-4">
            {#each [1, 2, 3, 4] as _inner}
              <div class="flex items-center">
                <Skeleton variant="avatar" class="w-5 h-5 mr-2 rounded" />
                <div>
                  <Skeleton variant="text" class="w-16 mb-1" />
                  <Skeleton variant="text" class="w-32" />
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>

    <div class="lg:col-span-2 space-y-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <Skeleton variant="title" class="w-24 mb-4" />
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          {#each [1, 2, 3, 4] as _}
            <div class="text-center">
              <Skeleton variant="text" class="w-16 mx-auto mb-2" />
              <Skeleton variant="title" class="w-20 mx-auto" />
            </div>
          {/each}
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <Skeleton variant="title" class="w-32 mb-4" />
        <div class="space-y-3">
          {#each [1, 2, 3] as _}
            <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <Skeleton variant="text" class="w-24" />
              <Skeleton variant="button" class="w-20 h-6" />
              <Skeleton variant="text" class="w-16" />
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>

{:else if variant === 'user'}
  <!-- User detail skeleton -->
  <div class="mb-6 flex items-center">
    <Skeleton variant="avatar" class="w-6 h-6 mr-3" />
    <Skeleton variant="title" class="w-36" />
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 space-y-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <Skeleton variant="title" class="w-32 mb-4" />
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {#each [1, 2, 3, 4] as _}
            <div>
              <Skeleton variant="text" class="w-20 mb-1" />
              <Skeleton variant="text" class="w-36" />
            </div>
          {/each}
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <Skeleton variant="title" class="w-28 mb-4" />
        <div class="space-y-3">
          {#each [1, 2, 3] as _}
            <div class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded">
              <Skeleton variant="text" class="w-32" />
              <Skeleton variant="button" class="w-20 h-6" />
            </div>
          {/each}
        </div>
      </div>
    </div>

    <div class="space-y-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <Skeleton variant="title" class="w-20 mb-4" />
        <div class="space-y-4">
          {#each [1, 2, 3, 4] as _}
            <div>
              <Skeleton variant="text" class="w-24 mb-1" />
              <Skeleton variant="title" class="w-16" />
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>

{:else if variant === 'application'}
  <!-- Application detail skeleton -->
  <div class="mb-6 flex items-center">
    <Skeleton variant="avatar" class="w-6 h-6 mr-3" />
    <Skeleton variant="title" class="w-44" />
  </div>

  <div class="mb-6 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <Skeleton variant="button" class="w-24 h-8" />
      <Skeleton variant="text" class="w-40" />
    </div>
  </div>

  <div class="mb-6">
    <Skeleton variant="button" class="w-full h-12" />
  </div>

  <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <div class="lg:col-span-2 space-y-6">
      {#each [1, 2, 3] as _}
        <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <Skeleton variant="title" class="w-40 mb-4" />
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each [1, 2, 3, 4] as _inner}
              <div>
                <Skeleton variant="text" class="w-20 mb-1" />
                <Skeleton variant="text" class="w-36" />
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>

    <div class="space-y-6">
      <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <Skeleton variant="title" class="w-32 mb-4" />
        <Skeleton class="h-24 w-full mb-3" />
        <Skeleton variant="button" class="w-full" />
      </div>
    </div>
  </div>

{:else if variant === 'pricing'}
  <!-- Pricing page skeleton -->
  <div class="space-y-8">
    <div>
      <Skeleton variant="title" class="w-48 mb-2" />
      <Skeleton variant="text" class="w-72" />
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-8">
      {#each [1, 2, 3] as _}
        <div>
          <div class="flex items-center gap-2 mb-4">
            <Skeleton variant="avatar" class="w-5 h-5 rounded" />
            <Skeleton variant="title" class="w-48" />
          </div>
          <div class="grid gap-4 sm:grid-cols-3">
            {#each [1, 2, 3] as _inner}
              <div>
                <Skeleton variant="text" class="w-24 mb-1" />
                <Skeleton class="h-10 w-full" />
              </div>
            {/each}
          </div>
        </div>
      {/each}

      <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <Skeleton variant="button" class="w-48" />
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-2">
          <Skeleton variant="avatar" class="w-5 h-5 rounded" />
          <Skeleton variant="title" class="w-32" />
        </div>
        <Skeleton variant="button" class="w-24" />
      </div>

      <div class="space-y-3">
        {#each [1, 2, 3, 4] as _}
          <div class="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
            <Skeleton variant="text" class="w-32" />
            <Skeleton variant="text" class="w-16" />
            <Skeleton variant="text" class="w-16" />
            <Skeleton variant="button" class="w-16 h-6" />
            <div class="flex gap-2">
              <Skeleton variant="avatar" class="w-4 h-4 rounded" />
              <Skeleton variant="avatar" class="w-4 h-4 rounded" />
              <Skeleton variant="avatar" class="w-4 h-4 rounded" />
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

{:else if variant === 'reports'}
  <!-- Reports page skeleton -->
  <div class="mb-6">
    <Skeleton variant="title" class="w-24 mb-2" />
    <Skeleton variant="text" class="w-64" />
  </div>

  <div class="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
    <div class="flex flex-wrap gap-4">
      <Skeleton variant="button" class="w-32" />
      <Skeleton class="h-10 w-40" />
      <Skeleton class="h-10 w-40" />
      <Skeleton variant="button" class="w-24" />
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
    {#each [1, 2, 3, 4] as _}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <Skeleton variant="text" class="w-24 mb-2" />
        <Skeleton variant="title" class="w-20 mb-1" />
        <Skeleton variant="text" class="w-16" />
      </div>
    {/each}
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    {#each [1, 2] as _}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <Skeleton variant="title" class="w-32 mb-4" />
        <Skeleton class="h-64 w-full" />
      </div>
    {/each}
  </div>

  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
    <Skeleton variant="title" class="w-40 mb-4" />
    <div class="space-y-3">
      {#each [1, 2, 3, 4, 5] as _}
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <Skeleton variant="text" class="w-24" />
          <Skeleton variant="text" class="w-16" />
          <Skeleton variant="text" class="w-20" />
        </div>
      {/each}
    </div>
  </div>
{/if}
