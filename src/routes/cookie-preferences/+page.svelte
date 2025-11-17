<!-- src/routes/cookie-preferences/+page.svelte -->
<script lang="ts">
  import { consentStatus, acceptCookies, declineCookies } from '$lib/stores/cookieConsent';
  import Button from '$lib/components/ui/Button.svelte';
  import { goto } from '$app/navigation';

  function handleAccept() {
    acceptCookies();
    goto('/');
  }

  function handleDecline() {
    declineCookies();
    goto('/');
  }
</script>

<svelte:head>
  <title>Cookie Preferences | BrightBroom</title>
  <meta
    name="description"
    content="Manage your cookie preferences and privacy settings for BrightBroom."
  />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12 dark:bg-gray-900">
  <div class="container mx-auto max-w-4xl px-4">
    <!-- Header -->
    <div class="mb-8 text-center">
      <h1 class="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
        Cookie Preferences
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-300">
        Manage how we use cookies and tracking technologies on our website
      </p>
    </div>

    <!-- Current Status -->
    <div class="mb-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <h2 class="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
        Current Status
      </h2>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-gray-700 dark:text-gray-300">
            Analytics cookies are currently:
          </p>
        </div>
        <div>
          {#if $consentStatus === 'granted'}
            <span
              class="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400"
            >
              ✓ Enabled
            </span>
          {:else if $consentStatus === 'denied'}
            <span
              class="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 dark:bg-red-900/20 dark:text-red-400"
            >
              ✗ Disabled
            </span>
          {:else}
            <span
              class="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
            >
              ? Not Set
            </span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Cookie Categories -->
    <div class="space-y-6">
      <!-- Essential Cookies -->
      <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <div class="mb-4 flex items-start justify-between">
          <div class="flex-1">
            <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Essential Cookies
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-300">
              These cookies are necessary for the website to function properly. They enable basic
              features like page navigation, secure areas access, and form submissions. These
              cannot be disabled.
            </p>
          </div>
          <div class="ml-4">
            <span
              class="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            >
              Always Active
            </span>
          </div>
        </div>
        <div class="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Examples:</p>
          <ul class="ml-4 mt-2 list-disc text-sm text-gray-600 dark:text-gray-400">
            <li>Session management</li>
            <li>Authentication</li>
            <li>Security tokens</li>
          </ul>
        </div>
      </div>

      <!-- Analytics Cookies -->
      <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <div class="mb-4 flex items-start justify-between">
          <div class="flex-1">
            <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Analytics Cookies
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-300">
              These cookies help us understand how you use our website so we can improve your
              experience. We use PostHog for analytics, which helps us see which pages are most
              visited, how long you stay, and what features you use.
            </p>
          </div>
          <div class="ml-4">
            {#if $consentStatus === 'granted'}
              <span
                class="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400"
              >
                Enabled
              </span>
            {:else}
              <span
                class="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 dark:bg-red-900/20 dark:text-red-400"
              >
                Disabled
              </span>
            {/if}
          </div>
        </div>
        <div class="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">What we track:</p>
          <ul class="ml-4 mt-2 list-disc text-sm text-gray-600 dark:text-gray-400">
            <li>Page views and navigation patterns</li>
            <li>Time spent on pages</li>
            <li>Button clicks and feature usage</li>
            <li>General location (city/country level)</li>
            <li>Device and browser information</li>
          </ul>
          <p class="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            We do NOT track:
          </p>
          <ul class="ml-4 mt-2 list-disc text-sm text-gray-600 dark:text-gray-400">
            <li>Personal identifiable information without consent</li>
            <li>Precise location data</li>
            <li>Activity across other websites</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
      <Button variant="secondary" size="lg" on:click={handleDecline} class="w-full sm:w-auto">
        Decline Analytics Cookies
      </Button>
      <Button variant="primary" size="lg" on:click={handleAccept} class="w-full sm:w-auto">
        Accept Analytics Cookies
      </Button>
    </div>

    <!-- Additional Information -->
    <div class="mt-8 rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
      <h3 class="mb-2 text-lg font-semibold text-blue-900 dark:text-blue-200">
        Questions about cookies?
      </h3>
      <p class="text-sm text-blue-800 dark:text-blue-300">
        For more information about how we handle your data, please read our
        <a href="/privacy" class="underline hover:text-blue-600 dark:hover:text-blue-400"
          >Privacy Policy</a
        >. If you have specific questions, you can
        <a href="/contact" class="underline hover:text-blue-600 dark:hover:text-blue-400"
          >contact us</a
        >.
      </p>
    </div>
  </div>
</div>
