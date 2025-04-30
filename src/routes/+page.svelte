<!-- src/routes/+page.svelte -->
<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte";
  import heroImage from "$lib/image-assets/hero.webp";

  // Get user data from loader
  export let data;

  $: user = data.user;
</script>

<svelte:head>
  <title>BrightBroom | On-demand Cleaning Services</title>
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

        <div
          class="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
        >
          {#if user}
            <Button variant="primary" size="lg" href="/book">
              Book a Cleaning
            </Button>
            <Button variant="outline" size="lg" href="/profile">
              View Your Profile
            </Button>
          {:else}
            <Button variant="primary" size="lg" href="/auth/register">
              Sign Up Now
            </Button>
            <Button variant="outline" size="lg" href="/services">
              View Services
            </Button>
          {/if}
        </div>
      </div>

      <div class="flex items-center justify-center">
        <img
          src={heroImage}
          alt="Professional cleaning service"
          class="rounded-lg shadow-md object-cover w-full h-auto md:h-full lg:h-96"
        />
      </div>
    </div>
  </div>
</section>

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

    <div class="grid gap-8 md:grid-cols-3">
      <!-- Regular Cleaning -->
      <div
        class="rounded-lg bg-white p-6 shadow-md transition-transform hover:-translate-y-1 dark:bg-gray-800"
      >
        <div class="mb-4 text-center text-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </div>
        <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          Regular Cleaning
        </h3>
        <p class="mb-4 text-gray-600 dark:text-gray-300">
          Perfect for maintaining a clean and tidy home on a regular basis.
        </p>
        <p class="mb-6 text-2xl font-bold text-primary">R350</p>
        <Button variant="outline" href="/services" class="w-full">
          Learn More
        </Button>
      </div>

      <!-- Extended Cleaning -->
      <div
        class="rounded-lg bg-white p-6 shadow-md transition-transform hover:-translate-y-1 dark:bg-gray-800"
      >
        <div class="mb-4 text-center text-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          Extended Cleaning
        </h3>
        <p class="mb-4 text-gray-600 dark:text-gray-300">
          A thorough cleaning service that reaches every corner and detail.
        </p>
        <p class="mb-6 text-2xl font-bold text-primary">R500</p>
        <Button variant="outline" href="/services" class="w-full">
          Learn More
        </Button>
      </div>

      <!-- Office Cleaning -->
      <div
        class="rounded-lg bg-white p-6 shadow-md transition-transform hover:-translate-y-1 dark:bg-gray-800"
      >
        <div class="mb-4 text-center text-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          Office Cleaning
        </h3>
        <p class="mb-4 text-gray-600 dark:text-gray-300">
          Professional cleaning for your office space or commercial property.
        </p>
        <p class="mb-6 text-2xl font-bold text-primary">R450</p>
        <Button variant="outline" href="/services" class="w-full">
          Learn More
        </Button>
      </div>
    </div>

    <div class="mt-12 text-center">
      <Button variant="primary" href="/services">View All Services</Button>
    </div>
  </div>
</section>

<!-- How it works section -->
<section class="bg-white py-16 dark:bg-gray-800">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="mb-12 text-center">
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
        How It Works
      </h2>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-300">
        Book a cleaning in just a few simple steps
      </p>
    </div>

    <div class="grid gap-8 md:grid-cols-4">
      <!-- Step 1 -->
      <div class="text-center">
        <div
          class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary"
        >
          <span class="text-2xl font-bold">1</span>
        </div>
        <h3 class="mb-2 text-xl font-medium text-gray-900 dark:text-white">
          Choose a Service
        </h3>
        <p class="text-gray-600 dark:text-gray-300">
          Select the type of cleaning service that meets your needs.
        </p>
      </div>

      <!-- Step 2 -->
      <div class="text-center">
        <div
          class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary"
        >
          <span class="text-2xl font-bold">2</span>
        </div>
        <h3 class="mb-2 text-xl font-medium text-gray-900 dark:text-white">
          Set a Date & Time
        </h3>
        <p class="text-gray-600 dark:text-gray-300">
          Choose when you'd like our professionals to clean your space.
        </p>
      </div>

      <!-- Step 3 -->
      <div class="text-center">
        <div
          class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary"
        >
          <span class="text-2xl font-bold">3</span>
        </div>
        <h3 class="mb-2 text-xl font-medium text-gray-900 dark:text-white">
          Confirm & Pay
        </h3>
        <p class="text-gray-600 dark:text-gray-300">
          Review your booking details and make a secure payment.
        </p>
      </div>

      <!-- Step 4 -->
      <div class="text-center">
        <div
          class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary"
        >
          <span class="text-2xl font-bold">4</span>
        </div>
        <h3 class="mb-2 text-xl font-medium text-gray-900 dark:text-white">
          Enjoy a Clean Space
        </h3>
        <p class="text-gray-600 dark:text-gray-300">
          Relax while our professionals make your space sparkle.
        </p>
      </div>
    </div>

    <div class="mt-12 text-center">
      <Button variant="primary" href={user ? "/book" : "/auth/register"}>
        {user ? "Book Now" : "Get Started"}
      </Button>
    </div>
  </div>
</section>

<!-- Testimonials section -->
<section class="bg-gray-50 py-16 dark:bg-gray-900">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="mb-12 text-center">
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
        What Our Customers Say
      </h2>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-300">
        Hear from people who've experienced our services
      </p>
    </div>

    <div class="grid gap-8 md:grid-cols-3">
      <!-- Testimonial 1 -->
      <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <div class="mb-4 flex text-yellow-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        </div>
        <p class="mb-4 text-gray-600 dark:text-gray-300">
          "BrightBroom exceeded my expectations! The cleaners were professional,
          thorough, and paid attention to every detail. My home has never looked
          better."
        </p>
        <div class="flex items-center">
          <div class="font-medium text-gray-900 dark:text-white">Sarah M.</div>
          <!-- <div class="ml-2 text-sm text-gray-500 dark:text-gray-400">
            Cape Town
          </div> -->
        </div>
      </div>

      <!-- Testimonial 2 -->
      <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <div class="mb-4 flex text-yellow-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        </div>
        <p class="mb-4 text-gray-600 dark:text-gray-300">
          "I love how easy it is to book a cleaning. The app is user-friendly
          and the cleaners are always on time and do an amazing job. Highly
          recommend!"
        </p>
        <div class="flex items-center">
          <div class="font-medium text-gray-900 dark:text-white">John D.</div>
          <!-- <div class="ml-2 text-sm text-gray-500 dark:text-gray-400">
            Johannesburg
          </div> -->
        </div>
      </div>

      <!-- Testimonial 3 -->
      <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <div class="mb-4 flex text-yellow-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        </div>
        <p class="mb-4 text-gray-600 dark:text-gray-300">
          "As a busy business owner, BrightBroom has been a lifesaver for our
          office. The team is reliable, efficient, and our office has never been
          cleaner. Worth every penny!"
        </p>
        <div class="flex items-center">
          <div class="font-medium text-gray-900 dark:text-white">Emma L.</div>
          <!-- <div class="ml-2 text-sm text-gray-500 dark:text-gray-400">
            Durban
          </div> -->
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA section -->
<section class="bg-primary py-16">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="text-center">
      <h2 class="text-3xl font-bold text-white">
        Ready for a sparkling clean space?
      </h2>
      <p class="mt-4 text-lg text-white/80">
        Join thousands of happy customers who've discovered the BrightBroom
        difference.
      </p>
      <div class="mt-8">
        <Button
          variant="secondary"
          size="lg"
          href={user ? "/book" : "/auth/register"}
        >
          {user ? "Book a Cleaning" : "Get Started Today"}
        </Button>
      </div>
    </div>
  </div>
</section>
