<!-- src/lib/components/home/CustomerHome.svelte -->
<!--
  The home page a cleaning company's customers see. It is the home page of a
  company's own site, and on brightbroom.com the live demo at /demo.
-->
<script lang="ts">
  import { brand } from "$lib/config/brand";
  import Icon from "$lib/components/ui/Icon.svelte";
  import heroImage from "$lib/image-assets/hero.webp";
  import kitchenImage from "$lib/image-assets/kitchen.webp";
  import livingRoomImage from "$lib/image-assets/living-room.webp";

  /** Bookings paused: the CTAs point at the explanation page */
  export let bookingsPaused = false;
  /** The signed-in user, if any */
  export let user: { id: string } | null = null;
</script>

<!-- Hero section -->
<section class="relative overflow-hidden">
  <!-- Background image -->
  <div class="absolute inset-0">
    <img
      src={heroImage}
      alt="Professional cleaner organising a modern living room with cleaning supplies, showcasing {brand.name}'s quality service"
      class="w-full h-full object-cover object-center"
    />
    <!-- Full overlay on mobile for text readability -->
    <div class="absolute inset-0 bg-white/85 dark:bg-gray-900/90 md:bg-transparent"></div>
    <!-- Gradient overlay on desktop: fades from left to right -->
    <div class="absolute inset-0 hidden md:block bg-gradient-to-r from-white via-white/90 to-white/0 dark:from-gray-900 dark:via-gray-900/90 dark:to-gray-900/0"></div>
  </div>

  <!-- Content -->
  <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-32">
    <div class="max-w-full sm:max-w-lg lg:max-w-xl">
      <p class="text-primary-700 font-semibold text-sm uppercase tracking-wider mb-4">Professional Cleaning Services</p>
      <h1 class="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight">
        Cleaner Bookings
        <span class="text-primary-700"> Made&nbsp;Simple</span>
      </h1>
      <p class="text-base sm:text-lg text-gray-900 md:text-gray-700 dark:text-gray-200 mb-8 sm:mb-10 leading-relaxed">
        {brand.name} connects you with professional cleaners for your home or
        office. Book online in minutes and get your space sparkling clean.
      </p>

      <!-- CTA Buttons -->
      <div class="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
        <a
          href={bookingsPaused ? "/bookings-paused" : "/book"}
          class="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-secondary text-white font-semibold rounded-lg hover:bg-secondary-600 transition-colors text-sm sm:text-base"
        >
          {bookingsPaused ? "Coming Soon" : "Book Now"}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
        {#if user}
          <a
            href="/profile"
            class="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-white/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-semibold rounded-lg hover:bg-white hover:border-primary/50 dark:hover:bg-gray-800 transition-colors text-sm sm:text-base"
          >
            View Your Profile
          </a>
        {:else}
          <a
            href="/services"
            class="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-white/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-semibold rounded-lg hover:bg-white hover:border-primary/50 dark:hover:bg-gray-800 transition-colors text-sm sm:text-base"
          >
            View Services
          </a>
        {/if}
      </div>
    </div>
  </div>
</section>

<!-- How it works section -->
<section class="py-16 lg:py-24 bg-white dark:bg-gray-800">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="mb-12 text-center">
      <p class="text-primary-700 font-semibold text-sm uppercase tracking-wider mb-3">Simple Process</p>
      <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
        How It Works
      </h2>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-300">
        Book a cleaning in just a few simple steps
      </p>
    </div>

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Step 1 -->
      <div class="group text-center rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:border-primary/50 hover:shadow-lg">
        <div
          class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-800 transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-950"
        >
          <Icon name="clock" size={32} accent />
        </div>
        <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          Choose Your Hours
        </h3>
        <p class="text-gray-600 dark:text-gray-300">
          Select how long you need a cleaner - from a quick tidy to a deep clean.
        </p>
      </div>

      <!-- Step 2 -->
      <div class="group text-center rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:border-primary/50 hover:shadow-lg">
        <div
          class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-800 transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-950"
        >
          <Icon name="house" size={32} accent />
        </div>
        <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          Select Rooms & Extras
        </h3>
        <p class="text-gray-600 dark:text-gray-300">
          Tell us which rooms need attention and add any optional extras.
        </p>
      </div>

      <!-- Step 3 -->
      <div class="group text-center rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:border-primary/50 hover:shadow-lg">
        <div
          class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-800 transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-950"
        >
          <Icon name="calendar-check" size={32} accent />
        </div>
        <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          Pick a Date & Pay
        </h3>
        <p class="text-gray-600 dark:text-gray-300">
          Choose your preferred time and complete your secure payment.
        </p>
      </div>

      <!-- Step 4 -->
      <div class="group text-center rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:border-primary/50 hover:shadow-lg">
        <div
          class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-800 transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-950"
        >
          <Icon name="sparkle" size={32} accent />
        </div>
        <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          Enjoy a Clean Space
        </h3>
        <p class="text-gray-600 dark:text-gray-300">
          Relax while our professional cleaner makes your space sparkle.
        </p>
      </div>
    </div>

    <div class="mt-12 text-center">
      <a
        href="/book"
        class="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-white font-semibold rounded-lg hover:bg-secondary-600 transition-colors"
      >
        Book Now
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </a>
    </div>
  </div>
</section>

<!-- Areas We Clean section -->
<section class="py-16 lg:py-24 bg-gray-50 dark:bg-gray-900">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="mb-12 text-center">
      <p class="text-primary-700 font-semibold text-sm uppercase tracking-wider mb-3">Our Services</p>
      <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
        Some Areas We Clean
      </h2>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-300">
        From kitchens to living rooms, we make every space shine
      </p>
    </div>

    <!-- Kitchen Cleaning -->
    <div class="group mb-12 grid gap-8 md:grid-cols-2 md:gap-12 items-center">
      <div class="flex flex-col justify-center">
        <h3 class="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
          Kitchen Deep Clean
        </h3>
        <p class="mb-6 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
          The kitchen is the heart of your home, and we treat it that way. Our thorough cleaning covers every surface - from countertops and appliances to cabinets and floors. We ensure your kitchen is not just clean, but hygienic and welcoming.
        </p>
        <div>
          <a
            href="/book"
            class="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-semibold rounded-lg hover:border-primary/50 hover:bg-white dark:hover:bg-gray-800 transition-colors"
          >
            Book a Clean
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>

      <div class="overflow-hidden rounded-xl">
        <img
          src={kitchenImage}
          alt="Sparkling clean kitchen with organized countertops and appliances"
          class="h-auto w-full object-cover shadow-lg md:h-80 lg:h-96 transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
    </div>

    <!-- Living Room Cleaning -->
    <div class="group mb-12 grid gap-8 md:grid-cols-2 md:gap-12 items-center">
      <div class="overflow-hidden rounded-xl md:order-1">
        <img
          src={livingRoomImage}
          alt="Fresh and tidy living room with clean furniture and organized space"
          class="h-auto w-full object-cover shadow-lg md:h-80 lg:h-96 transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      <div class="flex flex-col justify-center md:order-2">
        <h3 class="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
          Living Room Care
        </h3>
        <p class="mb-6 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
          Your living room is where you relax and entertain. We dust every surface, vacuum thoroughly, and ensure your space feels fresh and inviting. From furniture to floors, we leave no corner untouched.
        </p>
        <div>
          <a
            href="/book"
            class="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-semibold rounded-lg hover:border-primary/50 hover:bg-white dark:hover:bg-gray-800 transition-colors"
          >
            Book a Clean
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </div>

    <div class="text-center">
      <a
        href="/book"
        class="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-950 font-semibold rounded-lg hover:bg-primary-600 transition-colors"
      >
        Build Your Booking
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </a>
    </div>
  </div>
</section>

<!-- CTA section -->
<section class="py-16 lg:py-24 bg-primary-700">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-2xl mx-auto">
      <h2 class="text-3xl lg:text-4xl font-bold text-white">
        Ready for a sparkling clean space?
      </h2>
      <p class="mt-4 text-lg text-primary-50 leading-relaxed">
        Join happy customers who've discovered the {brand.name}
        difference.
      </p>
      <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <a
          href="/book"
          class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-secondary text-white font-semibold rounded-lg hover:bg-secondary-600 transition-colors"
        >
          Book Now
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
        <a
          href="/services"
          class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 border border-white/30 transition-colors"
        >
          View Services
        </a>
      </div>
    </div>
  </div>
</section>
