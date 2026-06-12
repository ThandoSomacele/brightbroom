<!-- src/lib/components/ui/StatCard.svelte -->
<script lang="ts">
  import { TrendingDown, TrendingUp } from "lucide-svelte";

  export let label: string;
  export let value: string;
  export let icon: any = undefined;
  export let accent: "primary" | "secondary" | "green" | "red" | "amber" = "primary";
  export let trend: { value: string; direction: "up" | "down" | "flat" } | undefined =
    undefined;
  export let href: string | undefined = undefined;

  // Literal class maps so Tailwind's JIT sees the full class names
  const chipAccents = {
    primary: "bg-primary-100 text-primary dark:bg-primary-900/30",
    secondary: "bg-secondary-100 text-secondary dark:bg-secondary-900/30",
    green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  };

  const trendColors = {
    up: "text-green-600 dark:text-green-400",
    down: "text-red-600 dark:text-red-400",
    flat: "text-gray-500 dark:text-gray-400",
  };
</script>

<svelte:element
  this={href ? "a" : "div"}
  {href}
  class="group card card-hover block p-6"
>
  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p class="mt-1 font-heading text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
      {#if trend}
        <p class="mt-1 flex items-center gap-1 text-sm {trendColors[trend.direction]}">
          {#if trend.direction === "up"}
            <TrendingUp size={14} />
          {:else if trend.direction === "down"}
            <TrendingDown size={14} />
          {/if}
          {trend.value}
        </p>
      {/if}
    </div>
    {#if icon}
      <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full transition-colors duration-200 {chipAccents[accent]}">
        <svelte:component this={icon} size={24} />
      </div>
    {/if}
  </div>
  <slot />
</svelte:element>
