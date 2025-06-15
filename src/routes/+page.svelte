<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { page } from "$app/stores";
  import Button from "$lib/components/ui/Button.svelte";
  import heroImage from "$lib/image-assets/hero.webp";
  import { Building, Home, HousePlus } from "lucide-svelte";

  // Get user data from loader
  export let data;

  $: user = data.user;

  const siteUrl = import.meta.env.VITE_SITE_URL || "https://brightbroom.com";
  const ogImageUrl = `${siteUrl}/images/brightbroom-og-image.jpg`;
</script>

<svelte:head>
  <title>BrightBroom | On-demand Cleaning Services</title>
  <meta
    name="description"
    content="Professional cleaning services on your schedule. Book online in minutes and get your space sparkling clean."
  />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content={$page.url.href} />
  <meta
    property="og:title"
    content="BrightBroom | On-demand Cleaning Services"
  />
  <meta
    property="og:description"
    content="Professional cleaning services on your schedule. Book online in minutes and get your space sparkling clean."
  />
  <meta property="og:image" content={ogImageUrl} />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content={$page.url.href} />
  <meta
    name="twitter:title"
    content="BrightBroom | On-demand Cleaning Services"
  />
  <meta
    name="twitter:description"
    content="Professional cleaning services on your schedule. Book online in minutes and get your space sparkling clean."
  />
  <meta name="twitter:image" content={ogImageUrl} />
</svelte:head>

<!-- Hero section -->
<section class="bg-white py-16 dark:bg-gray-800">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="grid gap-8 md:grid-cols-2 md:gap-12">
      <div class="flex flex-col justify-center">
        <h1
          class="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white md:text-5xl"
        >
          Professional cleaning services on your schedule
        </h1>
        <p class="mb-8 text-lg text-gray-600 dark:text-gray-300">
          BrightBroom connects you with professional cleaners for your home or
          office. Book online in minutes and get your space sparkling clean.
        </p>
        <div class="flex flex-col gap-3 sm:flex-row">
          <Button href="/book" variant="primary" size="lg">Book Now</Button>
          <Button href="/services" variant="outline" size="lg">
            View Services
          </Button>
        </div>
      </div>
      <div class="relative">
        <img
          src={heroImage}
          alt="Clean modern home interior"
          class="h-full w-full rounded-lg object-cover shadow-lg"
        />
        <div
          class="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-transparent"
        ></div>
      </div>
    </div>
  </div>
</section>

<!-- Features section -->
<section class="bg-gray-50 py-16 dark:bg-gray-900">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="text-center">
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
        Why choose BrightBroom?
      </h2>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-300">
        Professional cleaning made simple and convenient
      </p>
    </div>

    <div class="mt-12 grid gap-8 md:grid-cols-3">
      <div class="text-center">
        <div
          class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30"
        >
          <Home size={32} class="text-primary" />
        </div>
        <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          Trusted Professionals
        </h3>
        <p class="text-gray-600 dark:text-gray-300">
          All our cleaners are thoroughly vetted, insured, and trained to
          deliver exceptional service.
        </p>
      </div>

      <div class="text-center">
        <div
          class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30"
        >
          <HousePlus size={32} class="text-primary" />
        </div>
        <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          Flexible Scheduling
        </h3>
        <p class="text-gray-600 dark:text-gray-300">
          Book your cleaning service at a time that works for you. Same-day and
          recurring bookings available.
        </p>
      </div>

      <div class="text-center">
        <div
          class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30"
        >
          <Building size={32} class="text-primary" />
        </div>
        <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          Satisfaction Guaranteed
        </h3>
        <p class="text-gray-600 dark:text-gray-300">
          We stand behind our work. If you're not happy with the service, we'll
          make it right.
        </p>
      </div>
    </div>
  </div>
</section>

<!-- Our Services section -->
<section class="bg-white py-16 dark:bg-gray-800">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="text-center">
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
        Our Services
      </h2>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-300">
        Choose the perfect cleaning package for your needs
      </p>
    </div>

    <div class="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <!-- Regular Cleaning -->
      <div
        class="rounded-lg bg-gray-50 p-6 dark:bg-gray-700 hover:shadow-md transition-shadow"
      >
        <div class="mb-4">
          <Home size={40} class="text-primary" />
        </div>
        <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          Regular Cleaning
        </h3>
        <p class="mb-4 text-gray-600 dark:text-gray-300">
          Complete home cleaning including all rooms, bathrooms, and kitchen.
        </p>
        <Button href="/book" variant="outline" size="sm" class="w-full">
          Book Now
        </Button>
      </div>

      <!-- Extended Cleaning -->
      <div
        class="rounded-lg bg-gray-50 p-6 dark:bg-gray-700 hover:shadow-md transition-shadow"
      >
        <div class="mb-4">
          <HousePlus size={40} class="text-primary" />
        </div>
        <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          Extended Cleaning
        </h3>
        <p class="mb-4 text-gray-600 dark:text-gray-300">
          Deep clean including inside ovens, fridges, and detailed attention to
          all areas.
        </p>
        <Button href="/book" variant="outline" size="sm" class="w-full">
          Book Now
        </Button>
      </div>

      <!-- Laundry & Ironing -->
      <div
        class="rounded-lg bg-gray-50 p-6 dark:bg-gray-700 hover:shadow-md transition-shadow"
      >
        <div class="mb-4">
          <Home size={40} class="text-primary" />
        </div>
        <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          Laundry & Ironing
        </h3>
        <p class="mb-4 text-gray-600 dark:text-gray-300">
          Regular cleaning plus washing, drying, and ironing your clothes.
        </p>
        <Button href="/book" variant="outline" size="sm" class="w-full">
          Book Now
        </Button>
      </div>

      <!-- Office Cleaning -->
      <div
        class="rounded-lg bg-gray-50 p-6 dark:bg-gray-700 hover:shadow-md transition-shadow"
      >
        <div class="mb-4">
          <Building size={40} class="text-primary" />
        </div>
        <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          Office Cleaning
        </h3>
        <p class="mb-4 text-gray-600 dark:text-gray-300">
          Professional office and commercial space cleaning services.
        </p>
        <Button href="/book" variant="outline" size="sm" class="w-full">
          Book Now
        </Button>
      </div>
    </div>
  </div>
</section>

<!-- CTA section -->
<section class="bg-primary py-16">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="text-center">
      <h2 class="text-3xl font-bold text-white">
        Ready to get your space cleaned?
      </h2>
      <p class="mt-4 text-lg text-primary-100">
        Book your cleaning service in just a few clicks. Professional cleaners,
        competitive prices.
      </p>
      <div class="mt-8">
        <Button href="/book" variant="secondary" size="lg">
          Book Cleaning Now
        </Button>
      </div>
    </div>
  </div>
</section>
