<!-- src/lib/components/marketing/DemoNotice.svelte -->
<!--
  On brightbroom.com the customer pages (/demo, /services, /book, /join/cleaner)
  are the live demo of what a cleaning company's customers or cleaners see. This
  says so. Renders nothing on a company's own site.
-->
<script lang="ts">
  import { brand, isSingleCompany } from "$lib/config/brand";

  let { what = "page" }: { what?: string } = $props();
</script>

{#if !isSingleCompany}
  <div class="border-b border-primary-200 bg-primary-50 px-4 py-3 text-center text-sm text-primary-900 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-100">
    Live demo: this is the {what} your customers would see, with your name, logo and colours.
    <a href="/" class="ml-1 font-semibold underline hover:no-underline">{brand.name} for cleaning companies</a>
  </div>
{/if}
