<!-- src/routes/admin/cleaners/new/+page.svelte -->
<!-- This page redirects to /admin/applications/new via the server load function. -->
<!-- This fallback is only shown if the redirect fails for some reason. -->
<script lang="ts">
  import { brand } from "$lib/config/brand";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  onMount(() => {
    goto("/admin/applications/new");
  });
</script>

<svelte:head>
  <title>Add Cleaner | {brand.name} Admin</title>
</svelte:head>

<div class="flex flex-col items-center justify-center py-12 text-center">
  <p class="text-gray-600 dark:text-gray-400 mb-4">
    Redirecting to the application form...
  </p>
  <a
    href="/admin/applications/new"
    class="text-primary-700 hover:text-primary-800 underline"
  >
    Click here if you are not redirected
  </a>
</div>
