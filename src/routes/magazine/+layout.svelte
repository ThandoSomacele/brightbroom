<!-- src/routes/magazine/+layout.svelte -->
<script lang="ts">
  import { page } from "$app/stores";

  // Get the current user data
  $: user = $page.data.user;
</script>

<svelte:head>
  <title>
    {$page.url.pathname === "/magazine"
      ? "Magazine | BrightBroom"
      : `${$page.data.title || "Article"} | BrightBroom Magazine`}
  </title>
  <meta
    name="description"
    content={$page.data.description ||
      "Discover home organisation, cleaning tips, and lifestyle content for small spaces in South Africa."}
  />
</svelte:head>

<!-- Magazine content -->
<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <slot />
</div>
