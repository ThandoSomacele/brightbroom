<script lang="ts">
  type SkeletonVariant = 'text' | 'title' | 'avatar' | 'button' | 'card' | 'table-row' | 'chart';

  export let variant: SkeletonVariant = 'text';
  export let width: string = '';
  export let height: string = '';
  export let count: number = 1;
  export let className: string = '';
</script>

{#each Array(count) as _, i (i)}
  {#if variant === 'text'}
    <div
      class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse {className}"
      style={width ? `width: ${width}` : 'width: 100%'}
    ></div>
  {:else if variant === 'title'}
    <div
      class="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse {className}"
      style={width ? `width: ${width}` : 'width: 60%'}
    ></div>
  {:else if variant === 'avatar'}
    <div
      class="rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse {className}"
      style="width: {width || '40px'}; height: {height || '40px'}"
    ></div>
  {:else if variant === 'button'}
    <div
      class="h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse {className}"
      style={width ? `width: ${width}` : 'width: 100px'}
    ></div>
  {:else if variant === 'card'}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 {className}">
      <div class="flex justify-between">
        <div class="space-y-2 flex-1">
          <div class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div class="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div class="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
      </div>
      <div class="mt-4 h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
    </div>
  {:else if variant === 'table-row'}
    <tr class="border-b border-gray-200 dark:border-gray-700">
      <td class="px-6 py-4">
        <div class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </td>
      <td class="px-6 py-4">
        <div class="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </td>
      <td class="px-6 py-4">
        <div class="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </td>
      <td class="px-6 py-4">
        <div class="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </td>
    </tr>
  {:else if variant === 'chart'}
    <div class="w-full h-full flex flex-col justify-end p-4 {className}">
      <div class="flex items-end justify-between gap-2 h-40">
        {#each Array(10) as _, j (j)}
          <div
            class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-t animate-pulse"
            style="height: {20 + Math.random() * 60}%"
          ></div>
        {/each}
      </div>
      <div class="flex justify-between mt-2">
        <div class="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div class="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div class="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    </div>
  {/if}
{/each}
