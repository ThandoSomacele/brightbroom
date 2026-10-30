<!-- src/routes/about/+page.svelte -->
<script lang="ts">
  import Icon from "$lib/components/ui/Icon.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import JsonLd from "$lib/components/seo/JsonLd.svelte";
  import { brand, isSingleCompany } from "$lib/config/brand";
  import PlatformAbout from "$lib/components/about/PlatformAbout.svelte";
  import { organizationJsonLd } from "$lib/seo/structured-data";

  // A company's site: about the cleaning company. brightbroom.com: about the software company.
  const title = isSingleCompany
    ? `About ${brand.name} | Professional Cleaning Services`
    : `About ${brand.name} | Booking software for cleaning companies`;
  const description = isSingleCompany
    ? `Learn about ${brand.name}, our mission and values, and how we deliver professional cleaning services.`
    : `${brand.name} builds booking software for South African cleaning companies: their own booking website, PayFast payments, recurring cleans and a cleaner portal.`;
  
  const coreValues = [
    {
      title: "Quality Service",
      description:
        "We're committed to providing exceptional cleaning services that exceed your expectations every time.",
      icon: "check-circle",
    },
    {
      title: "Reliable Team",
      description:
        "Our professional cleaners are thoroughly vetted, trained, and dedicated to delivering consistent results.",
      icon: "users",
    },
    {
      title: "Transparent Pricing",
      description:
        "No hidden fees or surprises. We believe in clear, upfront pricing for all our services.",
      icon: "medal",
    },
    {
      title: "Continuous Improvement",
      description:
        "We constantly seek feedback and improve our processes to provide better service.",
      icon: "trend-up",
    },
  ];

</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
</svelte:head>

<JsonLd data={organizationJsonLd()} />

{#if !isSingleCompany}
  <PlatformAbout />
{:else}
<!-- Hero Section -->
<section class="bg-white py-16 dark:bg-gray-800">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="text-center">
      <p class="section-eyebrow mb-3">About Us</p>
      <h1
        class="font-heading text-4xl font-bold tracking-tight text-gray-900 dark:text-white md:text-5xl"
      >
        About {brand.name}
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

<!-- Core Values Section -->
<section class="bg-primary-700 py-16 dark:bg-gray-800">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-white dark:text-white">
        Our Core Values
      </h2>
      <p class="mt-4 text-lg text-white dark:text-gray-300">
        The principles that guide everything we do at {brand.name}
      </p>
    </div>

    <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
      {#each coreValues as value}
        <Card hover>
          <div class="mb-4 text-primary-700">
            <Icon name={value.icon} size={32} accent />
          </div>
          <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            {value.title}
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            {value.description}
          </p>
        </Card>
      {/each}
    </div>
  </div>
</section>

<!-- CTA Section -->
<section class="bg-white py-16 dark:bg-gray-800">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <Card padding="lg">
      <div class="flex flex-col text-center items-center">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Ready to experience the {brand.name} difference?
        </h2>
        <p class="mt-4 text-lg text-gray-600 dark:text-gray-300">
          Book your first cleaning service today and see why customers trust
          {brand.name}.
        </p>
        <div
          class="mt-8 flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0"
        >
          <Button variant="secondary" href="/book">Book Now</Button>
          <Button variant="outline" href="/contact">Contact Us</Button>
        </div>
      </div>
    </Card>
  </div>
</section>
{/if}
