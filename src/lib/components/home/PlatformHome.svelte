<!-- src/lib/components/home/PlatformHome.svelte -->
<!--
  brightbroom.com's home page: BrightBroom sold to cleaning companies. The
  customer-facing pages stay on the site as the live demo (/demo, /book).
-->
<script lang="ts">
  import { brand, whatsappHref } from "$lib/config/brand";
  import Button from "$lib/components/ui/Button.svelte";
  import Icon from "$lib/components/ui/Icon.svelte";
  import bookingDemoImage from "$lib/image-assets/booking-demo.webp";

  const demoRequest = `/contact?subject=${encodeURIComponent("Demo request")}`;

  const pains = [
    { icon: "chat-circle-dots", title: "Quotes by WhatsApp", text: "Every booking starts with messages back and forth about rooms, dates and prices." },
    { icon: "credit-card", title: "Chasing payments", text: "The clean is done, and you are still waiting for the EFT to come through." },
    { icon: "calendar-check", title: "Rosters in a group chat", text: "Who is cleaning where tomorrow lives in your head, a notebook or a chat." },
  ];

  const features = [
    { icon: "calendar-check", title: "Online booking with instant prices", text: "Customers choose bedrooms, bathrooms, add-ons, date and time, and see the price before they book." },
    { icon: "credit-card", title: "Paid before you clean", text: "Card and EFT payments through PayFast, straight into your own PayFast account. Discount coupons built in." },
    { icon: "arrows-clockwise", title: "Recurring cleans", text: "Weekly, every two weeks, twice a week or twice a month, charged automatically." },
    { icon: "map-pin", title: "Your service areas", text: "Set the suburbs you cover. Addresses outside them are turned away politely, before anyone pays." },
    { icon: "users", title: "Cleaners, organised", text: "Applications with ID and right-to-work details, profiles, job assignment, and a portal where each cleaner sees their jobs and earnings." },
    { icon: "squares-four", title: "One admin dashboard", text: "Bookings, customers, payments, cleaner payouts and reports in one place." },
    { icon: "envelope-simple", title: "Emails that send themselves", text: "Booking confirmations, receipts and next-day reminders, from your own email address." },
    { icon: "paint-brush", title: "Your brand, not ours", text: "Your company name, logo, colours and domain. Your customers never see BrightBroom." },
  ];

  const steps = [
    { title: "See it working", text: "We walk you through the booking flow and the admin dashboard, and agree on the plan that fits your team." },
    { title: "We set it up", text: "Your site goes live on your domain with your branding, PayFast account, services, prices and service areas." },
    { title: "Take bookings", text: "Share your link. Customers book and pay online, and your cleaners get their jobs." },
  ];

  const faqs = [
    { q: "Do I need a website already?", a: "No. BrightBroom can be your whole website, or sit next to the one you have, for example at book.yourcompany.co.za, with a Book now button on your current site." },
    { q: "Do my customers need an app?", a: "No. It works in any browser, on a phone or a computer." },
    { q: "Who receives the payments?", a: "You do. Customers pay into your own PayFast account. We charge a fixed monthly fee and never take a commission on your bookings." },
    { q: "Can I see it before I commit?", a: "Yes. The live demo shows exactly what your customers will see, and in a demo call we show you the admin side with your own services and prices." },
  ];
</script>

<!-- Hero -->
<section class="overflow-hidden bg-white dark:bg-gray-800">
  <div class="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
    <div>
      <p class="section-eyebrow mb-3">Booking software for cleaning companies</p>
      <h1 class="font-heading text-4xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white md:text-5xl">
        Let your customers book and pay online
      </h1>
      <p class="mt-5 max-w-xl text-lg text-gray-600 dark:text-gray-300">
        {brand.name} gives your cleaning company its own booking website. Customers choose a clean, see the price
        and pay through PayFast. Recurring cleans charge themselves, and your cleaners see their jobs on their
        phones. All under your name.
      </p>
      <div class="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button variant="secondary" size="lg" href={demoRequest}>Book a demo</Button>
        <Button variant="outline" size="lg" href="/demo">Try the customer demo</Button>
      </div>
      <ul class="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600 dark:text-gray-300">
        <li class="flex items-center gap-1.5"><Icon name="check" size={16} class="text-primary-700" flat /> From R1,500 a month</li>
        <li class="flex items-center gap-1.5"><Icon name="check" size={16} class="text-primary-700" flat /> Paid into your own PayFast account</li>
        <li class="flex items-center gap-1.5"><Icon name="check" size={16} class="text-primary-700" flat /> No commission</li>
      </ul>
    </div>
    <figure class="relative">
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700">
        <div class="flex items-center gap-1.5 border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
          <span class="h-2.5 w-2.5 rounded-full bg-gray-300"></span>
          <span class="h-2.5 w-2.5 rounded-full bg-gray-300"></span>
          <span class="h-2.5 w-2.5 rounded-full bg-gray-300"></span>
          <span class="ml-3 truncate text-xs text-gray-500">book.yourcompany.co.za</span>
        </div>
        <img
          src={bookingDemoImage}
          alt="The booking page a cleaning company's customers see: choose bedrooms, bathrooms and extras, with the price shown as they go"
          class="block w-full"
          width="1200"
          height="750"
        />
      </div>
      <figcaption class="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
        What your customers see, under your own name and domain
      </figcaption>
    </figure>
  </div>
</section>

<!-- The problem -->
<section class="bg-gray-50 py-16 dark:bg-gray-900">
  <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
    <h2 class="text-center text-3xl font-bold text-gray-900 dark:text-white">Sound familiar?</h2>
    <div class="mt-10 grid gap-6 md:grid-cols-3">
      {#each pains as pain (pain.title)}
        <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <Icon name={pain.icon} size={28} class="text-secondary-700" />
          <h3 class="mt-3 text-lg font-semibold text-gray-900 dark:text-white">{pain.title}</h3>
          <p class="mt-2 text-gray-600 dark:text-gray-300">{pain.text}</p>
        </div>
      {/each}
    </div>
    <p class="mt-8 text-center text-lg font-medium text-gray-800 dark:text-gray-200">
      {brand.name} replaces all three with one booking website that runs itself.
    </p>
  </div>
</section>

<!-- Features -->
<section id="features" class="scroll-mt-20 bg-white py-16 dark:bg-gray-800">
  <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
    <p class="section-eyebrow mb-3 text-center">What you get</p>
    <h2 class="text-center text-3xl font-bold text-gray-900 dark:text-white">Everything a cleaning company needs to sell online</h2>
    <div class="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      {#each features as feature (feature.title)}
        <div>
          <Icon name={feature.icon} size={28} class="text-primary-700 dark:text-primary-300" accent />
          <h3 class="mt-3 font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
          <p class="mt-2 text-gray-600 dark:text-gray-300">{feature.text}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- Money -->
<section class="bg-primary-50 py-14 dark:bg-primary-900/20">
  <div class="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Your money, your customers</h2>
      <p class="mt-3 text-gray-700 dark:text-gray-300">
        Bookings are paid into your own PayFast account, so the money is yours from the moment a customer pays.
        We charge a fixed monthly fee and never take a cut of your bookings. Your customers and their details stay
        yours.
      </p>
    </div>
    <div class="rounded-lg bg-white p-6 dark:bg-gray-800">
      <p class="text-sm font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">Plans</p>
      <ul class="mt-3 space-y-2 text-gray-800 dark:text-gray-200">
        <li class="flex justify-between gap-4"><span>Starter · up to 5 cleaners</span><span class="font-semibold">R1,500 / month</span></li>
        <li class="flex justify-between gap-4"><span>Growth · up to 15 cleaners</span><span class="font-semibold">R2,500 / month</span></li>
        <li class="flex justify-between gap-4"><span>Pro · up to 40 cleaners</span><span class="font-semibold">R4,000 / month</span></li>
      </ul>
      <p class="mt-3 text-sm text-gray-600 dark:text-gray-400">Plus a once-off setup fee.</p>
      <a href="/pricing" class="mt-4 inline-block font-medium text-primary-700 hover:underline dark:text-primary-300">See full pricing &rarr;</a>
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
          <span class="flex h-9 w-9 items-center justify-center rounded-full bg-primary-700 font-semibold text-white">{i + 1}</span>
          <h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{step.title}</h3>
          <p class="mt-2 text-gray-600 dark:text-gray-300">{step.text}</p>
        </li>
      {/each}
    </ol>
  </div>
</section>

<!-- FAQ -->
<section class="bg-white py-16 dark:bg-gray-800">
  <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
    <h2 class="text-center text-3xl font-bold text-gray-900 dark:text-white">Questions owners ask</h2>
    <div class="mt-8 space-y-4">
      {#each faqs as faq (faq.q)}
        <details class="card card-hover p-4">
          <summary class="cursor-pointer font-semibold text-gray-900 dark:text-white">{faq.q}</summary>
          <p class="mt-3 text-gray-600 dark:text-gray-300">{faq.a}</p>
        </details>
      {/each}
    </div>
  </div>
</section>

<!-- Call to action -->
<section class="bg-primary-700 py-16">
  <div class="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
    <h2 class="text-3xl font-bold text-white">Ready to take bookings online?</h2>
    <p class="mt-4 text-lg text-white/90">
      Book a 20-minute demo and we'll show you how it would work for your company.
    </p>
    <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
      <Button variant="secondary" size="lg" href={demoRequest}>Book a demo</Button>
      {#if whatsappHref()}
        <a
          href={whatsappHref()}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center gap-2 rounded-md border border-white/70 px-6 py-3 font-medium text-white hover:bg-white/10"
        >
          <Icon name="whatsapp-logo" size={20} />
          WhatsApp {brand.supportPhone}
        </a>
      {/if}
    </div>
  </div>
</section>
