<script lang="ts">
  import LegalDocument from "$lib/components/legal/LegalDocument.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<LegalDocument doc={data.doc} />
