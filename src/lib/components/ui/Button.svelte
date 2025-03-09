<script lang="ts">
  export let variant: "primary" | "secondary" | "outline" | "ghost" = "primary";
  export let size: "sm" | "md" | "lg" = "md";
  export let type: "button" | "submit" | "reset" = "button";
  export let disabled = false;

  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variantStyles = {
    primary:
      "bg-primary text-white hover:bg-primary-600 focus:ring-primary-500",
    secondary:
      "bg-secondary text-white hover:bg-secondary-600 focus:ring-secondary-500",
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
</script>

<button {type} class={classNames} {disabled} on:click {...$$restProps}>
  <slot />
</button>
