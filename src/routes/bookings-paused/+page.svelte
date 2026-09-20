<!-- src/routes/bookings-paused/+page.svelte -->
<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte";
  import { Sparkles, Users, Mail } from "lucide-svelte";
</script>

<svelte:head>
  <title>Bookings Paused | BrightBroom</title>
  <meta
    name="description"
    content="BrightBroom bookings are briefly paused while we onboard and train our cleaning team. Join as a cleaner or get notified when we relaunch."
  />
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="flex min-h-[70vh] items-center justify-center px-4 py-16">
  <div class="w-full max-w-xl text-center">
    <div
      class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30"
    >
      <Sparkles class="h-8 w-8 text-primary" />
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
        <Users class="mr-2 h-5 w-5" />
        Join as a cleaner
      </Button>
      <Button href="/contact" variant="outline" size="lg">
        <Mail class="mr-2 h-5 w-5" />
        Get notified when we relaunch
      </Button>
    </div>

    <p class="mt-8 text-sm text-gray-500 dark:text-gray-400">
      Already booked with us? We'll be in touch about your booking directly.
    </p>
  </div>
</div>
