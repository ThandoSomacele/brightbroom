<script lang="ts">
  import { navigating } from '$app/stores';
  import { goto } from '$app/navigation';
  
  export let variant: "primary" | "secondary" | "outline" | "ghost" = "primary";
  export let size: "sm" | "md" | "lg" = "md";
  export let type: "button" | "submit" | "reset" = "button";
  export let disabled = false;
  export let href: string | undefined = undefined;
  export let loading = false;
  export let useNavigation = true; // Whether to use client-side navigation

  // Track if this specific href is being navigated to
  $: isNavigatingToHref = $navigating && href && $navigating.to?.url.pathname === href;
  $: isLoading = loading || isNavigatingToHref;

  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variantStyles = {
    primary:
      "bg-primary text-white hover:bg-primary-600 hover:text-white focus:ring-primary-500",
    secondary:
      "bg-secondary text-white hover:bg-secondary-600 hover:text-white focus:ring-secondary-500",
    outline:
      "border border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100",
    ghost:
      "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100",
  };

  const sizeStyles = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 py-2",
    lg: "h-11 px-6 text-lg",
  };

  $: classNames = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`;
  
  // Handle client-side navigation
  function handleClick(event: MouseEvent) {
    if (!href || !useNavigation) return;
    
    // Allow opening in new tab with modifier keys
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    
    event.preventDefault();
    goto(href);
  }
</script>

{#if href}
  <a
    {href}
    class={classNames}
    class:opacity-50={disabled}
    role="button"
    tabindex={disabled ? -1 : 0}
    on:click={handleClick}
    data-sveltekit-preload-data="hover"
    {...$$restProps}
  >
    {#if isLoading}
      <svg
        class="mr-2 h-4 w-4 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        data-testid="loading-spinner"
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
    {/if}
    <slot />
  </a>
{:else}
  <button {type} class={classNames} {disabled} on:click {...$$restProps}>
    {#if isLoading}
      <svg
        class="mr-2 h-4 w-4 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        data-testid="loading-spinner"
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
    {/if}
    <slot />
  </button>
{/if}
