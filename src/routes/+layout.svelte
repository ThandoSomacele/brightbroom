<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import Header from "$lib/components/Header.svelte";
  import LoadingIndicator from "$lib/components/ui/LoadingIndicator.svelte";
  import "../app.css";

  // Get user data passed from the layout server
  export let data;
  $: user = data.user;
</script>

<svelte:head>
  <meta
    name="description"
    content="Professional cleaning services on your schedule. Book online in minutes and get your space sparkling clean."
  />
</svelte:head>

<!-- Global loading indicator for page navigation -->
<LoadingIndicator />

<!-- Header with navigation -->
<Header {user} />

<!-- Page content -->
<main>
  <slot />
</main>

<!-- Footer -->
<footer class="bg-gray-50 py-8 dark:bg-gray-900">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="md:flex md:items-center md:justify-between">
      <div class="mb-6 md:mb-0">
        <span class="text-xl font-bold text-primary">BrightBroom</span>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          On-demand cleaning services
        </p>
      </div>

      <div class="flex space-x-6">
        <a
          href="/terms"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >Terms</a
        >
        <a
          href="/privacy"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >Privacy</a
        >
        <a
          href="/join/cleaner"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >Join</a
        >
        <a
          href="/contact"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >Contact</a
        >
      </div>
    </div>

    <div class="mt-8 border-t border-gray-200 pt-8 dark:border-gray-700">
      <p class="text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} BrightBroom. All rights reserved.
      </p>
    </div>
  </div>
</footer>
