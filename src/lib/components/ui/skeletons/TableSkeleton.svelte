<script lang="ts">
  export let rows: number = 5;
  export let columns: number = 4;
  export let showHeader: boolean = true;
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      {#if showHeader}
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            {#each Array(columns) as _, i (i)}
              <th class="px-6 py-3">
                <div class="h-3 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              </th>
            {/each}
          </tr>
        </thead>
      {/if}
      <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
        {#each Array(rows) as _, i (i)}
          <tr>
            {#each Array(columns) as _, j (j)}
              <td class="px-6 py-4">
                <div
                  class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  style="width: {60 + Math.random() * 40}%"
                ></div>
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
