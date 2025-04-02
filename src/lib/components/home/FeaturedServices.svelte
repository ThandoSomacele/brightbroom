<!-- src/lib/components/home/FeaturedServices.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import ServicesGrid from '$lib/components/services/ServicesGrid.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { loadServices, services } from '$lib/services';

  // Load services on mount
  onMount(async () => {
    await loadServices();
  });
</script>

<!-- Services section -->
<section class="bg-gray-50 py-16 dark:bg-gray-900">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="mb-12 text-center">
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
        Our Services
      </h2>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-300">
        Choose the perfect cleaning package for your needs
      </p>
    </div>

    <!-- Featured services grid (limited to 3) -->
    <ServicesGrid maxItems={3} />

    <div class="mt-12 text-center">
      <Button variant="primary" href="/services">View All Services</Button>
    </div>
  </div>
</section>
