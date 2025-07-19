<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { page } from "$app/stores";
  import Button from "$lib/components/ui/Button.svelte";
  import LoadingIndicator from "$lib/components/ui/LoadingIndicator.svelte";
  import ErrorBoundary from "$lib/components/ErrorBoundary.svelte";
  import { performanceMonitor } from "$lib/utils/performance";
  import { onMount } from "svelte";
  import "../app.css";

  // Access user data from the page store
  $: user = $page.data.user;
  
  // Get site URL for canonical URLs
  const siteUrl = import.meta.env.VITE_SITE_URL || "https://brightbroom.com";
  $: canonicalUrl = `${siteUrl}${$page.url.pathname}`;

  let isMenuOpen = false;

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function closeMenu() {
    isMenuOpen = false;
  }

  // Initialize performance monitoring and GTM
  onMount(() => {
    // Initialize Google Tag Manager
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
      });
      
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-WSXMSVZT';
      
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode.insertBefore(script, firstScript);
    }

    // Report performance metrics after page is fully loaded
    setTimeout(() => {
      performanceMonitor.reportMetrics();
    }, 2000);
  });
</script>

<svelte:head>
  <!-- Basic meta tags -->
  <title>BrightBroom | On-demand Cleaning Services</title>
  <meta
    name="description"
    content="Professional cleaning services on your schedule. Book online in minutes and get your space sparkling clean."
  />
  <!-- Canonical URL -->
  <link rel="canonical" href={canonicalUrl} />
</svelte:head>

<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WSXMSVZT"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->

<!-- Global loading indicator for page navigation -->
<LoadingIndicator />

<!-- Skip link for accessibility -->
<a 
  href="#main-content" 
  class="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-primary text-white p-3 z-50 focus:z-50"
>
  Skip to main content
</a>

<!-- Header with navigation -->
<header class="bg-white shadow dark:bg-gray-800">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="flex h-16 items-center justify-between">
      <!-- Logo and site name -->
      <div class="flex flex-shrink-0 items-center">
        <a href="/" class="flex items-center" aria-label="BrightBroom home page">
          <span class="text-2xl font-bold text-primary">BrightBroom</span>
        </a>
      </div>

      <!-- Desktop navigation links -->
      <nav class="hidden space-x-4 md:flex">
        <a
          href="/"
          class="px-3 py-2 text-gray-700 hover:text-primary dark:text-gray-200"
          >Home</a
        >
        <a
          href="/services"
          class="px-3 py-2 text-gray-700 hover:text-primary dark:text-gray-200"
          >Services</a
        >
        <a
          href="/about"
          class="px-3 py-2 text-gray-700 hover:text-primary dark:text-gray-200"
          >About</a
        >
        <a
          href="/magazine"
          class="px-3 py-2 text-gray-700 hover:text-primary dark:text-gray-200"
          >Magazine</a
        >
        <a
          href="/contact"
          class="px-3 py-2 text-gray-700 hover:text-primary dark:text-gray-200"
          >Contact</a
        >
        {#if user && user.role === "ADMIN"}
          <a
            href="/admin/dashboard"
            class="px-3 py-2 font-medium text-primary hover:text-primary-600 dark:text-primary-400"
            >Admin</a
          >
        {/if}
      </nav>

      <!-- Auth buttons or user menu -->
      <div class="hidden md:flex md:items-center space-x-3">
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
          <Button variant="secondary" href="/book">Book Now</Button>
        {/if}
      </div>

      <!-- Mobile menu button - this is the hamburger icon -->
      <div class="flex md:hidden">
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
    <div class="md:hidden">
      <div class="space-y-1 px-2 pb-3 pt-2">
        <a
          href="/"
          on:click={closeMenu}
          class="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary dark:text-gray-200 dark:hover:bg-gray-700"
          >Home</a
        >
        <a
          href="/services"
          on:click={closeMenu}
          class="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary dark:text-gray-200 dark:hover:bg-gray-700"
          >Services</a
        >
        <a
          href="/about"
          on:click={closeMenu}
          class="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary dark:text-gray-200 dark:hover:bg-gray-700"
          >About</a
        >
        <a
          href="/magazine"
          on:click={closeMenu}
          class="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary dark:text-gray-200 dark:hover:bg-gray-700"
          >Magazine</a
        >

        <a
          href="/contact"
          on:click={closeMenu}
          class="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary dark:text-gray-200 dark:hover:bg-gray-700"
          >Contact</a
        >
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
              class="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary dark:text-gray-200 dark:hover:bg-gray-700"
              >Your Profile</a
            >
            {#if user.role === "ADMIN"}
              <a
                href="/admin/dashboard"
                on:click={closeMenu}
                class="block px-3 py-2 font-medium text-primary hover:bg-gray-50 hover:text-primary-600 dark:text-primary-400 dark:hover:bg-gray-700"
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
                class="block w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 hover:text-primary dark:text-gray-200 dark:hover:bg-gray-700"
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
              class="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary dark:text-gray-200 dark:hover:bg-gray-700"
              >Login</a
            >
            <a
              href="/book"
              on:click={closeMenu}
              class="block px-3 py-2 text-white bg-secondary hover:bg-secondary-600 hover:text-white dark:bg-secondary dark:hover:bg-secondary-600 rounded-md"
              >Book Now</a
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

<!-- Footer -->
<footer class="bg-gray-50 py-8 dark:bg-gray-900">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="md:flex md:items-center md:justify-between">
      <div class="mb-6 md:mb-0">
        <span class="text-xl font-bold text-primary">BrightBroom</span>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          On-demand cleaning services
        </p>
      </div>

      <div class="flex space-x-6">
        <a
          href="/terms"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >Terms</a
        >
        <a
          href="/privacy"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >Privacy</a
        >
        <a
          href="/join/cleaner"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >Join</a
        >
        <a
          href="/contact"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >Contact</a
        >
      </div>
    </div>

    <div class="mt-8 border-t border-gray-200 pt-8 dark:border-gray-700">
      <p class="text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} BrightBroom. All rights reserved.
      </p>
    </div>
  </div>
</footer>
