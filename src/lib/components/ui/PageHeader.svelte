<!-- src/lib/components/ui/PageHeader.svelte -->
<script lang="ts">
  export let title: string;
  export let subtitle: string | undefined = undefined;
</script>

<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 class="font-heading text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
      {title}
    </h1>
    {#if subtitle}
      <p class="mt-1 text-gray-600 dark:text-gray-400">{subtitle}</p>
    {/if}
    <slot />
  </div>
  {#if $$slots.actions}
    <div class="flex flex-shrink-0 items-center gap-3">
      <slot name="actions" />
    </div>
  {/if}
</div>
