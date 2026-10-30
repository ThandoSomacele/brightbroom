<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { browser } from "$app/environment";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import { page } from "$app/stores";
  import CookieConsentBanner from "$lib/components/CookieConsentBanner.svelte";
  import ErrorBoundary from "$lib/components/ErrorBoundary.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import { brand, canonicalSiteUrl, isDemoSite } from "$lib/config/brand";
  import { FOOTER_LINKS, PUBLIC_NAV, linksForSite } from "$lib/config/site-routes";
  import { performanceMonitor } from "$lib/utils/performance";
  import posthog from "posthog-js";
  import { onMount } from "svelte";
  import "../app.css";
  import "@phosphor-icons/web/duotone";

  // Access user data from the page store
  $: user = $page.data.user;
  // While bookings are paused, the CTAs point at the explanation page rather
  // than a funnel that would only redirect there anyway
  $: bookingsPaused = $page.data.bookingsPaused;
  $: bookHref = bookingsPaused ? "/bookings-paused" : "/book";

  // Only links to pages this site serves (none of BrightBroom's own pages on
  // a company's site)
  const navLinks = linksForSite(PUBLIC_NAV);
  const footerLinks = linksForSite(FOOTER_LINKS);

  // One canonical address per page, on this site's own domain
  $: canonicalUrl = `${canonicalSiteUrl}${$page.url.pathname}`;

  // Check if current page is in booking flow (hide footer on mobile for these)
  $: isBookingFlow = $page.url.pathname.startsWith("/book");

  let isMenuOpen = false;

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function closeMenu() {
    isMenuOpen = false;
  }

  // Initialise performance monitoring and GTM
  onMount(() => {
    // Initialise Google Tag Manager (only where a container is configured)
    if (typeof window !== "undefined" && brand.gtmId) {
      // GTM's dataLayer is not part of the DOM typings
      const gtmWindow = window as Window & { dataLayer?: unknown[] };
      gtmWindow.dataLayer = gtmWindow.dataLayer || [];
      gtmWindow.dataLayer.push({
        "gtm.start": new Date().getTime(),
        event: "gtm.js",
      });

      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${brand.gtmId}`;

      const firstScript = document.getElementsByTagName("script")[0];
      if (firstScript?.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }
    }

    // Report performance metrics after page is fully loaded
    setTimeout(() => {
      performanceMonitor.reportMetrics();
    }, 2000);
  });

  // PostHog pageview & pageleave tracking
  if (browser) {
    beforeNavigate(() => posthog.capture("$pageleave"));
    afterNavigate(() => posthog.capture("$pageview"));
  }
</script>

<svelte:head>
  <!-- Basic meta tags -->
  <title>{brand.name} | {brand.tagline}</title>
  <meta
    name="description"
    content="{brand.tagline}. Book professional cleaning services online in minutes and get your space sparkling clean."
  />
  <!-- One canonical address per page (pages don't add their own). Error
       pages have none: they are not pages to index. -->
  {#if !$page.error}
    <link rel="canonical" href={canonicalUrl} />
    <meta property="og:url" content={canonicalUrl} />
  {/if}
  <meta property="og:site_name" content={brand.name} />
</svelte:head>

<!-- Google Tag Manager (noscript) -->
{#if brand.gtmId}
  <noscript
    ><iframe
      src="https://www.googletagmanager.com/ns.html?id={brand.gtmId}"
      height="0"
      width="0"
      style="display:none;visibility:hidden"
      title="Google Tag Manager"
    ></iframe></noscript
  >
{/if}
<!-- End Google Tag Manager (noscript) -->


<!-- Skip link for accessibility -->
<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-primary text-primary-950 p-3 z-50 focus:z-50"
>
  Skip to main content
</a>

{#if isDemoSite}
  <!-- Sales demo: bookings work end to end, but only with PayFast test payments -->
  <div class="bg-secondary-700 px-4 py-2 text-center text-sm text-white">
    <strong>Demo:</strong> this is {brand.name}, the booking platform for cleaning companies. Bookings here
    are not real and no money is taken.
    <a href="/pricing" class="ml-1 font-semibold underline hover:no-underline">Get it for your company</a>
  </div>
{/if}

<!-- Header with navigation -->
<header class="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm dark:bg-gray-800/95">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="flex h-16 items-center justify-between">
      <!-- Logo and site name -->
      <div class="flex flex-shrink-0 items-center">
        <a
          href="/"
          class="flex items-center"
          aria-label="{brand.name} home page"
        >
          {#if brand.logoUrl}
            <img src={brand.logoUrl} alt={brand.name} class="h-9 w-auto" />
          {:else}
            <span class="text-2xl font-bold text-primary-700">{brand.name}</span>
          {/if}
        </a>
      </div>

      <!-- Desktop navigation links -->
      <nav class="hidden space-x-4 lg:flex">
        {#each navLinks as link (link.href)}
          <a
            href={link.href}
            class="px-3 py-2 text-gray-700 hover:text-primary-700 dark:text-gray-200"
            >{link.label}</a
          >
        {/each}
        {#if user && user.role === "ADMIN"}
          <a
            href="/admin/dashboard"
            class="px-3 py-2 font-medium text-primary-700 hover:text-primary-800 dark:text-primary-400"
            >Admin</a
          >
        {/if}
      </nav>

      <!-- Auth buttons or user menu -->
      <div class="hidden lg:flex lg:items-center space-x-3">
        {#if user}
          <Button variant="outline" href="/profile">
            <span>{user.firstName} {user.lastName}</span>
          </Button>

          {#if user.role === "ADMIN"}
            <Button variant="ghost" href="/admin/dashboard">
              Admin Dashboard
            </Button>
          {/if}

          <form action="/auth/logout" method="POST">
            <Button variant="ghost" type="submit">Sign out</Button>
          </form>
        {:else}
          <Button variant="outline" href="/auth/login">Login</Button>
          <Button variant="secondary" href={bookHref}>
            {bookingsPaused ? "Coming Soon" : "Book Now"}
          </Button>
        {/if}
      </div>

      <!-- Mobile menu button - this is the hamburger icon -->
      <div class="flex lg:hidden">
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          aria-expanded={isMenuOpen}
          on:click={toggleMenu}
        >
          <span class="sr-only"
            >{isMenuOpen ? "Close main menu" : "Open main menu"}</span
          >
          {#if isMenuOpen}
            <!-- Close icon -->
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          {:else}
            <!-- Menu icon (hamburger) -->
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile menu -->
  {#if isMenuOpen}
    <div class="lg:hidden">
      <div class="space-y-1 px-2 pb-3 pt-2">
        {#each navLinks as link (link.href)}
          <a
            href={link.href}
            on:click={closeMenu}
            class="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-700 dark:text-gray-200 dark:hover:bg-gray-700"
            >{link.label}</a
          >
        {/each}
      </div>

      <div class="border-t border-gray-200 pb-3 pt-4 dark:border-gray-700">
        {#if user}
          <div class="flex items-center px-5">
            <div>
              <div class="text-base font-medium text-gray-800 dark:text-white">
                {user.firstName}
                {user.lastName}
              </div>
              <div class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {user.email}
              </div>
            </div>
          </div>
          <div class="mt-3 space-y-1 px-2">
            <a
              href="/profile"
              on:click={closeMenu}
              class="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-700 dark:text-gray-200 dark:hover:bg-gray-700"
              >Your Profile</a
            >
            {#if user.role === "ADMIN"}
              <a
                href="/admin/dashboard"
                on:click={closeMenu}
                class="block px-3 py-2 font-medium text-primary-700 hover:bg-gray-50 hover:text-primary-800 dark:text-primary-400 dark:hover:bg-gray-700"
                >Admin Dashboard</a
              >
            {/if}
            <!-- Fixed Logout Form: Remove onClick handler from button and add onSubmit to form -->
            <form
              action="/auth/logout"
              method="POST"
              on:submit={() => {
                // Close menu after submission is initiated
                setTimeout(closeMenu, 100);
              }}
            >
              <button
                type="submit"
                class="block w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 hover:text-primary-700 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Sign out
              </button>
            </form>
          </div>
        {:else}
          <div class="mt-3 space-y-1 px-2">
            <a
              href="/auth/login"
              on:click={closeMenu}
              class="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-700 dark:text-gray-200 dark:hover:bg-gray-700"
              >Login</a
            >
            <a
              href={bookHref}
              on:click={closeMenu}
              class="block px-3 py-2 text-white bg-secondary hover:bg-secondary-600 hover:text-white dark:bg-secondary dark:hover:bg-secondary-600 rounded-md"
              >{bookingsPaused ? "Coming Soon" : "Book Now"}</a
            >
          </div>
        {/if}
      </div>
    </div>
  {/if}
</header>

<!-- Page content -->
<ErrorBoundary>
  <main id="main-content">
    <slot />
  </main>
</ErrorBoundary>

<!-- Footer - hidden on mobile during booking flow since we have fixed bottom bar -->
<footer
  class="bg-gray-50 py-8 dark:bg-gray-900 {isBookingFlow
    ? 'hidden lg:block'
    : ''}"
>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="md:flex md:items-center md:justify-between">
      <div class="mb-6 md:mb-0">
        <span class="text-xl font-bold text-primary-700">{brand.name}</span>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {brand.tagline}
        </p>
      </div>

      <div class="flex flex-wrap justify-center gap-4">
        {#each footerLinks as link (link.href)}
          <a
            href={link.href}
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >{link.label}</a
          >
        {/each}
      </div>
    </div>

    <div class="mt-8 border-t border-gray-200 pt-8 dark:border-gray-700">
      <p class="text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} {brand.name}. All rights reserved.
      </p>
    </div>
  </div>
</footer>

<!-- Cookie Consent Banner -->
<CookieConsentBanner />
