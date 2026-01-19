<!-- src/routes/services/+page.svelte -->
<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import { Clock, Home, Sparkles, CheckCircle, Building2, MessageSquare } from 'lucide-svelte';
</script>

<svelte:head>
  <title>Cleaning Services | BrightBroom</title>
  <meta name="description" content="Book professional home cleaning services in Gauteng. Build your own booking - choose your hours, rooms, and add-ons. Trusted cleaners, flexible scheduling." />

  <!-- Open Graph -->
  <meta property="og:title" content="Professional Cleaning Services | BrightBroom" />
  <meta property="og:description" content="Build your own cleaning booking. Choose hours, rooms, and add-ons for a personalised clean." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://brightbroom.com/services" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="Professional Cleaning Services | BrightBroom" />
  <meta name="twitter:description" content="Build your own cleaning booking. Choose hours, rooms, and add-ons for a personalised clean." />

  <!-- Structured Data -->
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Professional Cleaning Services",
      "provider": {
        "@type": "LocalBusiness",
        "name": "BrightBroom",
        "url": "https://brightbroom.com"
      },
      "serviceType": "Cleaning Service",
      "description": "Professional home cleaning services with flexible booking. Choose your hours, rooms, and add-ons.",
      "areaServed": [
        "Fourways",
        "Bryanston",
        "Randburg",
        "Midrand",
        "North Riding",
        "Cosmo City",
        "Diepsloot",
        "Honeydew",
        "Centurion"
      ]
    }
  </script>
</svelte:head>

<div class="bg-gray-50 dark:bg-gray-900">
  <!-- Hero Section -->
  <section class="py-16 md:py-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white md:text-5xl">
          Build Your Perfect Clean
        </h1>
        <p class="mx-auto mt-6 max-w-2xl text-xl text-gray-600 dark:text-gray-300">
          Create a cleaning booking tailored to your home. Choose your hours, select the rooms
          that need attention, and add extras for a spotless finish.
        </p>
        <div class="mt-10">
          <Button href="/book" size="lg" variant="primary">
            Start Building Your Booking
          </Button>
        </div>
      </div>
    </div>
  </section>

  <!-- How It Works -->
  <section class="bg-white py-16 dark:bg-gray-800">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 class="mb-12 text-center text-3xl font-bold text-gray-900 dark:text-white">
        How It Works
      </h2>

      <div class="grid gap-8 md:grid-cols-3">
        <div class="text-center">
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
            <Clock class="h-8 w-8 text-primary" />
          </div>
          <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            1. Choose Your Hours
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            Select how long you need a cleaner for - from a quick refresh to a thorough deep clean.
          </p>
        </div>

        <div class="text-center">
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
            <Home class="h-8 w-8 text-primary" />
          </div>
          <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            2. Select Your Rooms
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            Tell us which rooms need cleaning so we can match you with the right cleaner.
          </p>
        </div>

        <div class="text-center">
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
            <Sparkles class="h-8 w-8 text-primary" />
          </div>
          <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            3. Add Extras
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            Need oven cleaning, laundry, or inside windows? Add optional extras to your booking.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- What's Included -->
  <section class="py-16">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 class="mb-12 text-center text-3xl font-bold text-gray-900 dark:text-white">
        What's Included
      </h2>

      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each [
          'Dusting surfaces and furniture',
          'Vacuuming and mopping floors',
          'Kitchen cleaning and sanitising',
          'Bathroom cleaning and disinfecting',
          'Bed making and tidying',
          'Emptying bins',
          'Wiping down appliances',
          'Mirror and glass cleaning',
          'General tidying up'
        ] as item (item)}
          <div class="flex items-start gap-3">
            <CheckCircle class="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
            <span class="text-gray-700 dark:text-gray-300">{item}</span>
          </div>
        {/each}
      </div>

      <div class="mt-12 text-center">
        <Button href="/book" variant="primary">
          Book Your Clean
        </Button>
      </div>
    </div>
  </section>

  <!-- FAQ Section -->
  <section class="bg-white py-16 dark:bg-gray-800">
    <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <h2 class="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white">
        Frequently Asked Questions
      </h2>

      <div class="space-y-6">
        <div class="rounded-lg bg-gray-50 p-6 dark:bg-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Do I need to provide cleaning supplies?
          </h3>
          <p class="mt-2 text-gray-600 dark:text-gray-300">
            Yes, you'll need to provide cleaning supplies and equipment. Our cleaners bring their expertise and hard work.
          </p>
        </div>

        <div class="rounded-lg bg-gray-50 p-6 dark:bg-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            How do I pay?
          </h3>
          <p class="mt-2 text-gray-600 dark:text-gray-300">
            Payment is made securely online when you complete your booking. We accept all major payment methods via PayFast.
          </p>
        </div>

        <div class="rounded-lg bg-gray-50 p-6 dark:bg-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Can I reschedule or cancel?
          </h3>
          <p class="mt-2 text-gray-600 dark:text-gray-300">
            Yes, you can reschedule or cancel your booking through your account. Please give at least 24 hours notice for cancellations.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Business Inquiries Section -->
  <section class="border-t border-gray-200 py-16 dark:border-gray-700">
    <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div class="rounded-2xl bg-gray-100 p-8 dark:bg-gray-800 md:p-12">
        <div class="flex flex-col items-center text-center md:flex-row md:text-left">
          <div class="mb-6 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-900/30 md:mb-0 md:mr-8">
            <Building2 class="h-8 w-8 text-secondary" />
          </div>

          <div class="flex-1">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
              Need Cleaning for Your Business?
            </h2>
            <p class="mt-2 text-gray-600 dark:text-gray-300">
              Offices, commercial spaces, or large-scale cleaning projects requiring multiple cleaners?
              Get in touch for a custom quote tailored to your business needs.
            </p>
          </div>

          <div class="mt-6 flex-shrink-0 md:ml-8 md:mt-0">
            <Button href="/contact?subject=Business Inquiry" variant="secondary">
              <MessageSquare class="mr-2 h-4 w-4" />
              Request a Quote
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Final CTA -->
  <section class="bg-primary py-16">
    <div class="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
      <h2 class="text-3xl font-bold text-white">
        Ready for a Cleaner Home?
      </h2>
      <p class="mx-auto mt-4 max-w-xl text-lg text-white/90">
        Build your booking in minutes and enjoy a professionally cleaned space.
      </p>
      <div class="mt-8">
        <Button href="/book" variant="secondary" size="lg">
          Start Your Booking
        </Button>
      </div>
    </div>
  </section>
</div>
