<!-- src/lib/components/ui/EmptyState.svelte -->
<script lang="ts">
  export let icon: any = undefined;
  export let title: string;
  export let description: string | undefined = undefined;
</script>

<div
  class="flex animate-fade-in flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 px-6 py-12 text-center dark:border-gray-700"
>
  {#if icon}
    <div class="icon-chip mb-4 h-14 w-14">
      <svelte:component this={icon} size={28} />
    </div>
  {/if}
  <h3 class="font-heading text-lg font-semibold text-gray-900 dark:text-white">
    {title}
  </h3>
  {#if description}
    <p class="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
      {description}
    </p>
  {/if}
  {#if $$slots.default}
    <div class="mt-5">
      <slot />
    </div>
  {/if}
</div>
