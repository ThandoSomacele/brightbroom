<script lang="ts">
  export let count: number = 1;
</script>

{#each Array(count) as _, i (i)}
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div class="flex justify-between">
      <div class="space-y-2">
        <div class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div class="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
      <div class="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
    </div>
    <div class="mt-4 h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
  </div>
{/each}
