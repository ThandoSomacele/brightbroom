<!-- src/routes/pitch-deck/+page.svelte -->
<script lang="ts">
  import { browser } from "$app/environment";
  import { ArrowLeft, ArrowRight } from "lucide-svelte";
  import { onDestroy, onMount } from "svelte";
  import { quintOut } from "svelte/easing";
  import { fly } from "svelte/transition";

  // Current slide index
  let currentSlide = 0;
  // Total number of slides
  const totalSlides = 10;
  // Auto-play state
  let isAutoPlaying = false;
  let autoPlayInterval: ReturnType<typeof setInterval> | null = null;
  // Track if the presentation has started
  let hasStarted = false;

  // Handle keyboard navigation
  function handleKeydown(event: KeyboardEvent) {
    if (
      event.key === "ArrowRight" ||
      event.key === " " ||
      event.key === "PageDown"
    ) {
      goToNextSlide();
    } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
      goToPrevSlide();
    } else if (event.key === "Home") {
      currentSlide = 0;
    } else if (event.key === "End") {
      currentSlide = totalSlides - 1;
    }
  }

  // Navigation functions
  function goToNextSlide() {
    if (currentSlide < totalSlides - 1) {
      currentSlide++;
      // Scroll to top when changing slides
      if (browser) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
    if (!hasStarted) hasStarted = true;
  }

  function goToPrevSlide() {
    if (currentSlide > 0) {
      currentSlide--;
      // Scroll to top when changing slides
      if (browser) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
    if (!hasStarted) hasStarted = true;
  }

  function goToSlide(index: number) {
    currentSlide = index;
    // Scroll to top when changing slides
    if (browser) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (!hasStarted) hasStarted = true;
  }

  // Toggle auto-play
  function toggleAutoPlay() {
    isAutoPlaying = !isAutoPlaying;

    if (isAutoPlaying && browser) {
      // Check for browser environment
      autoPlayInterval = setInterval(() => {
        if (currentSlide < totalSlides - 1) {
          currentSlide++;
          // Scroll to top when auto-changing slides
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          // Stop auto-play when we reach the end
          isAutoPlaying = false;
          if (autoPlayInterval) clearInterval(autoPlayInterval);
        }
      }, 8000); // Change slide every 8 seconds
    } else if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
    }

    if (!hasStarted) hasStarted = true;
  }

  // Setup and cleanup
  onMount(() => {
    // Only access browser APIs inside onMount
    if (browser) {
      // Add keyboard listener
      window.addEventListener("keydown", handleKeydown);

      // Focus the container for keyboard navigation
      const container = document.getElementById("pitch-deck-container");
      if (container) container.focus();
    }
  });

  onDestroy(() => {
    // Clean up listeners and intervals
    if (browser) {
      window.removeEventListener("keydown", handleKeydown);
      if (autoPlayInterval) clearInterval(autoPlayInterval);
    }
  });

  // All team members data
  const teamMembers = [
    {
      name: "Thando Somacele",
      title: "Founder, CEO & CTO",
      email: "thando@brightbroom.com",
      phone: "072 225 1491",
      bio: "Full-stack developer with expertise in modern web technologies and marketplace platforms.",
      image: "/team/thando.jpg",
    },
    {
      name: "Sharon Somacele",
      title: "Founder, CLO & COO",
      email: "sharon@brightbroom.com",
      phone: "078 176 7075",
      bio: "LLB graduate providing legal expertise with background in administrative operations.",
      image: "/team/sharon.jpg",
    },
  ];
</script>

<svelte:head>
  <title>BrightBroom | Investor Pitch Deck</title>
  <meta
    name="description"
    content="BrightBroom - Cleaner Bookings Made Simple. Connecting customers with professional cleaners."
  />
</svelte:head>

<!-- Container for the entire pitch deck - Changed to min-height and removed overflow-hidden -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  id="pitch-deck-container"
  class="relative min-h-screen w-full bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white"
  tabindex="0"
  role="application"
  aria-label="BrightBroom pitch deck presentation"
>
  <!-- Start screen (shown before presentation starts) -->
  {#if !hasStarted}
    <div class="flex min-h-screen w-full flex-col items-center justify-center">
      <div class="mb-8 text-center">
        <h1 class="mb-4 text-4xl font-bold text-primary md:text-6xl">
          BrightBroom
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-300">
          Cleaner Bookings Made Simple
        </p>
      </div>
      <div class="space-x-4">
        <button
          on:click={() => {
            hasStarted = true;
          }}
          class="rounded-lg bg-primary px-6 py-3 text-white shadow-md transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Start Presentation
        </button>
        <button
          on:click={toggleAutoPlay}
          class="rounded-lg bg-gray-200 px-6 py-3 text-gray-800 shadow-md transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
        >
          Auto-Play
        </button>
      </div>
    </div>
  {:else}
    <!-- Slides - Changed height to min-height -->
    <div class="min-h-screen pb-20">
      <!-- Added padding-bottom to make space for navigation -->
      <!-- Slide 1: Title -->
      {#if currentSlide === 0}
        <div
          class="flex min-h-screen flex-col items-center justify-center p-8"
          in:fly={{ y: 50, duration: 500, easing: quintOut }}
        >
          <div class="w-full max-w-5xl text-center">
            <div class="mb-4 text-center">
              <h1 class="mb-2 text-5xl font-bold text-primary md:text-7xl">
                BrightBroom
              </h1>
              <p class="text-xl text-gray-600 dark:text-gray-300 md:text-2xl">
                Cleaner Bookings Made Simple
              </p>
            </div>

            <div class="mx-auto my-8 h-1 w-32 bg-secondary"></div>

            <div class="mb-12 space-y-4">
              <p class="text-2xl">
                Connecting customers with professional cleaners
              </p>
              <p class="text-lg text-gray-600 dark:text-gray-400">
                A digital platform for on-demand cleaning services in South
                Africa
              </p>
            </div>

            <div class="mt-8 flex flex-wrap justify-center gap-6">
              {#each teamMembers as member}
                <div>
                  <p class="font-medium">{member.name}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {member.title}
                  </p>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      <!-- Slide 2: The Problem -->
      {#if currentSlide === 1}
        <div
          class="flex min-h-screen flex-col items-center justify-center p-8"
          in:fly={{ y: 50, duration: 500, easing: quintOut }}
        >
          <div class="w-full max-w-5xl">
            <h2 class="mb-8 text-4xl font-bold text-primary md:text-5xl">
              The Problem
            </h2>

            <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div
                class="space-y-6 rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800"
              >
                <h3 class="text-2xl font-semibold">For Customers</h3>
                <ul
                  class="ml-6 list-disc space-y-3 text-gray-700 dark:text-gray-300"
                >
                  <li>Difficulty finding reliable cleaning services quickly</li>
                  <li>
                    Time-consuming process of sourcing trustworthy cleaners
                  </li>
                  <li>Lack of transparency in pricing and scheduling</li>
                  <li>
                    Uncertainty about cleaner qualifications and reliability
                  </li>
                </ul>
              </div>

              <div
                class="space-y-6 rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800"
              >
                <h3 class="text-2xl font-semibold">For Cleaners</h3>
                <ul
                  class="ml-6 list-disc space-y-3 text-gray-700 dark:text-gray-300"
                >
                  <li>Limited access to a steady stream of clients</li>
                  <li>Difficulty setting fair rates and managing schedules</li>
                  <li>No platform to showcase skills and build reputation</li>
                  <li>
                    Unreliable income without consistent work opportunities
                  </li>
                </ul>
              </div>
            </div>

            <div class="mt-8 rounded-xl bg-primary/10 p-6">
              <p class="text-xl italic text-gray-800 dark:text-gray-200">
                "The home cleaning market in South Africa is fragmented and
                inefficient, leaving both customers and service providers
                frustrated."
              </p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Slide 3: The Solution -->
      {#if currentSlide === 2}
        <div
          class="flex min-h-screen flex-col items-center justify-center p-8"
          in:fly={{ y: 50, duration: 500, easing: quintOut }}
        >
          <div class="w-full max-w-5xl">
            <h2 class="mb-8 text-4xl font-bold text-primary md:text-5xl">
              Our Solution
            </h2>

            <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div
                class="flex flex-col rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800"
              >
                <h3 class="mb-4 text-xl font-semibold text-secondary">
                  Easy Booking
                </h3>
                <p class="flex-grow text-gray-700 dark:text-gray-300">
                  Simple online platform to book pre-vetted cleaning
                  professionals on demand
                </p>
              </div>

              <div
                class="flex flex-col rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800"
              >
                <h3 class="mb-4 text-xl font-semibold text-secondary">
                  Transparent Pricing
                </h3>
                <p class="flex-grow text-gray-700 dark:text-gray-300">
                  Clear, upfront pricing with no hidden fees or surprises
                </p>
              </div>

              <div
                class="flex flex-col rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800"
              >
                <h3 class="mb-4 text-xl font-semibold text-secondary">
                  Verified Cleaners
                </h3>
                <p class="flex-grow text-gray-700 dark:text-gray-300">
                  All service providers are thoroughly vetted and
                  background-checked
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div class="space-y-4">
                <h3 class="text-2xl font-semibold">For Customers</h3>
                <ul
                  class="ml-6 list-disc space-y-2 text-gray-700 dark:text-gray-300"
                >
                  <li>Book cleaning services in minutes</li>
                  <li>Choose from flexible service packages</li>
                  <li>Secure payment processing</li>
                  <li>Rate and review service quality</li>
                </ul>
              </div>

              <div class="space-y-4">
                <h3 class="text-2xl font-semibold">For Cleaners</h3>
                <ul
                  class="ml-6 list-disc space-y-2 text-gray-700 dark:text-gray-300"
                >
                  <li>Access to steady stream of clients</li>
                  <li>Flexible scheduling options</li>
                  <li>Build reputation through reviews</li>
                  <li>Secure and timely payments</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Slide 4: Market Opportunity -->
      {#if currentSlide === 3}
        <div
          class="flex min-h-screen flex-col items-center justify-center p-8"
          in:fly={{ y: 50, duration: 500, easing: quintOut }}
        >
          <div class="w-full max-w-5xl">
            <h2 class="mb-8 text-4xl font-bold text-primary md:text-5xl">
              Market Opportunity
            </h2>

            <div
              class="mb-8 rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800"
            >
              <h3 class="mb-4 text-2xl font-semibold">Target Market</h3>

              <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <ul
                    class="ml-6 list-disc space-y-3 text-gray-700 dark:text-gray-300"
                  >
                    <li>
                      <span class="font-medium">Young professionals</span> with limited
                      time for household chores
                    </li>
                    <li>
                      <span class="font-medium">First-time parents</span> needing
                      support with home maintenance
                    </li>
                    <li>
                      <span class="font-medium">Small local businesses</span> requiring
                      reliable cleaning services
                    </li>
                    <li>
                      <span class="font-medium">Dual-income households</span> seeking
                      work-life balance
                    </li>
                  </ul>
                </div>

                <div
                  class="space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700"
                >
                  <p class="text-lg font-medium">South African Context</p>
                  <ul
                    class="ml-6 list-disc space-y-2 text-gray-700 dark:text-gray-300"
                  >
                    <li>Growing middle class seeking convenience services</li>
                    <li>Increasing urbanisation in major cities</li>
                    <li>Rising demand for trustworthy home services</li>
                    <li>
                      High smartphone penetration enabling on-demand solutions
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div
                class="rounded-xl bg-white p-6 text-center shadow-lg dark:bg-gray-800"
              >
                <p class="text-4xl font-bold text-secondary">R20B+</p>
                <p class="text-gray-700 dark:text-gray-300">
                  Estimated market size for home cleaning services in South
                  Africa
                </p>
              </div>

              <div
                class="rounded-xl bg-white p-6 text-center shadow-lg dark:bg-gray-800"
              >
                <p class="text-4xl font-bold text-secondary">15%</p>
                <p class="text-gray-700 dark:text-gray-300">
                  Annual growth rate in on-demand services sector
                </p>
              </div>

              <div
                class="rounded-xl bg-white p-6 text-center shadow-lg dark:bg-gray-800"
              >
                <p class="text-4xl font-bold text-secondary">2M+</p>
                <p class="text-gray-700 dark:text-gray-300">
                  Target households in major urban centers
                </p>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Slide 5: Business Model -->
      {#if currentSlide === 4}
        <div
          class="flex min-h-screen flex-col items-center justify-center p-8"
          in:fly={{ y: 50, duration: 500, easing: quintOut }}
        >
          <div class="w-full max-w-5xl">
            <h2 class="mb-8 text-4xl font-bold text-primary md:text-5xl">
              Business Model
            </h2>

            <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div class="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
                <h3 class="mb-4 text-2xl font-semibold text-secondary">
                  Revenue Streams
                </h3>

                <ul
                  class="ml-6 list-disc space-y-4 text-gray-700 dark:text-gray-300"
                >
                  <li>
                    <span class="font-medium">Service Fee:</span> 20-25% commission
                    on each booking
                  </li>
                  <li>
                    <span class="font-medium">Premium Listings:</span> Featured placement
                    for cleaners
                  </li>
                  <li>
                    <span class="font-medium">Subscription Plans:</span> For frequent
                    customers and businesses
                  </li>
                  <li>
                    <span class="font-medium">Add-on Services:</span> Special cleaning
                    services at additional cost
                  </li>
                </ul>
              </div>

              <div class="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
                <h3 class="mb-4 text-2xl font-semibold text-secondary">
                  Pricing Strategy
                </h3>

                <div class="space-y-4">
                  <div>
                    <p class="font-medium">Residential Cleaning:</p>
                    <p class="text-gray-700 dark:text-gray-300">
                      R350-R550 per service (based on home size and
                      requirements)
                    </p>
                  </div>

                  <div>
                    <p class="font-medium">Commercial Cleaning:</p>
                    <p class="text-gray-700 dark:text-gray-300">
                      R450-R650 per booking (based on facility type and
                      frequency)
                    </p>
                  </div>

                  <!-- <div>
                    <p class="font-medium">Specialised Services:</p>
                    <p class="text-gray-700 dark:text-gray-300">
                      Post-construction, deep cleaning, etc. at premium rates
                    </p>
                  </div> -->
                </div>
              </div>
            </div>

            <div class="rounded-xl bg-primary/10 p-6">
              <h3 class="mb-4 text-xl font-semibold">
                Unit Economics (Per Average Booking)
              </h3>

              <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div class="text-center">
                  <p class="text-lg font-bold">R450</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300">
                    Average Booking Value
                  </p>
                </div>

                <div class="text-center">
                  <p class="text-lg font-bold">R112.50</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300">
                    Platform Revenue (25%)
                  </p>
                </div>

                <div class="text-center">
                  <p class="text-lg font-bold">R30</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300">
                    Customer Acquisition Cost
                  </p>
                </div>

                <div class="text-center">
                  <p class="text-lg font-bold">R82.50</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300">
                    Contribution Margin
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Slide 6: Competitive Advantage -->
      {#if currentSlide === 5}
        <div
          class="flex min-h-screen flex-col items-center justify-center p-8"
          in:fly={{ y: 50, duration: 500, easing: quintOut }}
        >
          <div class="w-full max-w-5xl">
            <h2 class="mb-8 text-4xl font-bold text-primary md:text-5xl">
              Our Competitive Edge
            </h2>

            <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div class="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
                <h3 class="mb-6 text-2xl font-semibold">What Sets Us Apart</h3>

                <ul
                  class="ml-6 list-disc space-y-4 text-gray-700 dark:text-gray-300"
                >
                  <li>
                    <span class="font-medium">Custom Matching Algorithm:</span>
                    Pairs customers with available cleaners based on location and
                    service needs
                  </li>
                  <li>
                    <span class="font-medium">User-Friendly Platform:</span>
                    Seamless booking experience with integrated payment processing
                  </li>
                  <li>
                    <span class="font-medium">Strategic Service Mapping:</span>
                    Optimised for South African urban centers
                  </li>
                  <li>
                    <span class="font-medium">Flexible Service Packages:</span>
                    Tailored to local market needs
                  </li>
                </ul>
              </div>

              <div class="space-y-6">
                <div class="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
                  <h3 class="mb-4 text-xl font-semibold">Market Comparison</h3>

                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="text-gray-700 dark:text-gray-300"
                        >Traditional Agencies</span
                      >
                      <span class="font-medium text-primary"
                        >+80% price premium</span
                      >
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-700 dark:text-gray-300"
                        >Classified Listings</span
                      >
                      <span class="font-medium text-primary"
                        >No vetting or guarantees</span
                      >
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-700 dark:text-gray-300"
                        >Local Competitors</span
                      >
                      <span class="font-medium text-primary"
                        >Limited geographic reach</span
                      >
                    </div>
                  </div>
                </div>

                <div class="rounded-xl bg-secondary/10 p-6">
                  <p class="text-lg font-medium">Barriers to Entry</p>
                  <ul
                    class="ml-6 list-disc space-y-2 text-gray-700 dark:text-gray-300"
                  >
                    <li>Our established cleaner network</li>
                    <li>Proprietary matching algorithm</li>
                    <li>Brand trust and verification system</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
              <h3 class="mb-4 text-xl font-semibold">Competitive Matrix</h3>

              <div class="overflow-x-auto">
                <table class="min-w-full">
                  <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <th
                        class="py-2 text-left font-medium text-gray-500 dark:text-gray-300"
                        >Features</th
                      >
                      <th
                        class="py-2 text-center font-medium text-gray-500 dark:text-gray-300"
                        >BrightBroom</th
                      >
                      <th
                        class="py-2 text-center font-medium text-gray-500 dark:text-gray-300"
                        >Traditional Agencies</th
                      >
                      <th
                        class="py-2 text-center font-medium text-gray-500 dark:text-gray-300"
                        >Classifieds</th
                      >
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <td class="py-2 text-gray-700 dark:text-gray-300"
                        >Online Booking</td
                      >
                      <td class="py-2 text-center text-green-500">✓</td>
                      <td class="py-2 text-center text-red-500">✗</td>
                      <td class="py-2 text-center text-red-500">✗</td>
                    </tr>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <td class="py-2 text-gray-700 dark:text-gray-300"
                        >Background Checks</td
                      >
                      <td class="py-2 text-center text-green-500">✓</td>
                      <td class="py-2 text-center text-green-500">✓</td>
                      <td class="py-2 text-center text-red-500">✗</td>
                    </tr>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <td class="py-2 text-gray-700 dark:text-gray-300"
                        >Quality Rating System</td
                      >
                      <td class="py-2 text-center text-green-500">✓</td>
                      <td class="py-2 text-center text-red-500">✗</td>
                      <td class="py-2 text-center text-red-500">✗</td>
                    </tr>
                    <tr>
                      <td class="py-2 text-gray-700 dark:text-gray-300"
                        >Same-Day Availability</td
                      >
                      <td class="py-2 text-center text-green-500">✓</td>
                      <td class="py-2 text-center text-red-500">✗</td>
                      <td class="py-2 text-center text-yellow-500">~</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Slide 7: Team -->
      {#if currentSlide === 6}
        <div
          class="flex min-h-screen flex-col items-center justify-center p-8"
          in:fly={{ y: 50, duration: 500, easing: quintOut }}
        >
          <div class="w-full max-w-5xl">
            <h2 class="mb-8 text-4xl font-bold text-primary md:text-5xl">
              Our Team
            </h2>

            <div class="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
              {#each teamMembers as member}
                <div class="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
                  <div
                    class="mb-4 flex flex-col items-center text-center md:flex-row md:items-start md:text-left"
                  >
                    <div
                      class="mr-0 mb-4 h-32 w-32 overflow-hidden rounded-full md:mr-4 md:mb-0"
                    >
                      <!-- Image with fallback to first letter if image fails to load -->
                      <img
                        src={member.image}
                        alt={member.name}
                        class="h-full w-full object-cover"
                        on:error={(event) => {
                          const img = event.target as HTMLImageElement;
                          img.style.display = "none";
                          const fallback =
                            img.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                      <!-- Fallback for when image fails to load -->
                      <div
                        class="hidden h-full w-full items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary"
                      >
                        {member.name.charAt(0)}
                      </div>
                    </div>
                    <div>
                      <h3 class="text-xl font-semibold">{member.name}</h3>
                      <p class="text-secondary">{member.title}</p>
                      <div
                        class="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <p>
                          <a
                            class="text-black dark:text-white"
                            href="mailto:{member.email}">{member.email}</a
                          >
                        </p>
                        <p>
                          <a
                            class="text-black dark:text-white"
                            href="tel:{member.phone}">{member.phone}</a
                          >
                        </p>
                      </div>
                    </div>
                  </div>
                  <p
                    class="mt-4 text-gray-700 dark:text-gray-300 text-center md:text-left"
                  >
                    {member.bio}
                  </p>
                </div>
              {/each}
            </div>

            <div class="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
              <h3 class="mb-4 text-xl font-semibold">Team Strengths</h3>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div class="rounded-lg bg-primary/10 p-4">
                  <p class="font-medium">Technical Expertise</p>
                  <ul
                    class="ml-4 list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <li>Full-stack development</li>
                    <li>Modern web technologies</li>
                    <li>Marketplace platforms</li>
                    <li>Cloud infrastructure</li>
                  </ul>
                </div>

                <div class="rounded-lg bg-primary/10 p-4">
                  <p class="font-medium">Legal & Administrative</p>
                  <ul
                    class="ml-4 list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <li>Legal compliance</li>
                    <li>Contractor agreements</li>
                    <li>Business structure</li>
                    <li>Administrative operations</li>
                  </ul>
                </div>

                <div class="rounded-lg bg-primary/10 p-4">
                  <p class="font-medium">Industry Insights</p>
                  <ul
                    class="ml-4 list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <li>Cleaning service standards</li>
                    <li>Property management</li>
                    <li>Quality control</li>
                    <li>Customer expectations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Slide 8: Traction -->
      {#if currentSlide === 7}
        <div
          class="flex min-h-screen flex-col items-center justify-center p-8"
          in:fly={{ y: 50, duration: 500, easing: quintOut }}
        >
          <div class="w-full max-w-5xl">
            <h2 class="mb-8 text-4xl font-bold text-primary md:text-5xl">
              Current Traction
            </h2>

            <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div class="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
                <h3 class="mb-4 text-2xl font-semibold">Progress to Date</h3>

                <div class="space-y-4">
                  <div class="flex items-center">
                    <div
                      class="mr-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <p class="font-medium">Platform Development</p>
                      <p class="text-sm text-gray-700 dark:text-gray-300">
                        Fully functional booking platform launched
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center">
                    <div
                      class="mr-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <p class="font-medium">Initial Customer Signups</p>
                      <p class="text-sm text-gray-700 dark:text-gray-300">
                        Customer acquisition started with positive feedback
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center">
                    <div
                      class="mr-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <p class="font-medium">Cleaner Database</p>
                      <p class="text-sm text-gray-700 dark:text-gray-300">
                        Growing database of cleaning professionals
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center">
                    <div
                      class="mr-3 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    <div>
                      <p class="font-medium">Vetting System</p>
                      <p class="text-sm text-gray-700 dark:text-gray-300">
                        In development (Next priority)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
                <h3 class="mb-4 text-2xl font-semibold">Key Metrics</h3>

                <div class="mb-6 grid grid-cols-2 gap-4">
                  <div
                    class="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700"
                  >
                    <p class="text-3xl font-bold text-secondary">4+</p>
                    <p class="text-sm text-gray-700 dark:text-gray-300">
                      Customer Sign-ups
                    </p>
                  </div>

                  <div
                    class="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700"
                  >
                    <p class="text-3xl font-bold text-secondary">25+</p>
                    <p class="text-sm text-gray-700 dark:text-gray-300">
                      Cleaner Applications
                    </p>
                  </div>

                  <div
                    class="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700"
                  >
                    <p class="text-3xl font-bold text-secondary">3</p>
                    <p class="text-sm text-gray-700 dark:text-gray-300">
                      Service Areas
                    </p>
                  </div>

                  <div
                    class="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700"
                  >
                    <p class="text-3xl font-bold text-secondary">5%</p>
                    <p class="text-sm text-gray-700 dark:text-gray-300">
                      Weekly Growth
                    </p>
                  </div>
                </div>

                <div class="mt-4 rounded-lg bg-primary/10 p-4">
                  <p class="font-medium">Initial Market Response</p>
                  <ul
                    class="ml-4 list-disc space-y-2 text-gray-700 dark:text-gray-300"
                  >
                    <!-- <li>
                      Strong interest from young professionals in Johannesburg
                    </li>
                    <li>Positive feedback on platform usability</li> -->
                    <li>
                      High interest from cleaning professionals seeking steady
                      work
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Slide 9: Financials & Ask -->
      {#if currentSlide === 8}
        <div
          class="flex min-h-screen flex-col items-center justify-center p-8"
          in:fly={{ y: 50, duration: 500, easing: quintOut }}
        >
          <div class="w-full max-w-5xl">
            <h2 class="mb-8 text-4xl font-bold text-primary md:text-5xl">
              Investment Opportunity
            </h2>

            <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div class="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
                <h3 class="mb-4 text-2xl font-semibold text-secondary">
                  Funding Ask
                </h3>

                <div class="mb-6 rounded-lg bg-primary/10 p-6 text-center">
                  <p class="text-4xl font-bold text-gray-900 dark:text-white">
                    R2,000,000
                  </p>
                  <p class="text-gray-700 dark:text-gray-300">
                    Seed Investment
                  </p>
                </div>

                <h4 class="mb-2 text-lg font-medium">Fund Allocation</h4>

                <div class="space-y-3">
                  <div>
                    <div class="mb-1 flex items-center justify-between">
                      <span class="text-gray-700 dark:text-gray-300"
                        >Technology Development</span
                      >
                      <span class="font-medium">R600,000</span>
                    </div>
                    <div
                      class="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700"
                    >
                      <div
                        class="h-2 rounded-full bg-primary"
                        style="width: 30%"
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div class="mb-1 flex items-center justify-between">
                      <span class="text-gray-700 dark:text-gray-300"
                        >Marketing & Acquisition</span
                      >
                      <span class="font-medium">R500,000</span>
                    </div>
                    <div
                      class="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700"
                    >
                      <div
                        class="h-2 rounded-full bg-primary"
                        style="width: 25%"
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div class="mb-1 flex items-center justify-between">
                      <span class="text-gray-700 dark:text-gray-300"
                        >Operations Setup</span
                      >
                      <span class="font-medium">R400,000</span>
                    </div>
                    <div
                      class="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700"
                    >
                      <div
                        class="h-2 rounded-full bg-primary"
                        style="width: 20%"
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div class="mb-1 flex items-center justify-between">
                      <span class="text-gray-700 dark:text-gray-300"
                        >Working Capital</span
                      >
                      <span class="font-medium">R500,000</span>
                    </div>
                    <div
                      class="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700"
                    >
                      <div
                        class="h-2 rounded-full bg-primary"
                        style="width: 25%"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
                <h3 class="mb-4 text-2xl font-semibold text-secondary">
                  Financial Projections
                </h3>

                <div class="mb-4 space-y-3">
                  <div>
                    <p class="font-medium">Year 1</p>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Revenue
                        </p>
                        <p class="text-gray-900 dark:text-white">R1.2M</p>
                      </div>
                      <div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Expenses
                        </p>
                        <p class="text-gray-900 dark:text-white">R1.8M</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p class="font-medium">Year 2</p>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Revenue
                        </p>
                        <p class="text-gray-900 dark:text-white">R3.6M</p>
                      </div>
                      <div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Expenses
                        </p>
                        <p class="text-gray-900 dark:text-white">R3.0M</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p class="font-medium">Year 3</p>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Revenue
                        </p>
                        <p class="text-gray-900 dark:text-white">R8.4M</p>
                      </div>
                      <div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Expenses
                        </p>
                        <p class="text-gray-900 dark:text-white">R5.2M</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="space-y-4">
                  <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                    <p class="font-medium">Key Performance Indicators</p>
                    <ul
                      class="ml-4 list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <li>Operational breakeven in Month 12</li>
                      <li>12,000+ bookings by end of Year 2</li>
                      <li>Expansion to 3 major cities by Year 3</li>
                    </ul>
                  </div>

                  <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                    <p class="font-medium">Return on Investment</p>
                    <ul
                      class="ml-4 list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <li>Projected 3.5x ROI within 3 years</li>
                      <li>Potential Series A raise in 18-24 months</li>
                      <li>Path to R100M+ valuation by Year 4</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Slide 10: Roadmap -->
      {#if currentSlide === 9}
        <div
          class="flex min-h-screen flex-col items-center justify-center p-6"
          in:fly={{ y: 50, duration: 500, easing: quintOut }}
        >
          <div class="w-full max-w-5xl">
            <h2 class="mb-6 text-4xl font-bold text-primary md:text-5xl">
              Strategic Roadmap
            </h2>

            <!-- Main content with flexible height -->
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <!-- Left column: Timeline -->
              <div class="rounded-xl bg-white p-5 shadow-lg dark:bg-gray-800">
                <h3 class="mb-4 text-xl font-semibold">Next 18 Months</h3>

                <div class="relative ml-4 border-l-2 border-primary pl-5">
                  <!-- Key milestones only - more readable -->
                  <div class="mb-6">
                    <div
                      class="absolute -left-[10px] flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white"
                    >
                      <span class="h-2.5 w-2.5 rounded-full bg-white"></span>
                    </div>
                    <p class="font-medium text-secondary">Months 1-2</p>
                    <p class="font-medium">Implement Cleaner Vetting</p>
                  </div>

                  <div class="mb-6">
                    <div
                      class="absolute -left-[10px] flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white"
                    >
                      <span class="h-2.5 w-2.5 rounded-full bg-white"></span>
                    </div>
                    <p class="font-medium text-secondary">Months 3-6</p>
                    <p class="font-medium">50 Bookings & 50 Cleaners</p>
                  </div>

                  <div class="mb-6">
                    <div
                      class="absolute -left-[10px] flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white"
                    >
                      <span class="h-2.5 w-2.5 rounded-full bg-white"></span>
                    </div>
                    <p class="font-medium text-secondary">Months 7-9</p>
                    <p class="font-medium">PWA & Strategic Partnerships</p>
                  </div>

                  <div class="mb-6">
                    <div
                      class="absolute -left-[10px] flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white"
                    >
                      <span class="h-2.5 w-2.5 rounded-full bg-white"></span>
                    </div>
                    <p class="font-medium text-secondary">Months 10-12</p>
                    <p class="font-medium">Expand to Cape Town</p>
                  </div>

                  <div>
                    <div
                      class="absolute -left-[10px] flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white"
                    >
                      <span class="h-2.5 w-2.5 rounded-full bg-white"></span>
                    </div>
                    <p class="font-medium text-secondary">Months 15-18</p>
                    <p class="font-medium">Operational Breakeven</p>
                  </div>
                </div>
              </div>

              <!-- Right column: Future plans -->
              <div class="space-y-6">
                <div class="rounded-xl bg-white p-5 shadow-lg dark:bg-gray-800">
                  <h3 class="mb-3 text-xl font-semibold">Years 2-3</h3>
                  <ul
                    class="ml-6 list-disc space-y-2 text-gray-700 dark:text-gray-300"
                  >
                    <li>Expand to all major SA cities</li>
                    <li>Introduce specialised services</li>
                    <li>Raise Series A funding</li>
                  </ul>
                </div>

                <div class="rounded-xl bg-white p-5 shadow-lg dark:bg-gray-800">
                  <h3 class="mb-3 text-xl font-semibold">Years 4-5</h3>
                  <ul
                    class="ml-6 list-disc space-y-2 text-gray-700 dark:text-gray-300"
                  >
                    <li>Expand to neighboring countries</li>
                    <li>Add home services verticals</li>
                    <li>Strategic exit opportunities</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Navigation controls -->
    <div
      class="fixed bottom-0 left-0 right-0 z-10 flex items-center justify-between bg-white/90 p-4 backdrop-blur-sm dark:bg-gray-800/90 shadow-md"
    >
      <button
        on:click={goToPrevSlide}
        class="flex items-center rounded-lg bg-white px-4 py-2 text-gray-700 shadow-md transition-colors hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
        disabled={currentSlide === 0}
        aria-label="Previous slide"
      >
        <ArrowLeft size={16} class="mr-1" />
        <span class="hidden sm:inline">Previous</span>
      </button>

      <div class="hidden sm:flex items-center space-x-2">
        {#each Array(totalSlides) as _, i}
          <button
            class={`h-2.5 w-2.5 rounded-full ${currentSlide === i ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}
            on:click={() => goToSlide(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={currentSlide === i}
          ></button>
        {/each}
      </div>

      <!-- Current slide indicator for mobile -->
      <div class="flex sm:hidden items-center">
        <span class="text-sm">{currentSlide + 1}/{totalSlides}</span>
      </div>

      <button
        on:click={goToNextSlide}
        class="flex items-center rounded-lg bg-primary px-4 py-2 text-white shadow-md transition-colors hover:bg-primary-600 disabled:opacity-50"
        disabled={currentSlide === totalSlides - 1}
        aria-label="Next slide"
      >
        <span class="hidden sm:inline">Next</span>
        <ArrowRight size={16} class="ml-1" />
      </button>
    </div>
  {/if}
</div>
