<!-- src/routes/book/address/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import AddressSelect from "$lib/components/booking/AddressSelect.svelte";
  import StepTracker from "$lib/components/booking/StepTracker.svelte";
  import GoogleMapsAutocomplete from "$lib/components/maps/GoogleMapsAutocomplete.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import { MAX_ADDRESSES } from "$lib/constants/address";
  import { AlertCircle, ArrowLeft, ArrowRight, Plus } from "lucide-svelte";
  import { onMount } from "svelte";

  // Get data from the server
  export let data;

  // Extract data from the server
  const {
    addresses,
    maxAddresses,
    hasReachedLimit,
    remainingAddresses,
    isAuthenticated,
  } = data;

  // Local state variables
  let selectedAddress = ""; // This was missing!
  let accessInstructions = "";
  let isLoading = false;
  let selectedService = "";
  let addressValidationError = "";

  // Google Maps API key
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Guest address form fields
  let guestAddress = {
    street: "",
    streetNumber: "",
    aptUnit: "",
    city: "",
    state: "",
    zipCode: "",
    instructions: "",
    lat: 0,
    lng: 0,
  };
  let useGuestAddress = !isAuthenticated;

  // Google Places selected address
  let selectedGoogleAddress = {
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

  // Initialize data from localStorage on mount
  onMount(() => {
    // Rest of your code remains the same
    selectedService = localStorage.getItem("booking_service") || "";

    // If no service selected, go back to service selection
    if (!selectedService) {
      goto("/book");
    }

    // Check URL for a 'loading' parameter that might be set during redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("loading") === "true") {
      isLoading = true;
      // Remove the parameter after a short delay
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("loading");
        window.history.replaceState({}, "", url);
        isLoading = false;
      }, 500); // Short delay to ensure UI updates
    }
  });

  // Handle Google Places selection
  function handleGooglePlacesSelect(event) {
    const { address } = event.detail;

    // Clear any previous validation errors
    addressValidationError = "";

    // For South African estates/complexes, if street is empty, use formatted address or place name
    let streetValue = address.street || "";
    if (!streetValue && address.formatted) {
      // Extract the first part of the formatted address as street
      const addressParts = address.formatted.split(",");
      streetValue = addressParts[0]?.trim() || "";
    }
    if (!streetValue && address.placeName) {
      streetValue = address.placeName;
    }

    // Update guest address with Google Places data
    guestAddress = {
      street: streetValue,
      streetNumber: guestAddress.streetNumber || "", // Keep existing streetNumber
      aptUnit: address.aptUnit || guestAddress.aptUnit || "", // Keep existing aptUnit if not in places data
      city: address.city || "",
      state: address.state || "",
      zipCode: address.zipCode || "",
      instructions: guestAddress.instructions || "", // Keep existing instructions
      lat: address.lat || 0,
      lng: address.lng || 0,
    };

    selectedGoogleAddress = address;
  }

  // Validate guest address
  function isGuestAddressValid() {
    // For South African addresses, we need at least:
    // - A formatted address from Google Maps (this ensures it's a valid, geocoded address)
    // - Optionally city/state/zipCode (some Google Places results may not have all fields)
    const hasFormattedAddress = selectedGoogleAddress.formatted && selectedGoogleAddress.formatted.trim() !== "";

    if (!hasFormattedAddress) {
      return false; // Must select from Google Maps dropdown
    }

    // Additional validation for estates and complexes
    const isEstateOrComplex =
      selectedGoogleAddress.placeType === "establishment" ||
      selectedGoogleAddress.placeType === "point_of_interest";

    if (isEstateOrComplex) {
      // For estates/complexes, also require street number and unit
      const hasStreetNumber =
        guestAddress.streetNumber && guestAddress.streetNumber.trim() !== "";
      const hasUnitNumber =
        guestAddress.aptUnit && guestAddress.aptUnit.trim() !== "";
      return hasFormattedAddress && hasStreetNumber && hasUnitNumber;
    }

    // For regular addresses, just need the formatted address
    return hasFormattedAddress;
  }

  // Continue to next step
  async function continueToNext() {
    // Clear previous errors
    addressValidationError = "";

    // Validate based on user type
    if (isAuthenticated && !selectedAddress) {
      addressValidationError =
        "Please select an address from your saved addresses.";
      return; // Need to select an address for authenticated users
    }

    if (!isAuthenticated && !isGuestAddressValid()) {
      // Provide specific error messages
      const isEstateOrComplex =
        selectedGoogleAddress.placeType === "establishment" ||
        selectedGoogleAddress.placeType === "point_of_interest";

      if (!selectedGoogleAddress.formatted) {
        addressValidationError =
          "Please select an address from the Google Maps suggestions.";
      } else if (
        isEstateOrComplex &&
        (!guestAddress.streetNumber || guestAddress.streetNumber.trim() === "")
      ) {
        addressValidationError =
          "Please provide the street number or specific address within the estate/complex.";
      } else if (
        isEstateOrComplex &&
        (!guestAddress.aptUnit || guestAddress.aptUnit.trim() === "")
      ) {
        addressValidationError =
          "Please provide your apartment or unit number for the complex/estate.";
      } else {
        addressValidationError = "Please complete the address information.";
      }
      return; // Need to fill in guest address
    }

    // Show loading state
    isLoading = true;

    try {
      if (isAuthenticated) {
        // Authenticated user - use selected address
        const address = addresses.find((a) => a.id === selectedAddress);
        const instructions = address?.instructions || accessInstructions;

        localStorage.setItem("booking_address", selectedAddress);
        localStorage.setItem("booking_instructions", instructions);
      } else {
        // Guest user - store guest address
        localStorage.setItem(
          "booking_guest_address",
          JSON.stringify(guestAddress),
        );
      }

      // Get the service ID from localStorage
      const serviceId = localStorage.getItem("booking_service") || "";

      if (!serviceId) {
        await goto("/book");
        return;
      }

      // Navigate to scheduling with serviceId as a query parameter
      await goto(`/book/schedule?serviceId=${serviceId}`);
    } catch (error) {
      console.error("Navigation error:", error);
    } finally {
      // Reset loading state (though this won't be seen due to navigation)
      isLoading = false;
    }
  }

  // Go back to previous step
  function goToPrevious() {
    isLoading = true;
    goto("/book");
  }

  // Go to manage addresses page
  function goToManageAddresses() {
    isLoading = true;
    goto("/profile/addresses?redirectTo=/book/address");
  }
</script>

<svelte:head>
  <title>Select Address | BrightBroom</title>
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
        Processing address...
      </p>
    </div>
  </div>
{/if}

<div class="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
  <div class="mx-auto max-w-5xl">
    <!-- Page header -->
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Select Address
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-300">
        Choose where you'd like your cleaning service
      </p>
    </div>

    <!-- Progress steps -->
    <div class="mb-8">
      <StepTracker currentStep={2} />
    </div>

    <!-- Address limit information -->
    <div
      class="mb-6 bg-blue-50 p-4 rounded-lg dark:bg-blue-900/20 flex items-start"
    >
      <button
        type="button"
        class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary-50 hover:bg-primary-100 hover:text-primary-700 rounded-md transition-colors dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/40 mr-2 flex-shrink-0"
      >
        <svg
          class="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        View Details
      </button>
      <div>
        <p class="text-blue-800 dark:text-blue-300">
          You are using <span class="font-semibold">{addresses.length}</span> of
          <span class="font-semibold">{MAX_ADDRESSES}</span> available address slots.
        </p>
        {#if hasReachedLimit}
          <p class="text-sm text-blue-700 dark:text-blue-400 mt-1">
            To add a new address, you must first delete an existing one.
          </p>
        {/if}
      </div>
    </div>

    <!-- Add new address button -->
    <div class="mb-6">
      {#if hasReachedLimit}
        <div class="flex flex-col md:flex-row gap-4">
          <Button
            variant="primary"
            disabled={true}
            title="You have reached the maximum limit of addresses"
            class="w-full sm:w-auto flex"
          >
            <Plus size={18} class="mr-2" />
            Add New Address (Limit Reached)
          </Button>

          <Button
            variant="secondary"
            on:click={goToManageAddresses}
            class="w-full sm:w-auto"
          >
            Manage My Addresses
          </Button>
        </div>
      {:else}
        <Button
          variant="primary"
          href="/profile/addresses/new?redirectTo=/book/address"
          class="w-full sm:w-auto"
        >
          <Plus size={18} class="mr-2" />
          Add New Address ({remainingAddresses} remaining)
        </Button>
      {/if}
    </div>

    <!-- Guest Address Form -->
    {#if !isAuthenticated}
      <div class="mb-8 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Enter Your Address
        </h2>

        <div class="space-y-4">
          <!-- Google Places Autocomplete -->
          <div>
            <GoogleMapsAutocomplete
              apiKey={googleMapsApiKey}
              label="Address"
              placeholder="Enter your address, estate, or complex name"
              required={true}
              bind:selectedAddress={selectedGoogleAddress}
              on:select={handleGooglePlacesSelect}
            />
          </div>

          <!-- Additional address details -->
          <div class="space-y-4">
            <!-- Street Number/Address Line 2 (for estates/complexes) -->
            {#if selectedGoogleAddress.placeType === "establishment" || selectedGoogleAddress.placeType === "point_of_interest"}
              <div>
                <label
                  for="streetNumber"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Street Number/Address Line 2
                  <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="streetNumber"
                  bind:value={guestAddress.streetNumber}
                  placeholder="e.g., 123 Main Road, Building A, etc."
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Please provide the street number or specific address within {selectedGoogleAddress.placeName ||
                    "the estate/complex"}
                </p>
              </div>
            {/if}

            <!-- Unit/Apartment -->
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  for="aptUnit"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {#if selectedGoogleAddress.placeType === "establishment" || selectedGoogleAddress.placeType === "point_of_interest"}
                    Apartment, and Unit Number
                    <span class="text-red-500">*</span>
                  {:else}
                    Apartment, and Unit (Optional)
                  {/if}
                </label>
                <input
                  type="text"
                  id="aptUnit"
                  bind:value={guestAddress.aptUnit}
                  placeholder="Apt 4B, Unit 12, etc."
                  required={selectedGoogleAddress.placeType ===
                    "establishment" ||
                    selectedGoogleAddress.placeType === "point_of_interest"}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {#if selectedGoogleAddress.placeType === "establishment" || selectedGoogleAddress.placeType === "point_of_interest"}
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Required for complexes and estates
                  </p>
                {/if}
              </div>
              <div>
                <label
                  for="instructions"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Access Instructions (Optional)
                </label>
                <input
                  type="text"
                  id="instructions"
                  bind:value={guestAddress.instructions}
                  placeholder="Gate code, parking instructions, etc."
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>

          <!-- Address validation error -->
          {#if addressValidationError}
            <div
              class="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800"
            >
              <div class="flex items-center">
                <AlertCircle class="w-4 h-4 text-red-600 mr-2" />
                <span class="text-sm font-medium text-red-800 dark:text-red-200"
                  >Address Error:</span
                >
              </div>
              <p class="text-sm text-red-700 dark:text-red-300 mt-1">
                {addressValidationError}
              </p>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Address selection with Google Maps integration for authenticated users -->
    {#if isAuthenticated}
      <AddressSelect {addresses} bind:selectedAddressId={selectedAddress} />
    {/if}

    <!-- Additional Instructions for existing addresses -->
    {#if selectedAddress && !addresses.find((a) => a.id === selectedAddress)?.instructions}
      <div class="mb-8 mt-8">
        <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Access Instructions (Optional)
        </h2>
        <div class="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <textarea
            bind:value={accessInstructions}
            rows={4}
            class="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Provide any special instructions for accessing your property (e.g. gate code, key location, etc.)"
          ></textarea>
        </div>
      </div>
    {/if}

    <!-- Navigation buttons -->
    <div class="flex justify-between">
      <Button variant="outline" on:click={goToPrevious} disabled={isLoading}>
        {#if isLoading}
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
          Loading...
        {:else}
          <ArrowLeft size={18} class="mr-2" />
          Back
        {/if}
      </Button>

      <Button
        variant="primary"
        on:click={continueToNext}
        disabled={isLoading ||
          (isAuthenticated && !selectedAddress) ||
          (!isAuthenticated && !isGuestAddressValid())}
      >
        {#if isLoading}
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
          Loading...
        {:else}
          Continue
          <ArrowRight size={18} class="ml-2" />
        {/if}
      </Button>
    </div>
  </div>
</div>
