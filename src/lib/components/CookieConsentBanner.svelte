<!-- src/lib/components/CookieConsentBanner.svelte -->
<script lang="ts">
  import {
    acceptCookies,
    consentStatus,
    declineCookies,
  } from "$lib/stores/cookieConsent";
  import Button from "./ui/Button.svelte";

  let showBanner = false;

  // Only show banner if consent is pending
  $: showBanner = $consentStatus === "pending";

  function handleAccept() {
    acceptCookies();
  }

  function handleDecline() {
    declineCookies();
  }
</script>

{#if showBanner}
  <div
    class="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-2xl dark:bg-gray-800"
    role="dialog"
    aria-labelledby="cookie-consent-title"
    aria-describedby="cookie-consent-description"
  >
    <div class="container mx-auto max-w-6xl p-4 sm:p-6">
      <div
        class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <!-- Content -->
        <div class="flex-1">
          <h3
            id="cookie-consent-title"
            class="mb-2 text-lg font-semibold text-gray-900 dark:text-white"
          >
            We value your privacy
          </h3>
          <p
            id="cookie-consent-description"
            class="text-sm text-gray-600 dark:text-gray-300"
          >
            We use cookies and similar technologies to improve your experience,
            analyze site usage, and assist in our marketing efforts. This
            includes using analytics tools to understand how you use our
            website.
            <a
              href="/cookie-preferences"
              class="text-primary underline hover:text-primary-600 dark:text-primary-400"
            >
              View details and manage preferences
            </a>
            or read our
            <a
              href="/privacy"
              class="text-primary underline hover:text-primary-600 dark:text-primary-400"
            >
              Privacy Policy
            </a>.
          </p>
        </div>

        <!-- Actions -->
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="secondary"
            size="sm"
            on:click={handleDecline}
            class="w-full sm:w-auto"
          >
            Decline
          </Button>
          <Button
            variant="primary"
            size="sm"
            on:click={handleAccept}
            class="w-full sm:w-auto"
          >
            Accept Cookies
          </Button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Ensure banner appears above other content */
  div[role="dialog"] {
    box-shadow:
      0 -4px 6px -1px rgb(0 0 0 / 0.1),
      0 -2px 4px -2px rgb(0 0 0 / 0.1);
  }
</style>
