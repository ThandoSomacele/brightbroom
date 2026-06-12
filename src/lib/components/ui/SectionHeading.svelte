<!-- src/lib/components/ui/SectionHeading.svelte -->
<script lang="ts">
  export let eyebrow: string | undefined = undefined;
  export let title: string;
  export let subtitle: string | undefined = undefined;
  export let align: "center" | "left" = "center";
</script>

<div class="mb-12 {align === 'center' ? 'text-center' : 'text-left'}">
  {#if eyebrow}
    <p class="section-eyebrow mb-2">{eyebrow}</p>
  {/if}
  <h2 class="section-title">{title}</h2>
  {#if subtitle}
    <p
      class="mt-4 text-lg text-gray-600 dark:text-gray-300 {align === 'center'
        ? 'mx-auto max-w-2xl'
        : 'max-w-2xl'}"
    >
      {subtitle}
    </p>
  {/if}
</div>
