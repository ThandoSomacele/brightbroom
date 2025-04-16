<!-- src/lib/components/cleaner/EmptyState.svelte -->
<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  
  export let title = "No data found";
  export let message = "There's nothing here yet.";
  export let icon: any = undefined; // Lucide icon component
  export let buttonLabel: string | undefined = undefined;
  export let buttonHref: string | undefined = undefined;
  export let buttonVariant: "primary" | "secondary" | "outline" = "primary";
</script>

<div class="flex flex-col items-center justify-center py-12 px-4 text-center">
  {#if icon}
    <div class="mb-4 bg-gray-100 dark:bg-gray-700 p-4 rounded-full">
      <svelte:component this={icon} class="h-8 w-8 text-gray-500 dark:text-gray-400" />
    </div>
  {/if}
  
  <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
    {title}
  </h3>
  
  <p class="text-gray-500 dark:text-gray-400 max-w-md mb-6">
    {message}
  </p>
  
  {#if buttonLabel && buttonHref}
    <Button {buttonVariant} href={buttonHref}>
      {buttonLabel}
    </Button>
  {/if}
</div>
