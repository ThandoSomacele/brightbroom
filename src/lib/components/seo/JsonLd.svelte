<!-- src/lib/components/seo/JsonLd.svelte -->
<!--
  schema.org structured data in the page head. Svelte does not fill in {…}
  inside a <script> element written in markup, so the element is built as a
  string by jsonLdScript (which also escapes it) and rendered with {@html}.
-->
<script lang="ts">
  import { jsonLdScript, type JsonLd } from "$lib/seo/structured-data";

  let { data }: { data: JsonLd } = $props();
</script>

<svelte:head>
  {@html jsonLdScript(data)}
</svelte:head>
