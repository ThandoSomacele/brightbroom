<!-- src/lib/components/about/PlatformAbout.svelte -->
<!-- brightbroom.com's About page: the company that builds booking software for cleaning companies -->
<script lang="ts">
  import { brand } from "$lib/config/brand";
  import Button from "$lib/components/ui/Button.svelte";
  import Icon from "$lib/components/ui/Icon.svelte";

  const demoRequest = `/contact?subject=${encodeURIComponent("Demo request")}`;

  const beliefs = [
    { icon: "paint-brush", title: "Your brand comes first", text: "Your customers book with your company, on your website, under your name. They never see ours." },
    { icon: "credit-card", title: "Your money stays yours", text: "Payments go straight into your own PayFast account. We charge a flat monthly fee and never take a commission." },
    { icon: "map-pin", title: "Built for South Africa", text: "PayFast payments, rand pricing, service areas by suburb, and customer data handled with POPIA in mind." },
    { icon: "chat-circle-dots", title: "Support from the people who built it", text: "When something needs changing, you talk to the team that wrote the software." },
  ];
</script>

<section class="bg-white py-16 dark:bg-gray-800">
  <div class="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
    <p class="section-eyebrow mb-3">About us</p>
    <h1 class="font-heading text-4xl font-bold tracking-tight text-gray-900 dark:text-white md:text-5xl">
      About {brand.name}
    </h1>
    <p class="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
      We build booking software for South African cleaning companies.
    </p>
  </div>
</section>

<section class="bg-gray-50 py-16 dark:bg-gray-900">
  <div class="mx-auto max-w-3xl space-y-5 px-4 text-lg text-gray-700 dark:text-gray-300 sm:px-6 lg:px-8">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Why we built it</h2>
    <p>
      {brand.name} began in Johannesburg as an online booking service for home cleaning. Running the bookings,
      the payments and a team of cleaners ourselves showed us how much of a cleaning company's day goes on
      quoting over WhatsApp, chasing payments and juggling who cleans where.
    </p>
    <p>
      So we turned the platform we built into something any cleaning company can run under its own name: a
      booking website where customers see the price and pay upfront, recurring cleans that charge themselves,
      and a dashboard that keeps the team organised.
    </p>
  </div>
</section>

<section class="bg-white py-16 dark:bg-gray-800">
  <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
    <h2 class="text-center text-3xl font-bold text-gray-900 dark:text-white">What we believe</h2>
    <div class="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {#each beliefs as belief (belief.title)}
        <div>
          <Icon name={belief.icon} size={28} class="text-primary-700 dark:text-primary-300" accent />
          <h3 class="mt-3 font-semibold text-gray-900 dark:text-white">{belief.title}</h3>
          <p class="mt-2 text-gray-600 dark:text-gray-300">{belief.text}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<section class="bg-primary-700 py-16">
  <div class="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
    <h2 class="text-3xl font-bold text-white">See whether it fits your company</h2>
    <p class="mt-4 text-lg text-white/90">A 20-minute demo, with your own services and prices.</p>
    <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
      <Button variant="secondary" size="lg" href={demoRequest}>Book a demo</Button>
      <a
        href="/pricing"
        class="inline-flex items-center justify-center rounded-md border border-white/70 px-6 py-3 font-medium text-white hover:bg-white/10"
        >See pricing</a
      >
    </div>
    {#if brand.legalName}
      <p class="mt-8 text-sm text-white/80">
        {brand.legalName}{brand.registrationNumber ? ` · Reg. ${brand.registrationNumber}` : ""}{brand.address ? ` · ${brand.address}` : ""}
      </p>
    {/if}
  </div>
</section>
