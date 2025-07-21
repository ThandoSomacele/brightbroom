<!-- src/routes/business-plan/+page.svelte -->
<script lang="ts">
  import { ArrowUp } from "lucide-svelte";
  import { onMount } from "svelte";
  import type { PageData } from './$types';

  export let data: PageData;

  let showScrollTop = false;

  onMount(() => {
    const handleScroll = () => {
      showScrollTop = window.scrollY > 300;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  });

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Team members data
  let teamMembers = [
    {
      name: "Thando Somacele",
      title: "Founder, CEO & CTO",
      email: "thando@brightbroom.com",
      phone: "072 225 1491",
      bio: "Full-stack developer with expertise in modern web technologies and marketplace platforms.",
      image: "/team/thando.jpg",
    },
    // Sharon will be automatically uncommented on September 1, 2025
    // {
    //   name: "Sharon Somacele",
    //   title: "Founder, CLO & COO",
    //   email: "sharon@brightbroom.com",
    //   phone: "078 176 7075",
    //   bio: "LLB graduate providing legal expertise with background in administrative operations.",
    //   image: "/team/sharon.jpg",
    // },
  ];

  // Non-blocking timer to automatically uncomment Sharon on September 1, 2025
  if (typeof window !== 'undefined') {
    const targetDate = new Date('2025-09-01T00:00:00');
    const now = new Date();
    
    if (now >= targetDate) {
      // Uncomment Sharon if date has passed
      teamMembers = [
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
    }
  }
</script>

<svelte:head>
  <title>BrightBroom | Business Plan</title>
  <meta
    name="description"
    content="BrightBroom Business Plan - Comprehensive strategy for revolutionising the cleaning services industry in South Africa."
  />
  <meta property="og:title" content="BrightBroom Business Plan" />
  <meta
    property="og:description"
    content="Detailed business plan for BrightBroom - Cleaner Bookings Made Simple"
  />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="BrightBroom Business Plan" />
  <meta
    name="twitter:description"
    content="Comprehensive strategy for revolutionising the cleaning services industry"
  />
</svelte:head>

<div
  class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white"
>
  <!-- Header/Title Section -->
  <header class="bg-white shadow-lg dark:bg-gray-800">
    <div class="container mx-auto px-6 py-12">
      <div class="text-center">
        <h1 class="mb-4 text-5xl font-bold text-primary md:text-6xl">
          BrightBroom
        </h1>
        <h2 class="text-2xl font-light text-gray-600 dark:text-gray-300">
          Business Plan
        </h2>
        <div class="mx-auto my-6 h-1 w-32 bg-secondary"></div>
        <p class="text-xl text-gray-700 dark:text-gray-300">
          Cleaner Bookings Made Simple
        </p>
        <p class="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Revolutionising the Cleaning Services Industry in South Africa
        </p>
      </div>
    </div>
  </header>

  <!-- Table of Contents -->
  <nav
    class="sticky top-0 z-40 bg-white/95 py-4 shadow-sm backdrop-blur-sm dark:bg-gray-800/95"
  >
    <div class="container mx-auto px-6">
      <div class="flex flex-wrap justify-center gap-4 text-sm">
        <a href="#executive-summary" class="hover:text-primary"
          >Executive Summary</a
        >
        <a href="#problem-solution" class="hover:text-primary"
          >Problem & Solution</a
        >
        <a href="#market-opportunity" class="hover:text-primary"
          >Market Opportunity</a
        >
        <a href="#business-model" class="hover:text-primary">Business Model</a>
        <a href="#competitive-analysis" class="hover:text-primary"
          >Competitive Analysis</a
        >
        <a href="#team" class="hover:text-primary">Management Team</a>
        <a href="#operations" class="hover:text-primary">Operations Plan</a>
        <a href="#financials" class="hover:text-primary"
          >Financial Projections</a
        >
        <a href="#funding" class="hover:text-primary">Funding Request</a>
        <a href="#roadmap" class="hover:text-primary">Strategic Roadmap</a>
      </div>
    </div>
  </nav>

  <!-- Main Content -->
  <main class="container mx-auto px-6 py-12">
    <!-- Executive Summary -->
    <section id="executive-summary" class="mb-16">
      <h2 class="mb-8 text-4xl font-bold text-primary">Executive Summary</h2>
      <div class="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <div class="grid gap-8 md:grid-cols-2">
          <div>
            <h3 class="mb-4 text-2xl font-semibold">Company Overview</h3>
            <p class="mb-6 text-gray-700 dark:text-gray-300 leading-relaxed">
              BrightBroom is a digital platform that connects customers with
              professional cleaning services in South Africa. We provide an
              easy-to-use online booking system that matches customers with
              pre-vetted, reliable cleaners while offering transparent pricing
              and secure payment processing.
            </p>

            <h4 class="mb-3 text-lg font-semibold">Mission Statement</h4>
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
              To revolutionise the home cleaning industry by making professional
              cleaning services accessible, reliable, and affordable for all
              South Africans while empowering cleaners with steady work
              opportunities and fair compensation.
            </p>
          </div>

          <div class="space-y-6">
            <div class="rounded-lg bg-primary/10 p-6">
              <h4 class="mb-3 text-lg font-semibold">Key Highlights</h4>
              <ul class="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• R20B+ total addressable market in South Africa</li>
                <li>• Fully functional platform with growing user base</li>
                <li>• {data.stats.cleaners}+ cleaner applications and {data.stats.customers}+ customer sign-ups</li>
                <li>• Seeking R2M seed investment for expansion</li>
                <li>• Projected operational breakeven in 12 months</li>
              </ul>
            </div>

            <div class="rounded-lg bg-secondary/10 p-6">
              <h4 class="mb-3 text-lg font-semibold">Financial Summary</h4>
              <div class="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p class="text-2xl font-bold text-secondary">R1.2M</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Year 1 Revenue
                  </p>
                </div>
                <div>
                  <p class="text-2xl font-bold text-secondary">R8.4M</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Year 3 Revenue
                  </p>
                </div>
                <div>
                  <p class="text-2xl font-bold text-secondary">3.5x</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Projected ROI
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Problem & Solution -->
    <section id="problem-solution" class="mb-16">
      <h2 class="mb-8 text-4xl font-bold text-primary">Problem & Solution</h2>

      <div class="mb-8 rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <h3 class="mb-6 text-2xl font-semibold">Market Problems</h3>
        <div class="grid gap-8 md:grid-cols-2">
          <div class="rounded-lg bg-red-50 p-6 dark:bg-red-900/20">
            <h4
              class="mb-4 text-xl font-semibold text-red-700 dark:text-red-400"
            >
              Customer Pain Points
            </h4>
            <ul class="space-y-3 text-gray-700 dark:text-gray-300">
              <li>• Difficulty finding reliable cleaning services quickly</li>
              <li>• Time-consuming process of sourcing trustworthy cleaners</li>
              <li>• Lack of transparency in pricing and scheduling</li>
              <li>
                • Uncertainty about cleaner qualifications and reliability
              </li>
              <li>• No standardized quality assurance or recourse options</li>
            </ul>
          </div>

          <div class="rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
            <h4
              class="mb-4 text-xl font-semibold text-blue-700 dark:text-blue-400"
            >
              Service Provider Challenges
            </h4>
            <ul class="space-y-3 text-gray-700 dark:text-gray-300">
              <li>• Limited access to a steady stream of clients</li>
              <li>• Difficulty setting fair rates and managing schedules</li>
              <li>• No platform to showcase skills and build reputation</li>
              <li>• Unreliable income without consistent work opportunities</li>
              <li>
                • Lack of professional development and growth opportunities
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <h3 class="mb-6 text-2xl font-semibold">Our Solution</h3>
        <div class="grid gap-6 md:grid-cols-3">
          <div class="text-center">
            <div
              class="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20"
            >
              <svg
                class="h-8 w-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h4 class="mb-3 text-xl font-semibold text-secondary">
              Easy Booking
            </h4>
            <p class="text-gray-700 dark:text-gray-300">
              Simple online platform to book pre-vetted cleaning professionals
              on demand with flexible scheduling
            </p>
          </div>

          <div class="text-center">
            <div
              class="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20"
            >
              <svg
                class="h-8 w-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h4 class="mb-3 text-xl font-semibold text-secondary">
              Verified Cleaners
            </h4>
            <p class="text-gray-700 dark:text-gray-300">
              All service providers are thoroughly vetted, background-checked,
              and continuously rated by customers
            </p>
          </div>

          <div class="text-center">
            <div
              class="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20"
            >
              <svg
                class="h-8 w-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <h4 class="mb-3 text-xl font-semibold text-secondary">
              Transparent Pricing
            </h4>
            <p class="text-gray-700 dark:text-gray-300">
              Clear, upfront pricing with no hidden fees, secure payment
              processing, and satisfaction guarantees
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Market Opportunity -->
    <section id="market-opportunity" class="mb-16">
      <h2 class="mb-8 text-4xl font-bold text-primary">Market Opportunity</h2>

      <div class="mb-8 grid gap-8 md:grid-cols-3">
        <div
          class="rounded-xl bg-white p-6 text-center shadow-lg dark:bg-gray-800"
        >
          <p class="text-4xl font-bold text-secondary">R20B+</p>
          <p class="text-gray-700 dark:text-gray-300">
            Total addressable market for home cleaning services in South Africa
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

      <div class="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <h3 class="mb-6 text-2xl font-semibold">Target Market Analysis</h3>
        <div class="grid gap-8 md:grid-cols-2">
          <div>
            <h4 class="mb-4 text-xl font-semibold">
              Primary Customer Segments
            </h4>
            <ul class="space-y-3 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Young professionals</strong> - Ages 25-40 with limited time
                for household chores
              </li>
              <li>
                <strong>First-time parents</strong> - Needing support with home maintenance
                while caring for children
              </li>
              <li>
                <strong>Dual-income households</strong> - Seeking better work-life
                balance through outsourced cleaning
              </li>
              <li>
                <strong>Small local businesses</strong> - Requiring reliable commercial
                cleaning services
              </li>
              <li>
                <strong>Elderly residents</strong> - Need assistance with regular
                home maintenance
              </li>
            </ul>
          </div>

          <div>
            <h4 class="mb-4 text-xl font-semibold">
              South African Market Context
            </h4>
            <div class="space-y-4">
              <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                <h5 class="font-semibold text-gray-900 dark:text-white">
                  Economic Factors
                </h5>
                <ul
                  class="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300"
                >
                  <li>• Growing middle class with disposable income</li>
                  <li>• Increasing urbanisation in major cities</li>
                  <li>• High smartphone penetration (>80%)</li>
                </ul>
              </div>

              <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                <h5 class="font-semibold text-gray-900 dark:text-white">
                  Market Drivers
                </h5>
                <ul
                  class="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300"
                >
                  <li>• Rising demand for convenience services</li>
                  <li>• Trust and safety concerns with informal sector</li>
                  <li>• Digital transformation acceleration post-COVID</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Business Model -->
    <section id="business-model" class="mb-16">
      <h2 class="mb-8 text-4xl font-bold text-primary">Business Model</h2>

      <div class="mb-8 grid gap-8 md:grid-cols-2">
        <div class="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <h3 class="mb-6 text-2xl font-semibold text-secondary">
            Revenue Streams
          </h3>
          <div class="space-y-4">
            <div class="border-l-4 border-primary pl-4">
              <h4 class="font-semibold">Service Commission (Primary)</h4>
              <p class="text-gray-700 dark:text-gray-300">
                20-25% commission on each completed booking
              </p>
            </div>
            <div class="border-l-4 border-secondary pl-4">
              <h4 class="font-semibold">Premium Listings</h4>
              <p class="text-gray-700 dark:text-gray-300">
                Featured placement for cleaners (R200-500/month)
              </p>
            </div>
            <div class="border-l-4 border-accent pl-4">
              <h4 class="font-semibold">Subscription Plans</h4>
              <p class="text-gray-700 dark:text-gray-300">
                Monthly packages for frequent customers and businesses
              </p>
            </div>
            <div class="border-l-4 border-gray-400 pl-4">
              <h4 class="font-semibold">Add-on Services</h4>
              <p class="text-gray-700 dark:text-gray-300">
                Special cleaning services at premium rates
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <h3 class="mb-6 text-2xl font-semibold text-secondary">
            Pricing Strategy
          </h3>
          <div class="space-y-6">
            <div>
              <h4 class="font-semibold text-gray-900 dark:text-white">
                Residential Cleaning
              </h4>
              <p class="text-2xl font-bold text-primary">R350 - R550</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Per service (based on home size and requirements)
              </p>
            </div>

            <div>
              <h4 class="font-semibold text-gray-900 dark:text-white">
                Commercial Cleaning
              </h4>
              <p class="text-2xl font-bold text-primary">R450 - R650</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Per booking (based on facility type and frequency)
              </p>
            </div>

            <div class="rounded-lg bg-primary/10 p-4">
              <h4 class="font-semibold">
                Unit Economics (Per Average Booking)
              </h4>
              <div class="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p class="font-medium">
                    Average Booking Value: <span class="text-primary">R450</span
                    >
                  </p>
                  <p class="font-medium">
                    Platform Revenue (25%): <span class="text-primary"
                      >R112.50</span
                    >
                  </p>
                </div>
                <div>
                  <p class="font-medium">
                    Customer Acquisition Cost: <span class="text-gray-600"
                      >R30</span
                    >
                  </p>
                  <p class="font-medium">
                    Contribution Margin: <span class="text-green-600"
                      >R82.50</span
                    >
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Competitive Analysis -->
    <section id="competitive-analysis" class="mb-16">
      <h2 class="mb-8 text-4xl font-bold text-primary">Competitive Analysis</h2>

      <div class="mb-8 rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <h3 class="mb-6 text-2xl font-semibold">Competitive Advantages</h3>
        <div class="grid gap-6 md:grid-cols-2">
          <div class="space-y-4">
            <div class="rounded-lg bg-primary/10 p-4">
              <h4 class="font-semibold text-primary">Technology Edge</h4>
              <p class="text-gray-700 dark:text-gray-300">
                Custom matching algorithm that pairs customers with available
                cleaners based on location, service needs, and preferences
              </p>
            </div>

            <div class="rounded-lg bg-secondary/10 p-4">
              <h4 class="font-semibold text-secondary">User Experience</h4>
              <p class="text-gray-700 dark:text-gray-300">
                Seamless booking experience with integrated payment processing
                and real-time tracking
              </p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="rounded-lg bg-accent/10 p-4">
              <h4 class="font-semibold text-accent">Market Focus</h4>
              <p class="text-gray-700 dark:text-gray-300">
                Strategic service mapping optimised specifically for South
                African urban centers
              </p>
            </div>

            <div class="rounded-lg bg-green-100 p-4 dark:bg-green-900/20">
              <h4 class="font-semibold text-green-700 dark:text-green-400">
                Quality Assurance
              </h4>
              <p class="text-gray-700 dark:text-gray-300">
                Comprehensive vetting system with background checks and
                continuous quality monitoring
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <h3 class="mb-6 text-2xl font-semibold">Competitive Matrix</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="py-3 text-left font-semibold">Features</th>
                <th class="py-3 text-center font-semibold text-primary"
                  >BrightBroom</th
                >
                <th class="py-3 text-center font-semibold"
                  >Traditional Agencies</th
                >
                <th class="py-3 text-center font-semibold"
                  >Classified Listings</th
                >
                <th class="py-3 text-center font-semibold">Informal Sector</th>
              </tr>
            </thead>
            <tbody class="text-sm">
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <td class="py-3 text-gray-700 dark:text-gray-300"
                  >Online Booking</td
                >
                <td class="py-3 text-center text-green-500 text-xl">✓</td>
                <td class="py-3 text-center text-red-500 text-xl">✗</td>
                <td class="py-3 text-center text-red-500 text-xl">✗</td>
                <td class="py-3 text-center text-red-500 text-xl">✗</td>
              </tr>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <td class="py-3 text-gray-700 dark:text-gray-300"
                  >Background Checks</td
                >
                <td class="py-3 text-center text-green-500 text-xl">✓</td>
                <td class="py-3 text-center text-green-500 text-xl">✓</td>
                <td class="py-3 text-center text-red-500 text-xl">✗</td>
                <td class="py-3 text-center text-red-500 text-xl">✗</td>
              </tr>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <td class="py-3 text-gray-700 dark:text-gray-300"
                  >Quality Rating System</td
                >
                <td class="py-3 text-center text-green-500 text-xl">✓</td>
                <td class="py-3 text-center text-red-500 text-xl">✗</td>
                <td class="py-3 text-center text-red-500 text-xl">✗</td>
                <td class="py-3 text-center text-red-500 text-xl">✗</td>
              </tr>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <td class="py-3 text-gray-700 dark:text-gray-300"
                  >Same-Day Availability</td
                >
                <td class="py-3 text-center text-green-500 text-xl">✓</td>
                <td class="py-3 text-center text-red-500 text-xl">✗</td>
                <td class="py-3 text-center text-yellow-500 text-xl">~</td>
                <td class="py-3 text-center text-yellow-500 text-xl">~</td>
              </tr>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <td class="py-3 text-gray-700 dark:text-gray-300"
                  >Integrated Payments</td
                >
                <td class="py-3 text-center text-green-500 text-xl">✓</td>
                <td class="py-3 text-center text-red-500 text-xl">✗</td>
                <td class="py-3 text-center text-red-500 text-xl">✗</td>
                <td class="py-3 text-center text-red-500 text-xl">✗</td>
              </tr>
              <tr>
                <td class="py-3 text-gray-700 dark:text-gray-300"
                  >Price Transparency</td
                >
                <td class="py-3 text-center text-green-500 text-xl">✓</td>
                <td class="py-3 text-center text-red-500 text-xl">✗</td>
                <td class="py-3 text-center text-yellow-500 text-xl">~</td>
                <td class="py-3 text-center text-red-500 text-xl">✗</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Management Team -->
    <section id="team" class="mb-16">
      <h2 class="mb-8 text-4xl font-bold text-primary">Management Team</h2>

      <div class="mb-8 grid gap-8 md:grid-cols-2">
        {#each teamMembers as member}
          <div class="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
            <div
              class="flex flex-col items-center text-center md:flex-row md:items-start md:text-left"
            >
              <div
                class="mr-0 mb-6 h-32 w-32 overflow-hidden rounded-full md:mr-6 md:mb-0"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  class="h-full w-full object-cover"
                  on:error={(event) => {
                    const img = event.target;
                    img.style.display = "none";
                    const fallback = img.nextElementSibling;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
                <div
                  class="hidden h-full w-full items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary"
                >
                  {member.name.charAt(0)}
                </div>
              </div>
              <div class="flex-grow">
                <h3 class="text-2xl font-bold">{member.name}</h3>
                <p class="mb-3 text-lg text-secondary">{member.title}</p>
                <p
                  class="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed"
                >
                  {member.bio}
                </p>
                <div class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    <a
                      class="hover:text-primary transition-colors"
                      href="mailto:{member.email}">{member.email}</a
                    >
                  </p>
                  <p>
                    <a
                      class="hover:text-primary transition-colors"
                      href="tel:{member.phone}">{member.phone}</a
                    >
                  </p>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <div class="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <h3 class="mb-6 text-2xl font-semibold">Core Competencies</h3>
        <div class="grid gap-6 md:grid-cols-3">
          <div class="rounded-lg bg-primary/10 p-6">
            <h4 class="mb-3 font-semibold">Technical Expertise</h4>
            <ul class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• Full-stack web development</li>
              <li>• Modern web technologies (React, Node.js, PostgreSQL)</li>
              <li>• Marketplace platform development</li>
              <li>• Cloud infrastructure and DevOps</li>
              <li>• Mobile app development</li>
            </ul>
          </div>

          <div class="rounded-lg bg-secondary/10 p-6">
            <h4 class="mb-3 font-semibold">Legal & Administrative</h4>
            <ul class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• Legal compliance and regulatory knowledge</li>
              <li>• Contractor agreement management</li>
              <li>• Business structure optimisation</li>
              <li>• Administrative operations</li>
              <li>• Risk management</li>
            </ul>
          </div>

          <div class="rounded-lg bg-accent/10 p-6">
            <h4 class="mb-3 font-semibold">Industry Knowledge</h4>
            <ul class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• Cleaning service standards and protocols</li>
              <li>• Property management requirements</li>
              <li>• Quality control systems</li>
              <li>• Customer service excellence</li>
              <li>• Market dynamics and trends</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Operations Plan -->
    <section id="operations" class="mb-16">
      <h2 class="mb-8 text-4xl font-bold text-primary">Operations Plan</h2>

      <div class="mb-8 grid gap-8 md:grid-cols-2">
        <div class="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <h3 class="mb-6 text-2xl font-semibold">Service Delivery Process</h3>
          <div class="space-y-4">
            <div class="flex items-start">
              <div
                class="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold"
              >
                1
              </div>
              <div>
                <h4 class="font-semibold">Customer Booking</h4>
                <p class="text-sm text-gray-700 dark:text-gray-300">
                  Customer selects service, date, and preferences through web
                  platform
                </p>
              </div>
            </div>

            <div class="flex items-start">
              <div
                class="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold"
              >
                2
              </div>
              <div>
                <h4 class="font-semibold">Automatic Matching</h4>
                <p class="text-sm text-gray-700 dark:text-gray-300">
                  Algorithm matches request with available cleaners based on
                  location and expertise
                </p>
              </div>
            </div>

            <div class="flex items-start">
              <div
                class="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold"
              >
                3
              </div>
              <div>
                <h4 class="font-semibold">Confirmation & Preparation</h4>
                <p class="text-sm text-gray-700 dark:text-gray-300">
                  Cleaner confirms availability, customer receives details and
                  preparation instructions
                </p>
              </div>
            </div>

            <div class="flex items-start">
              <div
                class="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold"
              >
                4
              </div>
              <div>
                <h4 class="font-semibold">Service Delivery</h4>
                <p class="text-sm text-gray-700 dark:text-gray-300">
                  Professional cleaning service delivered with real-time updates
                  and quality checks
                </p>
              </div>
            </div>

            <div class="flex items-start">
              <div
                class="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold"
              >
                5
              </div>
              <div>
                <h4 class="font-semibold">Completion & Feedback</h4>
                <p class="text-sm text-gray-700 dark:text-gray-300">
                  Service completed, payment processed, and feedback collected
                  for continuous improvement
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <h3 class="mb-6 text-2xl font-semibold">Quality Assurance</h3>
          <div class="space-y-6">
            <div class="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
              <h4 class="mb-3 font-semibold text-green-700 dark:text-green-400">
                Cleaner Vetting Process
              </h4>
              <ul class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>• Comprehensive background checks</li>
                <li>• Skills assessment and certification</li>
                <li>• Reference verification</li>
                <li>• Insurance and bonding requirements</li>
                <li>• Ongoing performance monitoring</li>
              </ul>
            </div>

            <div class="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <h4 class="mb-3 font-semibold text-blue-700 dark:text-blue-400">
                Service Standards
              </h4>
              <ul class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>• Standardized cleaning checklists</li>
                <li>• Time management protocols</li>
                <li>• Customer communication guidelines</li>
                <li>• Equipment and supply standards</li>
                <li>• Satisfaction guarantee policies</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <h3 class="mb-6 text-2xl font-semibold">Current Traction</h3>
        <div class="grid gap-6 md:grid-cols-4">
          <div class="rounded-lg bg-primary/10 p-4 text-center">
            <p class="text-3xl font-bold text-secondary">{data.stats.customers}+</p>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              Customer Sign-ups
            </p>
          </div>
          <div class="rounded-lg bg-primary/10 p-4 text-center">
            <p class="text-3xl font-bold text-secondary">{data.stats.cleaners}+</p>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              Cleaner Applications
            </p>
          </div>
          <div class="rounded-lg bg-primary/10 p-4 text-center">
            <p class="text-3xl font-bold text-secondary">3</p>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              Service Areas
            </p>
          </div>
          <div class="rounded-lg bg-primary/10 p-4 text-center">
            <p class="text-3xl font-bold text-secondary">5%</p>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              Weekly Growth Rate
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Financial Projections -->
    <section id="financials" class="mb-16">
      <h2 class="mb-8 text-4xl font-bold text-primary">
        Financial Projections
      </h2>

      <div class="mb-8 rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <h3 class="mb-6 text-2xl font-semibold">
          Revenue Projections (3-Year)
        </h3>
        <div class="grid gap-6 md:grid-cols-3">
          <div class="rounded-lg bg-gray-50 p-6 dark:bg-gray-700">
            <h4 class="mb-3 text-xl font-semibold text-primary">Year 1</h4>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Revenue</span>
                <span class="font-semibold text-green-600">R1,200,000</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Expenses</span>
                <span class="font-semibold text-red-600">R1,800,000</span>
              </div>
              <div class="flex justify-between border-t pt-2">
                <span class="font-semibold">Net Income</span>
                <span class="font-bold text-red-600">-R600,000</span>
              </div>
            </div>
          </div>

          <div class="rounded-lg bg-gray-50 p-6 dark:bg-gray-700">
            <h4 class="mb-3 text-xl font-semibold text-primary">Year 2</h4>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Revenue</span>
                <span class="font-semibold text-green-600">R3,600,000</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Expenses</span>
                <span class="font-semibold text-red-600">R3,000,000</span>
              </div>
              <div class="flex justify-between border-t pt-2">
                <span class="font-semibold">Net Income</span>
                <span class="font-bold text-green-600">R600,000</span>
              </div>
            </div>
          </div>

          <div class="rounded-lg bg-gray-50 p-6 dark:bg-gray-700">
            <h4 class="mb-3 text-xl font-semibold text-primary">Year 3</h4>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Revenue</span>
                <span class="font-semibold text-green-600">R8,400,000</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Expenses</span>
                <span class="font-semibold text-red-600">R5,200,000</span>
              </div>
              <div class="flex justify-between border-t pt-2">
                <span class="font-semibold">Net Income</span>
                <span class="font-bold text-green-600">R3,200,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <h3 class="mb-6 text-2xl font-semibold">Key Performance Indicators</h3>
        <div class="grid gap-6 md:grid-cols-2">
          <div>
            <h4 class="mb-4 font-semibold">Operational Metrics</h4>
            <ul class="space-y-3 text-gray-700 dark:text-gray-300">
              <li>• <strong>Operational breakeven:</strong> Month 12</li>
              <li>• <strong>Total bookings by Year 2:</strong> 12,000+</li>
              <li>• <strong>Active cleaners by Year 2:</strong> 200+</li>
              <li>• <strong>Customer acquisition cost:</strong> R30</li>
              <li>• <strong>Customer lifetime value:</strong> R1,200</li>
            </ul>
          </div>

          <div>
            <h4 class="mb-4 font-semibold">Growth Targets</h4>
            <ul class="space-y-3 text-gray-700 dark:text-gray-300">
              <li>
                • <strong>Monthly recurring bookings:</strong> 40% by Year 2
              </li>
              <li>
                • <strong>Average order value growth:</strong> 15% annually
              </li>
              <li>
                • <strong>Market expansion:</strong> 3 major cities by Year 3
              </li>
              <li>• <strong>Customer retention rate:</strong> 75%+</li>
              <li>• <strong>Cleaner retention rate:</strong> 80%+</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Funding Request -->
    <section id="funding" class="mb-16">
      <h2 class="mb-8 text-4xl font-bold text-primary">Funding Request</h2>

      <div class="mb-8 grid gap-8 md:grid-cols-2">
        <div class="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <h3 class="mb-6 text-2xl font-semibold text-secondary">
            Investment Ask
          </h3>
          <div class="mb-6 rounded-lg bg-primary/10 p-8 text-center">
            <p class="text-5xl font-bold text-primary">R2,000,000</p>
            <p class="text-xl text-gray-700 dark:text-gray-300">
              Seed Investment Round
            </p>
          </div>

          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <span class="font-medium">Equity Offered</span>
              <span class="text-lg font-bold text-secondary">15-20%</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="font-medium">Use of Funds</span>
              <span class="text-lg font-bold">18 Months</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="font-medium">Expected ROI</span>
              <span class="text-lg font-bold text-green-600"
                >3.5x in 3 years</span
              >
            </div>
          </div>
        </div>

        <div class="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <h3 class="mb-6 text-2xl font-semibold text-secondary">
            Fund Allocation
          </h3>
          <div class="space-y-4">
            <div>
              <div class="mb-2 flex items-center justify-between">
                <span class="text-gray-700 dark:text-gray-300"
                  >Technology Development</span
                >
                <span class="font-semibold">R600,000 (30%)</span>
              </div>
              <div class="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  class="h-3 rounded-full bg-primary"
                  style="width: 30%"
                ></div>
              </div>
            </div>

            <div>
              <div class="mb-2 flex items-center justify-between">
                <span class="text-gray-700 dark:text-gray-300"
                  >Marketing & Customer Acquisition</span
                >
                <span class="font-semibold">R500,000 (25%)</span>
              </div>
              <div class="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  class="h-3 rounded-full bg-secondary"
                  style="width: 25%"
                ></div>
              </div>
            </div>

            <div>
              <div class="mb-2 flex items-center justify-between">
                <span class="text-gray-700 dark:text-gray-300"
                  >Operations Setup</span
                >
                <span class="font-semibold">R400,000 (20%)</span>
              </div>
              <div class="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  class="h-3 rounded-full bg-accent"
                  style="width: 20%"
                ></div>
              </div>
            </div>

            <div>
              <div class="mb-2 flex items-center justify-between">
                <span class="text-gray-700 dark:text-gray-300"
                  >Working Capital & Contingency</span
                >
                <span class="font-semibold">R500,000 (25%)</span>
              </div>
              <div class="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  class="h-3 rounded-full bg-green-500"
                  style="width: 25%"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <h3 class="mb-6 text-2xl font-semibold">Investment Highlights</h3>
        <div class="grid gap-6 md:grid-cols-3">
          <div class="rounded-lg bg-green-50 p-6 dark:bg-green-900/20">
            <h4 class="mb-3 font-semibold text-green-700 dark:text-green-400">
              Market Potential
            </h4>
            <ul class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• R20B+ addressable market</li>
              <li>• 15% annual growth rate</li>
              <li>• Underserved market segment</li>
              <li>• Strong economic fundamentals</li>
            </ul>
          </div>

          <div class="rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
            <h4 class="mb-3 font-semibold text-blue-700 dark:text-blue-400">
              Competitive Advantage
            </h4>
            <ul class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• First-mover advantage</li>
              <li>• Proprietary technology</li>
              <li>• Strong team expertise</li>
              <li>• Scalable business model</li>
            </ul>
          </div>

          <div class="rounded-lg bg-purple-50 p-6 dark:bg-purple-900/20">
            <h4 class="mb-3 font-semibold text-purple-700 dark:text-purple-400">
              Exit Strategy
            </h4>
            <ul class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• Series A in 18-24 months</li>
              <li>• Strategic acquisition potential</li>
              <li>• IPO path in 5-7 years</li>
              <li>• Regional expansion opportunities</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Strategic Roadmap -->
    <section id="roadmap" class="mb-16">
      <h2 class="mb-8 text-4xl font-bold text-primary">Strategic Roadmap</h2>

      <div class="mb-8 rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <h3 class="mb-6 text-2xl font-semibold">Next 18 Months</h3>
        <div class="relative ml-6 border-l-4 border-primary pl-8">
          <div class="mb-8">
            <div
              class="absolute -left-[14px] flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white font-bold"
            >
              1
            </div>
            <h4 class="mb-2 font-semibold text-secondary">
              Months 1-2: Foundation
            </h4>
            <ul class="space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Implement comprehensive cleaner vetting system</li>
              <li>• Launch customer onboarding improvements</li>
              <li>• Establish quality assurance protocols</li>
            </ul>
          </div>

          <div class="mb-8">
            <div
              class="absolute -left-[14px] flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white font-bold"
            >
              2
            </div>
            <h4 class="mb-2 font-semibold text-secondary">
              Months 3-6: Growth
            </h4>
            <ul class="space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Reach 50 active cleaners on platform</li>
              <li>• Achieve 50+ monthly bookings</li>
              <li>• Launch customer referral program</li>
              <li>• Implement advanced matching algorithm</li>
            </ul>
          </div>

          <div class="mb-8">
            <div
              class="absolute -left-[14px] flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white font-bold"
            >
              3
            </div>
            <h4 class="mb-2 font-semibold text-secondary">
              Months 7-9: Enhancement
            </h4>
            <ul class="space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Launch Progressive Web App (PWA)</li>
              <li>• Establish strategic partnerships</li>
              <li>• Introduce subscription packages</li>
              <li>• Expand to commercial cleaning services</li>
            </ul>
          </div>

          <div class="mb-8">
            <div
              class="absolute -left-[14px] flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white font-bold"
            >
              4
            </div>
            <h4 class="mb-2 font-semibold text-secondary">
              Months 10-12: Expansion
            </h4>
            <ul class="space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Launch in Cape Town market</li>
              <li>• Achieve 200+ monthly bookings</li>
              <li>• Implement advanced analytics dashboard</li>
              <li>• Begin Series A fundraising preparation</li>
            </ul>
          </div>

          <div>
            <div
              class="absolute -left-[14px] flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white font-bold"
            >
              5
            </div>
            <h4 class="mb-2 font-semibold text-secondary">
              Months 15-18: Scale
            </h4>
            <ul class="space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Achieve operational breakeven</li>
              <li>• Launch in Durban market</li>
              <li>• Introduce premium services</li>
              <li>• Prepare for Series A funding round</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="grid gap-8 md:grid-cols-2">
        <div class="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <h3 class="mb-6 text-2xl font-semibold">Years 2-3: Expansion</h3>
          <ul class="space-y-3 text-gray-700 dark:text-gray-300">
            <li>
              • <strong>Geographic Expansion:</strong> Launch in all major South
              African cities
            </li>
            <li>
              • <strong>Service Diversification:</strong> Add gardening, pool cleaning,
              and maintenance services
            </li>
            <li>
              • <strong>Technology Enhancement:</strong> AI-powered scheduling and
              demand prediction
            </li>
            <li>
              • <strong>Partnership Development:</strong> Strategic alliances with
              property management companies
            </li>
            <li>
              • <strong>Series A Funding:</strong> R15-20M raise for rapid expansion
            </li>
          </ul>
        </div>

        <div class="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <h3 class="mb-6 text-2xl font-semibold">
            Years 4-5: Market Leadership
          </h3>
          <ul class="space-y-3 text-gray-700 dark:text-gray-300">
            <li>
              • <strong>Regional Expansion:</strong> Enter neighboring African markets
            </li>
            <li>
              • <strong>Platform Evolution:</strong> Full home services marketplace
            </li>
            <li>
              • <strong>Strategic Acquisitions:</strong> Consolidate market position
            </li>
            <li>
              • <strong>Exit Preparation:</strong> IPO readiness or strategic sale
            </li>
            <li>
              • <strong>Market Leadership:</strong> #1 home services platform in
              South Africa
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Risk Analysis -->
    <section id="risks" class="mb-16">
      <h2 class="mb-8 text-4xl font-bold text-primary">
        Risk Analysis & Mitigation
      </h2>

      <div class="grid gap-8 md:grid-cols-2">
        <div class="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <h3 class="mb-6 text-2xl font-semibold text-red-600">Key Risks</h3>
          <div class="space-y-4">
            <div class="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <h4 class="font-semibold text-red-700 dark:text-red-400">
                Market Competition
              </h4>
              <p class="text-sm text-gray-700 dark:text-gray-300 mt-1">
                Large tech companies or established agencies entering the market
              </p>
            </div>

            <div class="rounded-lg bg-orange-50 p-4 dark:bg-orange-900/20">
              <h4 class="font-semibold text-orange-700 dark:text-orange-400">
                Economic Downturn
              </h4>
              <p class="text-sm text-gray-700 dark:text-gray-300 mt-1">
                Reduced consumer spending on non-essential services
              </p>
            </div>

            <div class="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
              <h4 class="font-semibold text-yellow-700 dark:text-yellow-400">
                Regulatory Changes
              </h4>
              <p class="text-sm text-gray-700 dark:text-gray-300 mt-1">
                New labor laws or platform regulations affecting operations
              </p>
            </div>

            <div class="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
              <h4 class="font-semibold text-purple-700 dark:text-purple-400">
                Quality Control
              </h4>
              <p class="text-sm text-gray-700 dark:text-gray-300 mt-1">
                Maintaining service quality across growing cleaner network
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <h3 class="mb-6 text-2xl font-semibold text-green-600">
            Mitigation Strategies
          </h3>
          <div class="space-y-4">
            <div class="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
              <h4 class="font-semibold text-green-700 dark:text-green-400">
                Competitive Moat
              </h4>
              <p class="text-sm text-gray-700 dark:text-gray-300 mt-1">
                Build strong brand loyalty and network effects through quality
                service
              </p>
            </div>

            <div class="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <h4 class="font-semibold text-blue-700 dark:text-blue-400">
                Diversified Revenue
              </h4>
              <p class="text-sm text-gray-700 dark:text-gray-300 mt-1">
                Multiple revenue streams and flexible pricing models
              </p>
            </div>

            <div class="rounded-lg bg-indigo-50 p-4 dark:bg-indigo-900/20">
              <h4 class="font-semibold text-indigo-700 dark:text-indigo-400">
                Compliance Focus
              </h4>
              <p class="text-sm text-gray-700 dark:text-gray-300 mt-1">
                Proactive legal compliance and industry best practices
              </p>
            </div>

            <div class="rounded-lg bg-teal-50 p-4 dark:bg-teal-900/20">
              <h4 class="font-semibold text-teal-700 dark:text-teal-400">
                Quality Systems
              </h4>
              <p class="text-sm text-gray-700 dark:text-gray-300 mt-1">
                Robust vetting, training, and continuous monitoring programs
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Conclusion -->
    <section class="mb-16">
      <div
        class="rounded-xl bg-gradient-to-r from-primary to-secondary p-8 text-white shadow-lg"
      >
        <h2 class="mb-6 text-4xl font-bold">Investment Opportunity</h2>
        <div class="grid gap-8 md:grid-cols-2">
          <div>
            <h3 class="mb-4 text-2xl font-semibold">Why BrightBroom</h3>
            <ul class="space-y-2">
              <li>• Proven market demand with early traction</li>
              <li>• Experienced founding team with complementary skills</li>
              <li>• Scalable technology platform</li>
              <li>• Clear path to profitability</li>
              <li>• Strong competitive advantages</li>
            </ul>
          </div>

          <div>
            <h3 class="mb-4 text-2xl font-semibold">The Opportunity</h3>
            <ul class="space-y-2">
              <li>• R20B+ market opportunity in South Africa</li>
              <li>• First-mover advantage in digital cleaning services</li>
              <li>• 3.5x projected return on investment</li>
              <li>• Clear exit strategy through Series A or acquisition</li>
              <li>• Positive social impact through job creation</li>
            </ul>
          </div>
        </div>

        <div class="mt-8 text-center">
          <p class="text-xl font-semibold">
            Join us in revolutionising the cleaning services industry in South
            Africa
          </p>
        </div>
      </div>
    </section>
  </main>

  <!-- Footer -->
  <footer class="bg-gray-800 py-8 text-white">
    <div class="container mx-auto px-6 text-center">
      <h3 class="mb-4 text-2xl font-bold">Contact Information</h3>
      <div class="grid gap-6 md:grid-cols-2">
        <div>
          <p class="font-semibold">Thando Somacele - CEO & CTO</p>
          <p>thando@brightbroom.com | 072 225 1491</p>
        </div>
        {#if teamMembers.length > 1}
          <div>
            <p class="font-semibold">Sharon Somacele - CLO & COO</p>
            <p>sharon@brightbroom.com | 078 176 7075</p>
          </div>
        {/if}
      </div>
      <div class="mt-6">
        <p class="text-gray-400">BrightBroom - Cleaner Bookings Made Simple</p>
      </div>
    </div>
  </footer>

  <!-- Scroll to top button -->
  {#if showScrollTop}
    <button
      on:click={scrollToTop}
      class="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all duration-200 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      aria-label="Scroll to top"
    >
      <ArrowUp size={20} />
    </button>
  {/if}
</div>
