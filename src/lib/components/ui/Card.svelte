<!-- src/lib/components/ui/Card.svelte -->
<script lang="ts">
  export let hover = false;
  export let padding: "none" | "sm" | "md" | "lg" = "md";
  export let as: "div" | "section" | "article" | "li" = "div";
  export let href: string | undefined = undefined;

  // Allow custom classes to be passed in
  let customClass = "";
  export { customClass as class };

  const paddings = {
    none: "p-0 overflow-hidden",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  // Links are always interactive, so they get hover elevation
  $: isHover = hover || !!href;

  $: classNames = [
    "group card block",
    isHover ? "card-hover" : "",
    paddings[padding],
    customClass,
  ]
    .filter(Boolean)
    .join(" ");
</script>

{#if href}
  <a {href} class={classNames} {...$$restProps}>
    <slot />
  </a>
{:else}
  <svelte:element this={as} class={classNames} {...$$restProps}>
    <slot />
  </svelte:element>
{/if}
