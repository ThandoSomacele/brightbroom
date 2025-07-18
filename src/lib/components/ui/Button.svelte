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
  
  // Allow custom classes to be passed in
  let customClass = "";
  export { customClass as class };
  
  // Track if this specific button was clicked
  let wasClicked = false;
  
  // Track if this specific href is being navigated to AND this button was clicked
  $: isNavigatingToHref = $navigating && href && $navigating.to?.url.pathname === href && wasClicked;
  $: isLoading = loading || isNavigatingToHref;
  
  // Reset clicked state when navigation completes
  $: if (!$navigating) {
    wasClicked = false;
  }
  
  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    
  const variantStyles = {
    primary:
      "bg-primary text-white hover:bg-primary-600 hover:text-white focus:ring-primary-500",
    secondary:
      "bg-secondary text-white hover:bg-secondary-600 hover:text-white focus:ring-secondary-500",
    outline:
      "border border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-primary-500",
    ghost:
      "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-primary-500",
  };
  
  const sizeStyles = {
    sm: "h-9 px-3 py-1 text-sm",
    md: "h-10 px-4 py-2",
    lg: "h-11 px-6 py-2.5 text-lg",
  };
  
  // Properly merge all classes
  $: classNames = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    customClass
  ].filter(Boolean).join(' ');
  
  // Handle client-side navigation
  function handleClick(event: MouseEvent) {
    // Don't navigate if disabled
    if (disabled) {
      event.preventDefault();
      return;
    }
    
    if (!href || !useNavigation) return;
    
    // Allow opening in new tab with modifier keys
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    
    event.preventDefault();
    wasClicked = true;
    goto(href);
  }
  
  // Filter out class from restProps to avoid duplication
  $: restProps = Object.fromEntries(
    Object.entries($$restProps).filter(([key]) => key !== 'class')
  );
</script>

{#if href}
  <a
    {href}
    class={classNames}
    class:pointer-events-none={disabled}
    class:cursor-not-allowed={disabled}
    role="button"
    tabindex={disabled ? -1 : 0}
    aria-disabled={disabled}
    on:click={handleClick}
    data-sveltekit-preload-data={disabled ? "off" : "hover"}
    {...restProps}
  >
    {#if isLoading}
      <svg
        class="mr-2 h-4 w-4 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        data-testid="loading-spinner"
        aria-label="Loading, please wait"
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
  <button 
    {type} 
    class={classNames} 
    {disabled} 
    aria-disabled={disabled}
    on:click 
    {...restProps}
  >
    {#if isLoading}
      <svg
        class="mr-2 h-4 w-4 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        data-testid="loading-spinner"
        aria-label="Loading, please wait"
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
