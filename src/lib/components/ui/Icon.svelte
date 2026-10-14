<!--
  Phosphor icon (font-based, @phosphor-icons/web). Duotone by default; the
  weight's stylesheet must be imported once, see src/routes/+layout.svelte.
  `accent` paints the duotone back layer orange; `flat` hides it (outline only).
  Pass `label` when the icon carries meaning on its own; otherwise it is
  hidden from assistive tech.
-->
<script lang="ts">
  type Weight = "duotone" | "regular" | "bold" | "fill";

  let {
    name,
    size = 20,
    weight = "duotone",
    accent = false,
    flat = false,
    label,
    class: className = "",
    ...rest
  }: {
    name: string;
    size?: number;
    weight?: Weight;
    accent?: boolean;
    /** Hide the duotone back layer, leaving the plain outline */
    flat?: boolean;
    label?: string;
    class?: string;
    [attr: string]: unknown;
  } = $props();

  let weightClass = $derived(weight === "regular" ? "ph" : `ph-${weight}`);
</script>

<i
  class="{weightClass} ph-{name} inline-block shrink-0 leading-none {accent ? 'ph-accent' : ''} {flat ? 'ph-flat' : ''} {className}"
  style="font-size: {size}px"
  aria-hidden={label ? undefined : "true"}
  aria-label={label}
  role={label ? "img" : undefined}
  {...rest}
></i>
