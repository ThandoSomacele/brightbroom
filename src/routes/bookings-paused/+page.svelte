<!-- src/routes/bookings-paused/+page.svelte -->
<script lang="ts">
  import { brand } from "$lib/config/brand";
  import Icon from "$lib/components/ui/Icon.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  </script>

<svelte:head>
  <title>Bookings Paused | {brand.name}</title>
  <meta
    name="description"
    content="{brand.name} bookings are briefly paused while we onboard and train our cleaning team. Join as a cleaner or get notified when we relaunch."
  />
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="flex min-h-[70vh] items-center justify-center px-4 py-16">
  <div class="w-full max-w-xl text-center">
    <div
      class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30"
    >
      <Icon name="sparkle" size={32} class="text-primary-700" />
    </div>

    <h1 class="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
      We're getting our team ready
    </h1>

    <p class="mb-8 text-lg text-gray-600 dark:text-gray-300">
      Bookings are briefly paused while we onboard and train our professional
      cleaning team, so that every clean meets the standard you deserve. We'll
      be back very soon.
    </p>

    <div class="flex flex-col justify-center gap-4 sm:flex-row">
      <Button href="/join/cleaner" variant="primary" size="lg">
        <Icon name="users" size={20} class="mr-2" />
        Join as a cleaner
      </Button>
      <Button href="/contact" variant="outline" size="lg">
        <Icon name="envelope-simple" size={20} class="mr-2" />
        Get notified when we relaunch
      </Button>
    </div>

    <p class="mt-8 text-sm text-gray-500 dark:text-gray-400">
      Already booked with us? We'll be in touch about your booking directly.
    </p>
  </div>
</div>
