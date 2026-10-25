<!-- src/routes/profile/addresses/new/+page.svelte -->
<script lang="ts">
  import { brand } from "$lib/config/brand";
  import Icon from "$lib/components/ui/Icon.svelte";
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { safeRedirectPath } from "$lib/utils/safe-redirect";
  import GoogleMapsAutocomplete from "$lib/components/maps/GoogleMapsAutocomplete.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import {
    getClosestServiceArea,
    isWithinServiceArea,
  } from "$lib/utils/serviceAreaValidator";
  import type { ActionData, PageData } from "./$types";
  
  // Environment variables
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Get data from the server load function
  export let data: PageData;

  // Get form data if there's an error
  export let form: ActionData;

  // Get redirectTo url param if it exists, default to profile/addresses
  $: redirectTo = safeRedirectPath(
    $page.url.searchParams.get("redirectTo"),
    "/profile/addresses",
  );

  // Track form state
  let isLoading = false;
  let isSubmitting = false;

  // Address state variables
  let selectedAddress = {
    formatted: "",
    street: "",
    aptUnit: "",
    city: "",
    state: "",
    zipCode: "",
    lat: 0,
    lng: 0,
    placeType: "",
    placeName: "",
  };
  let addressError = "";
  let isOutOfServiceArea = false;

  // Form data with defaults
  // The action returns these under `values` when it fails
  const failedValues = form?.values;
  let aptUnit = failedValues?.aptUnit || "";
  let isDefault = failedValues?.isDefault || false;
  let instructions = failedValues?.instructions || "";

  // Handle address selection from Google autocomplete
  function handleAddressSelect(
    event: CustomEvent<{ address: typeof selectedAddress }>,
  ) {
    selectedAddress = event.detail.address;
    addressError = "";

    // Check if address is within service area
    if (selectedAddress.lat && selectedAddress.lng) {
      isOutOfServiceArea = !isWithinServiceArea(
        selectedAddress.lat,
        selectedAddress.lng,
      );

      if (isOutOfServiceArea) {
        const closest = getClosestServiceArea(
          selectedAddress.lat,
          selectedAddress.lng,
        );
        if (closest) {
          addressError = `We haven't reached your area yet! The nearest ${brand.name} zone is ${closest.name} (${closest.distance.toFixed(0)}km away). We're expanding soon!`;
        }
      }
    }
  }

  // Handle out-of-service-area warning
  function handleOutOfServiceArea() {
    isOutOfServiceArea = true;
    addressError = "We're not in your neighbourhood yet! Check our service areas to see where we sparkle.";
  }
</script>

<svelte:head>
  <title>Add New Address | {brand.name}</title>
</svelte:head>

{#if isLoading}
  <!-- Full-page loading overlay -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80 dark:bg-gray-900 dark:bg-opacity-80"
  >
    <div class="flex flex-col items-center space-y-4">
      <div
        class="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"
      ></div>
      <p class="text-lg font-medium text-gray-800 dark:text-white">
        Saving address...
      </p>
    </div>
  </div>
{/if}

<div class="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
  <div class="mx-auto max-w-2xl">
    <!-- Page header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Add New Address
        </h1>
        <Button
          variant="outline"
          on:click={() => {
            isLoading = true;
            goto(redirectTo);
          }}
          disabled={isSubmitting}
        >
          <Icon name="arrow-left" size={18} class="mr-2" />
          Cancel
        </Button>
      </div>
      <p class="mt-2 text-gray-600 dark:text-gray-300">
        Enter a new address for your cleaning services
      </p>
    </div>

    <!-- Error message if form submission failed -->
    {#if form?.error}
      <div
        class="mb-6 rounded-md bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-200"
      >
        <p>{form.error}</p>
      </div>
    {/if}

    {#if data.maxAddresses && data.addresses?.length >= data.maxAddresses - 1}
      <div
        class="mb-6 bg-yellow-50 p-4 rounded-lg dark:bg-yellow-900/20 flex items-start"
      >
        <Icon name="warning" size={20}
          class="mt-0.5 mr-2 flex-shrink-0 text-yellow-500 dark:text-yellow-400"
        />
        <div>
          <p class="text-yellow-800 dark:text-yellow-300">
            {data.addresses?.length === data.maxAddresses - 1
              ? `This will be your last available address slot. You are limited to ${data.maxAddresses} total addresses.`
              : `You have reached the maximum limit of ${data.maxAddresses} addresses. To add a new address, you must first delete an existing one.`}
          </p>
        </div>
      </div>
    {/if}

    <!-- Address form -->
    <div class="card p-6">
      <form
        method="POST"
        action="?/createAddress"
        use:enhance={() => {
          isSubmitting = true;

          return async ({ result }) => {
            const successRedirect =
              result.type === "success" ? result.data?.redirect : undefined;
            if (typeof successRedirect === "string" && successRedirect) {
              // Keep the loading state active
              isLoading = true;

              const redirectTo = successRedirect;

              // If redirecting back to booking flow, add loading parameter
              if (redirectTo.includes("/book/")) {
                // Redirect with loading parameter
                goto(`${redirectTo}?loading=true`, { replaceState: true });
              } else {
                // Normal redirect
                goto(redirectTo, { replaceState: true });
              }
            } else if (result.type === "redirect") {
              // Standard SvelteKit redirect
              isLoading = true;
              goto(result.location, { replaceState: true });
            } else {
              // For errors or other cases, stop loading
              isSubmitting = false;
            }
          };
        }}
      >
        <!-- Address input -->
        <div class="mb-4">
          <GoogleMapsAutocomplete
            apiKey={googleMapsApiKey}
            label="Address"
            placeholder="Enter your address, estate, or complex name"
            required
            error={addressError}
            bind:selectedAddress
            on:select={handleAddressSelect}
            on:outOfServiceArea={handleOutOfServiceArea}
          />

          {#if isOutOfServiceArea}
            <div class="mt-2 text-sm text-amber-600 dark:text-amber-400">
              <p>
                Note: This address is outside our current service areas. We may
                have limited availability in your location.
              </p>
            </div>
          {/if}

          <!-- Hidden fields to store all address components -->
          <input type="hidden" name="formattedAddress" value={selectedAddress.formatted} />
          <input type="hidden" name="street" value={selectedAddress.street} />
          <input type="hidden" name="city" value={selectedAddress.city} />
          <input type="hidden" name="state" value={selectedAddress.state} />
          <input type="hidden" name="zipCode" value={selectedAddress.zipCode} />
          <input type="hidden" name="lat" value={selectedAddress.lat} />
          <input type="hidden" name="lng" value={selectedAddress.lng} />
        </div>

        <!-- Apartment/Unit -->
        <div class="mb-4">
          <label
            for="aptUnit"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Apartment/Unit
          </label>
          <input
            type="text"
            id="aptUnit"
            name="aptUnit"
            bind:value={aptUnit}
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Apt 4B (optional)"
          />
        </div>

        <!-- Access Instructions -->
        <div class="mb-4">
          <label
            for="instructions"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Access Instructions
          </label>
          <textarea
            id="instructions"
            name="instructions"
            bind:value={instructions}
            rows="3"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="E.g., Gate code, building entrance instructions, etc. (optional)"
          ></textarea>
        </div>

        <!-- Default Address Checkbox -->
        <div class="mb-6">
          <label class="flex items-center">
            <input
              type="checkbox"
              name="isDefault"
              bind:checked={isDefault}
              class="h-4 w-4 rounded border-gray-300 text-primary-700 focus:ring-primary"
            />
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Set as default address
            </span>
          </label>
        </div>

        <!-- Hidden redirectTo field -->
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <!-- Submit Button -->
        <div class="flex justify-end">
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {#if isSubmitting}
              <svg
                class="mr-2 h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving Address...
            {:else}
              <Icon name="map-pin" size={18} class="mr-2" />
              Save Address
            {/if}
          </Button>
        </div>
      </form>
    </div>
  </div>
</div>
