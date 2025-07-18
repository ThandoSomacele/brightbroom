<!-- src/routes/about/+page.svelte -->
<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte";
  import { Award, CheckCircle, TrendingUp, Users } from "lucide-svelte";

  // Page data - in a real app, this might come from a CMS or API
  // const stats = [
  //   { label: "Happy Customers", value: "2,500+" },
  //   { label: "Bookings Completed", value: "10,000+" },
  //   { label: "Professional Cleaners", value: "150+" },
  //   { label: "Cities Covered", value: "5" },
  // ];

  const coreValues = [
    {
      title: "Quality Service",
      description:
        "We're committed to providing exceptional cleaning services that exceed your expectations every time.",
      icon: CheckCircle,
    },
    {
      title: "Reliable Team",
      description:
        "Our professional cleaners are thoroughly vetted, trained, and dedicated to delivering consistent results.",
      icon: Users,
    },
    {
      title: "Transparent Pricing",
      description:
        "No hidden fees or surprises. We believe in clear, upfront pricing for all our services.",
      icon: Award,
    },
    {
      title: "Continuous Improvement",
      description:
        "We constantly seek feedback and improve our processes to provide better service.",
      icon: TrendingUp,
    },
  ];

  // const teamMembers = [
  //   {
  //     name: "Sarah Johnson",
  //     role: "Founder & CEO",
  //     bio: "Sarah founded BrightBroom with a vision to revolutionise the cleaning industry through technology and exceptional service.",
  //     image: "/images/team/sarah.jpg", // You would add these images to your static folder
  //   },
  //   {
  //     name: "David Nkosi",
  //     role: "Head of Operations",
  //     bio: "David oversees all cleaning operations, ensuring our team delivers consistent, high-quality service to every customer.",
  //     image: "/images/team/david.jpg",
  //   },
  //   {
  //     name: "Priya Patel",
  //     role: "Customer Experience",
  //     bio: "Priya leads our customer support team, making sure every BrightBroom client has an exceptional experience.",
  //     image: "/images/team/priya.jpg",
  //   },
  // ];
</script>

<svelte:head>
  <title>About BrightBroom | Professional Cleaning Services</title>
  <meta
    name="description"
    content="Learn about BrightBroom, our mission, values, and the team behind our professional cleaning services."
  />

  <!-- Open Graph -->
  <meta
    property="og:title"
    content="About BrightBroom | Professional Cleaning Services"
  />
  <meta
    property="og:description"
    content="Learn about BrightBroom, our mission, values, and the team behind our professional cleaning services."
  />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://brightbroom.com/about" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary" />
  <meta
    name="twitter:title"
    content="About BrightBroom | Professional Cleaning Services"
  />
  <meta
    name="twitter:description"
    content="Learn about BrightBroom, our mission, values, and the team behind our professional cleaning services."
  />

  <!-- Structured Data -->
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organisation",
      "name": "BrightBroom",
      "url": "https://brightbroom.com",
      "logo": "https://brightbroom.com/images/brightbroom-logo.png",
      "description": "BrightBroom is a professional cleaning service company that provides on-demand cleaning solutions for homes and offices.",
      "foundingDate": "2023",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "123 Main Street",
        "addressLocality": "Johannesburg",
        "addressRegion": "Gauteng",
        "postalCode": "2000",
        "addressCountry": "ZA"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+27-11-123-4567",
        "contactType": "Customer Service",
        "areaServed": "ZA",
        "availableLanguage": "English"
      },
      "sameAs": [
        "https://www.facebook.com/brightbroom",
        "https://www.instagram.com/brightbroom",
        "https://twitter.com/brightbroom"
      ],
      "knowsAbout": [
        "House Cleaning",
        "Office Cleaning",
        "Deep Cleaning",
        "Regular Cleaning",
        "Commercial Cleaning"
      ]
    }
  </script>
</svelte:head>

<!-- Hero Section -->
<section class="bg-white py-16 dark:bg-gray-800">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="text-center">
      <h1
        class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white md:text-5xl"
      >
        About BrightBroom
      </h1>
      <p
        class="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300"
      >
        Revolutionising the cleaning industry with technology, transparency, and
        exceptional service.
      </p>
    </div>
  </div>
</section>

<!-- Our Story Section -->
<!-- <section class="bg-gray-50 py-16 dark:bg-gray-900">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="grid gap-12 md:grid-cols-2">
      <div class="flex flex-col justify-center">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
          Our Story
        </h2>
        <div class="mt-6 space-y-6 text-lg text-gray-600 dark:text-gray-300">
          <p>
            BrightBroom began in 2020 when our founder, Sarah Johnson,
            experienced firsthand the challenges of finding reliable,
            transparent cleaning services. After struggling with inconsistent
            quality, hidden fees, and poor scheduling options, she recognised an
            opportunity to transform the industry.
          </p>
          <p>
            What started as a small team serving the Cape Town area has grown
            into a trusted platform connecting thousands of customers with
            professional cleaners across South Africa. Our mission remains the
            same: to make high-quality cleaning services accessible to everyone
            through technology, transparency, and exceptional service.
          </p>
          <p>
            Today, BrightBroom continues to grow, bringing our vision of
            hassle-free cleaning services to more homes and offices while
            creating flexible employment opportunities for cleaning
            professionals.
          </p>
        </div>
      </div>
      <div class="flex items-center justify-center">
        <img
          src="/images/about/office.jpg"
          alt="BrightBroom team at the office"
          class="rounded-lg shadow-md h-auto w-full max-w-md"
        />
      </div>
    </div>
  </div>
</section> -->

<!-- Core Values Section -->
<section class="bg-primary py-16 dark:bg-gray-800">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-white dark:text-white">
        Our Core Values
      </h2>
      <p class="mt-4 text-lg text-white dark:text-gray-300">
        The principles that guide everything we do at BrightBroom
      </p>
    </div>

    <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
      {#each coreValues as value}
        <div
          class="rounded-lg bg-gray-50 p-6 shadow-md transition-transform hover:-translate-y-1 dark:bg-gray-700"
        >
          <div class="mb-4 text-primary">
            <svelte:component this={value.icon} class="h-8 w-8" />
          </div>
          <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            {value.title}
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            {value.description}
          </p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- Stats Section -->
<!-- <section class="bg-primary py-16">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-white">By the Numbers</h2>
      <p class="mt-4 text-lg text-white/80">
        Our impact since launching BrightBroom
      </p>
    </div>
    
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {#each stats as stat}
        <div class="rounded-lg bg-white/10 p-6 text-center">
          <p class="text-3xl font-bold text-white">{stat.value}</p>
          <p class="mt-2 text-lg text-white/80">{stat.label}</p>
        </div>
      {/each}
    </div>
  </div>
</section> -->

<!-- Team Section -->
<!-- <section class="bg-gray-50 py-16 dark:bg-gray-900">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Meet Our Team</h2>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-300">
        The people behind BrightBroom's success
      </p>
    </div>
    
    <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {#each teamMembers as member}
        <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <div class="mb-4 flex justify-center">
            <img 
              src="/api/placeholder/150/150" 
              alt={member.name} 
              class="h-32 w-32 rounded-full object-cover"
            />
          </div>
          <div class="text-center">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
              {member.name}
            </h3>
            <p class="text-primary font-medium">{member.role}</p>
            <p class="mt-4 text-gray-600 dark:text-gray-300">
              {member.bio}
            </p>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section> -->

<!-- CTA Section -->
<section class="bg-white py-16 dark:bg-gray-800">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="rounded-lg bg-gray-50 p-8 shadow-md dark:bg-gray-700">
      <div class="flex flex-col text-center items-center">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Ready to experience the BrightBroom difference?
        </h2>
        <p class="mt-4 text-lg text-gray-600 dark:text-gray-300">
          Book your first cleaning service today and see why thousands of
          customers trust BrightBroom.
        </p>
        <div
          class="mt-8 flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0"
        >
          <Button variant="secondary" href="/book">Book Now</Button>
          <Button variant="outline" href="/contact">Contact Us</Button>
        </div>
      </div>
    </div>
  </div>
</section>
