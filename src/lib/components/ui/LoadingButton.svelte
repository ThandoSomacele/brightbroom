<!-- src/lib/components/ui/LoadingButton.svelte -->
<script lang="ts">
  import Button from "./Button.svelte";

  export let variant: "primary" | "secondary" | "outline" | "ghost" = "primary";
  export let size: "sm" | "md" | "lg" = "md";
  export let type: "button" | "submit" | "reset" = "button";
  export let disabled = false;
  export let href: string | undefined = undefined;
  export let loading = false;
  export let loadingText = "Loading...";

  // Forward all other props to the Button component
  export let onClick: () => void = undefined;
</script>

<Button
  {variant}
  {size}
  {type}
  disabled={disabled || loading}
  {href}
  on:click
  {...$$restProps}
>
  {#if loading}
    <svg
      class="mr-2 h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    {loadingText}
  {:else}
    <slot />
  {/if}
</Button>
