<!-- src/routes/pricing/+page.svelte -->
<!--
  What BrightBroom charges cleaning companies for their own booking platform.
  BrightBroom's own site only: a company's deployment answers 404 here (see
  BRIGHTBROOM_ONLY_PATHS in hooks.server.ts).
-->
<script lang="ts">
  import { brand, whatsappHref } from "$lib/config/brand";
  import Button from "$lib/components/ui/Button.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import Icon from "$lib/components/ui/Icon.svelte";

  // Rand. BrightBroom is not VAT-registered, so these are what clients pay.
  // Paying yearly = 12 months for the price of 10.
  const tiers = [
    { name: "Starter", cleaners: 5, monthly: 1500, setup: 7500 },
    { name: "Growth", cleaners: 15, monthly: 2500, setup: 10000 },
    { name: "Pro", cleaners: 40, monthly: 4000, setup: 15000 },
  ];
  const MONTHS_PAID_PER_YEAR = 10;
  const CUSTOM_WORK_PER_HOUR = 650;

  const included = [
    { icon: "credit-card", text: "Online booking and PayFast payments, including guest bookings and coupons" },
    { icon: "arrows-clockwise", text: "Recurring cleans, charged automatically" },
    { icon: "users", text: "Cleaner applications, profiles and assignment" },
    { icon: "squares-four", text: "An admin dashboard and a cleaner portal" },
    { icon: "envelope-simple", text: "Automatic confirmation and reminder emails" },
    { icon: "paint-brush", text: "Your own domain, name, logo and colours" },
    { icon: "shield-check", text: "Hosting in South Africa, backups, updates and support" },
  ];

  const steps = [
    {
      title: "See it working",
      text: "We walk you through the platform and agree on the plan that fits your team.",
    },
    {
      title: "We set it up",
      text: "Your site goes up on your domain with your name, logo and colours. We connect your PayFast account and load your services, prices and areas.",
    },
    {
      title: "Take bookings",
      text: "Your customers book and pay online. You pay the setup fee once, then the monthly fee.",
    },
  ];

  /** "R7,500": fixed format, so server and browser render the same text */
  const rand = (n: number) => `R${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  const demoLink = (plan?: string) =>
    `/contact?subject=${encodeURIComponent(plan ? `Demo request: ${plan} plan` : "Demo request")}`;

  const whatsappLink = whatsappHref();

  const title = `Pricing for cleaning companies | ${brand.name}`;
  const description = `Your own online booking system for your cleaning company, from ${rand(tiers[0].monthly)} a month. We set it up, host it and support it; your customers pay you directly through PayFast.`;
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
</svelte:head>

<!-- Hero -->
<section class="bg-white py-16 dark:bg-gray-800">
  <div class="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
    <p class="section-eyebrow mb-3">For cleaning companies</p>
    <h1
      class="font-heading text-4xl font-bold tracking-tight text-gray-900 dark:text-white md:text-5xl"
    >
      Your own online booking system
    </h1>
    <p class="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
      Your customers book and pay on your own website, under your name. We set it up, host it
      and keep it running.
    </p>
  </div>
</section>

<!-- Founding offer -->
<section class="bg-gray-50 pt-12 dark:bg-gray-900">
  <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
    <div
      class="flex items-start gap-3 rounded-lg border border-secondary-200 bg-secondary-50 p-4 dark:border-secondary-800 dark:bg-secondary-900/20"
    >
      <Icon name="gift" size={24} class="mt-0.5 text-secondary-700 dark:text-secondary-300" />
      <p class="text-secondary-900 dark:text-secondary-100">
        <span class="font-semibold">Founding offer:</span> the first three companies get half-price
        setup and their first month free, in exchange for a testimonial.
      </p>
    </div>
  </div>
</section>

<!-- Plans -->
<section class="bg-gray-50 py-12 dark:bg-gray-900">
  <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
    <div class="grid gap-6 md:grid-cols-3">
      {#each tiers as tier (tier.name)}
        <Card class="flex flex-col">
          <h2 class="font-heading text-2xl font-bold text-gray-900 dark:text-white">
            {tier.name}
          </h2>
          <p class="mt-1 text-gray-600 dark:text-gray-300">Up to {tier.cleaners} cleaners</p>

          <p class="mt-6">
            <span class="text-4xl font-bold text-gray-900 dark:text-white">{rand(tier.monthly)}</span>
            <span class="text-gray-600 dark:text-gray-300">/ month</span>
          </p>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
            or {rand(tier.monthly * MONTHS_PAID_PER_YEAR)} a year, paid upfront
          </p>

          <div class="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
            <p class="text-gray-900 dark:text-white">
              <span class="font-semibold">{rand(tier.setup)}</span> once-off setup
            </p>
          </div>

          <div class="mt-auto pt-6">
            <Button variant="primary" wide="full" href={demoLink(tier.name)}>Book a demo</Button>
          </div>
        </Card>
      {/each}
    </div>

    <ul class="mt-8 space-y-1 text-sm text-gray-600 dark:text-gray-300">
      <li>Every plan has a 12-month minimum term.</li>
      <li>
        Pay yearly and get 12 months for the price of {MONTHS_PAID_PER_YEAR}.
      </li>
      <li>
        Custom features are quoted separately, at about {rand(CUSTOM_WORK_PER_HOUR)} an hour.
      </li>
      <li>
        More than {tiers[tiers.length - 1].cleaners} cleaners?
        <a href={demoLink()} class="font-medium text-primary-700 hover:underline dark:text-primary-300"
          >Ask us for a quote</a
        >.
      </li>
    </ul>
  </div>
</section>

<!-- Included in every plan -->
<section class="bg-white py-16 dark:bg-gray-800">
  <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
    <h2 class="text-center text-3xl font-bold text-gray-900 dark:text-white">
      Every plan includes
    </h2>
    <ul class="mt-10 grid gap-x-8 gap-y-5 sm:grid-cols-2">
      {#each included as item (item.icon)}
        <li class="flex items-start gap-3">
          <Icon name={item.icon} size={24} class="mt-0.5 text-primary-700 dark:text-primary-300" accent />
          <span class="text-gray-700 dark:text-gray-200">{item.text}</span>
        </li>
      {/each}
    </ul>

    <div class="mt-12 rounded-lg bg-primary-50 p-6 dark:bg-primary-900/20">
      <h3 class="text-lg font-semibold text-primary-800 dark:text-primary-300">
        Your customers pay you directly
      </h3>
      <p class="mt-2 text-primary-800 dark:text-primary-200">
        Bookings are paid into your own PayFast account. We never hold your money, and we take no
        commission on your bookings.
      </p>
    </div>
  </div>
</section>

<!-- How it works -->
<section class="bg-gray-50 py-16 dark:bg-gray-900">
  <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
    <h2 class="text-center text-3xl font-bold text-gray-900 dark:text-white">How it works</h2>
    <ol class="mt-10 grid gap-6 md:grid-cols-3">
      {#each steps as step, i (step.title)}
        <li class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <span
            class="flex h-9 w-9 items-center justify-center rounded-full bg-primary-700 font-semibold text-white"
            >{i + 1}</span
          >
          <h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{step.title}</h3>
          <p class="mt-2 text-gray-600 dark:text-gray-300">{step.text}</p>
        </li>
      {/each}
    </ol>
  </div>
</section>

<!-- Call to action -->
<section class="bg-primary-700 py-16">
  <div class="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
    <h2 class="text-3xl font-bold text-white">See it with your own business in mind</h2>
    <p class="mt-4 text-lg text-white/90">
      Book a demo and we'll show you how bookings, payments and your cleaners fit together.
    </p>
    <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
      <Button variant="secondary" size="lg" href={demoLink()}>Book a demo</Button>
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center justify-center gap-2 rounded-md border border-white/70 px-6 py-3 font-medium text-white hover:bg-white/10"
      >
        <Icon name="whatsapp-logo" size={20} />
        WhatsApp {brand.supportPhone}
      </a>
    </div>
  </div>
</section>
