<script lang="ts">
  export let type: 'bar' | 'line' = 'bar';
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
  <div class="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
  <div class="h-64">
    <div class="w-full h-full flex flex-col justify-end">
      <div class="flex items-end justify-between gap-2 h-48 px-4">
        {#each Array(12) as _, i (i)}
          {#if type === 'bar'}
            <div
              class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-t animate-pulse"
              style="height: {15 + Math.random() * 70}%"
            ></div>
          {:else}
            <div class="flex-1 flex items-end justify-center">
              <div class="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
            </div>
          {/if}
        {/each}
      </div>
      <div class="flex justify-between mt-4 px-4">
        <div class="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div class="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div class="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    </div>
  </div>
</div>
