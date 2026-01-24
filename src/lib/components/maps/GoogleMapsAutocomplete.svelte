<!-- src/lib/components/maps/GoogleMapsAutocomplete.svelte -->
<script lang="ts">
  import { AlertCircle, Loader2, MapPin, X } from "lucide-svelte";
  import { createEventDispatcher, onDestroy, onMount } from "svelte";

  // Props
  export let apiKey: string;
  export let label = "Address";
  export let placeholder =
    "Enter your address, estate, or complex name, estate, or complex name";
  export let required = false;
  export let value = "";
  export let error = "";
  export let disabled = false;
  export let autoFocus = false;

  // Bind to select specific fields if needed
  export let selectedAddress: {
    formatted: string;
    street: string;
    aptUnit: string;
    city: string;
    state: string;
    zipCode: string;
    lat: number;
    lng: number;
    placeType: string;
    placeName: string;
  } = {
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

  // Service area boundaries
  const serviceAreas = [
    { name: "Fourways", lat: -26.0274, lng: 28.0106, radius: 15 },
    { name: "Bryanston", lat: -26.0525, lng: 28.0074, radius: 15 },
    { name: "Randburg", lat: -26.1063, lng: 27.9947, radius: 15 },
    { name: "Midrand", lat: -25.9992, lng: 28.1182, radius: 15 },
    { name: "North Riding", lat: -26.0469, lng: 27.951, radius: 15 },
    {
      name: "Cosmo City, Roodepoort",
      lat: -26.0212639,
      lng: 27.9289995,
      radius: 50,
    },
    { name: "Diepsloot", lat: -25.9412555, lng: 27.96671, radius: 100 },
    { name: "Honeydew", lat: -26.0225, lng: 27.9475, radius: 30 },
    { name: "Monaghan Farm, Centurion", lat: -25.904442, lng: 27.454882, radius: 15 },
  ];

  // Create custom dispatch events
  const dispatch = createEventDispatcher<{
    select: { address: typeof selectedAddress };
    outOfServiceArea: { address: string };
  }>();

  // Local state
  let inputElement: HTMLInputElement;
  let autocomplete: google.maps.places.Autocomplete | null = null;
  let isLoading = false;
  let isScriptLoading = true;
  let isGoogleMapsLoaded = false;
  let isClearButtonVisible = false;
  let scriptError = false;

  // Clear the input
  function clearInput() {
    value = "";
    selectedAddress = {
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
    isClearButtonVisible = false;

    if (inputElement) {
      inputElement.focus();
    }
  }

  // Check if an address is within service areas
  function isWithinServiceArea(lat: number, lng: number): boolean {
    for (const area of serviceAreas) {
      const distance = getDistanceFromLatLonInKm(lat, lng, area.lat, area.lng);
      if (distance <= area.radius) {
        return true;
      }
    }
    return false;
  }

  // Calculate distance using Haversine formula
  function getDistanceFromLatLonInKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Determine the type of place selected
  function getPlaceType(place: google.maps.places.PlaceResult): string {
    const types = place.types || [];

    if (types.includes("establishment")) return "establishment";
    if (types.includes("point_of_interest")) return "point_of_interest";
    if (types.includes("sublocality")) return "sublocality";
    if (types.includes("neighborhood")) return "neighborhood";
    if (types.includes("premise")) return "premise";

    return "address";
  }

  // Extract address components from Google Places result
  function extractAddressComponents(
    place: google.maps.places.PlaceResult,
  ): typeof selectedAddress {
    const components = place.address_components || [];
    let street_number = "";
    let route = "";
    let sublocality = "";
    let sublocality_level_1 = "";
    let sublocality_level_2 = "";
    let locality = "";
    let administrative_area_level_1 = "";
    let postal_code = "";

    // Extract each component
    for (const component of components) {
      const types = component.types;

      if (types.includes("street_number")) {
        street_number = component.long_name;
      } else if (types.includes("route")) {
        route = component.long_name;
      } else if (types.includes("sublocality_level_1")) {
        sublocality_level_1 = component.long_name;
      } else if (types.includes("sublocality_level_2")) {
        sublocality_level_2 = component.long_name;
      } else if (
        types.includes("sublocality") ||
        types.includes("sublocality_level_1")
      ) {
        sublocality = component.long_name;
      } else if (types.includes("locality")) {
        locality = component.long_name;
      } else if (types.includes("administrative_area_level_1")) {
        administrative_area_level_1 = component.long_name;
      } else if (types.includes("postal_code")) {
        postal_code = component.long_name;
      }
    }

    // Determine place type and name
    const placeType = getPlaceType(place);
    const placeName = place.name || "";

    // Construct street address - handle different place types
    let street = "";
    if (placeType === "address" || placeType === "premise") {
      // Traditional address
      street = street_number ? `${street_number} ${route}` : route;
    } else if (
      placeType === "establishment" ||
      placeType === "point_of_interest"
    ) {
      // For estates/complexes, use the place name and/or route
      // If no route, use sublocality as fallback for South African estates
      street = placeName || route || sublocality_level_1 || sublocality_level_2 || sublocality;
    } else {
      // Fallback - try multiple sources for South African addresses
      street = route || sublocality_level_1 || sublocality_level_2 || sublocality || placeName;
    }

    // Determine city (prefer locality, fallback to sublocality)
    const city = locality || sublocality || sublocality_level_1;

    return {
      formatted: place.formatted_address || "",
      street: street || "", // Ensure street is never undefined
      aptUnit: "",
      city: city || "", // Ensure city is never undefined
      state: administrative_area_level_1 || "", // Ensure state is never undefined
      zipCode: postal_code || "", // Ensure zipCode is never undefined
      lat: place.geometry?.location?.lat() || 0,
      lng: place.geometry?.location?.lng() || 0,
      placeType,
      placeName,
    };
  }

  // Initialise Google Maps Places Autocomplete
  function initAutocomplete() {
    if (
      !inputElement ||
      !window.google ||
      !window.google.maps ||
      !window.google.maps.places
    ) {
      return;
    }

    try {
      // Define service area bounds (covers Fourways, Bryanston, Randburg, Midrand, Centurion/Monaghan Farm)
      const serviceAreaBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(-26.3, 27.4),  // SW corner (covers Centurion/Monaghan Farm)
        new google.maps.LatLng(-25.8, 28.3),  // NE corner (covers Midrand)
      );

      // Initialise the autocomplete (no types restriction to include addresses, estates, and office parks)
      autocomplete = new google.maps.places.Autocomplete(inputElement, {
        componentRestrictions: { country: "za" },
        fields: [
          "address_components",
          "formatted_address",
          "geometry",
          "name",
          "types",
        ],
        bounds: serviceAreaBounds,
        strictBounds: true, // Enforce bounds as restriction, not just bias
      });

      // Set bounds for the autocomplete
      autocomplete.setBounds(serviceAreaBounds);

      // Add the place_changed event listener
      autocomplete.addListener("place_changed", handlePlaceSelect);

      isGoogleMapsLoaded = true;
      isScriptLoading = false;
      console.log(
        "Google Maps Autocomplete initialised successfully (Legacy API)",
      );
    } catch (initError) {
      console.error("Error initializing autocomplete:", initError);
      scriptError = true;
      isScriptLoading = false;
    }
  }

  // Handle when a place is selected
  function handlePlaceSelect() {
    if (!autocomplete) return;

    isLoading = true;

    try {
      const place = autocomplete.getPlace();

      if (!place.geometry) {
        error = "Please select an address or location from the dropdown";
        isLoading = false;
        return;
      }

      // Extract location coordinates
      const lat = place.geometry.location?.lat() || 0;
      const lng = place.geometry.location?.lng() || 0;

      // Check if address is within our service areas
      if (!isWithinServiceArea(lat, lng)) {
        error = "We're not in your neighbourhood yet! BrightBroom currently sparkles in Fourways, Bryanston, Randburg, Midrand, and surrounding areas. We're growing - check back soon!";
        dispatch("outOfServiceArea", {
          address: place.formatted_address || "",
        });
        isLoading = false;
        return;
      }

      // Clear any previous errors
      error = "";

      // Extract address components
      const addressData = extractAddressComponents(place);
      selectedAddress = addressData;

      // Set input value - use place name for estates/complexes, formatted address otherwise
      if (
        addressData.placeType === "establishment" ||
        addressData.placeType === "point_of_interest"
      ) {
        value = addressData.placeName || addressData.formatted;
      } else {
        value = addressData.formatted;
      }

      isClearButtonVisible = true;

      // Dispatch the select event with the address data
      dispatch("select", { address: addressData });
    } catch (err) {
      console.error("Error selecting place:", err);
      error = "Error processing the selected location";
    } finally {
      isLoading = false;
    }
  }

  // Load Google Maps script
  function loadGoogleMapsScript() {
    if (window.google && window.google.maps && window.google.maps.places) {
      isScriptLoading = false;
      isGoogleMapsLoaded = true;
      initAutocomplete();
      return;
    }

    isScriptLoading = true;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setTimeout(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          initAutocomplete();
        } else {
          scriptError = true;
          isScriptLoading = false;
        }
      }, 100);
    };

    script.onerror = () => {
      isScriptLoading = false;
      scriptError = true;
      console.error("Failed to load Google Maps script");
    };

    document.head.appendChild(script);
  }

  // Update clear button visibility when value changes
  $: isClearButtonVisible = value.length > 0;

  // Watch for changes in value
  $: if (value === "") {
    selectedAddress = {
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
  }

  onMount(() => {
    loadGoogleMapsScript();

    if (autoFocus && inputElement) {
      inputElement.focus();
    }
  });

  onDestroy(() => {
    if (autocomplete) {
      google.maps.event.clearInstanceListeners(autocomplete);
    }
  });
</script>

<div class="address-autocomplete">
  <!-- Label -->
  {#if label}
    <label
      for="google-maps-autocomplete"
      class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {label}
      {required ? "*" : ""}
    </label>
  {/if}

  <!-- Input container -->
  <div class="relative">
    <div class="relative">
      <!-- Map pin icon -->
      <div
        class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
      >
        <MapPin class="h-5 w-5 text-gray-400" />
      </div>

      <!-- Input field -->
      <input
        id="google-maps-autocomplete"
        type="text"
        {placeholder}
        {required}
        {disabled}
        autocomplete="off"
        bind:this={inputElement}
        bind:value
        class="w-full rounded-md border border-gray-300 py-2 pl-10 pr-10 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary
        bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:border-gray-600
        {error ? 'border-red-500 dark:border-red-400' : ''}"
      />

      <!-- Clear button -->
      {#if isClearButtonVisible}
        <button
          type="button"
          class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          on:click={clearInput}
          aria-label="Clear address"
        >
          <X class="h-5 w-5" />
        </button>
      {/if}

      <!-- Loading spinner -->
      {#if isLoading}
        <div class="absolute inset-y-0 right-0 flex items-center pr-3">
          <Loader2 class="h-5 w-5 animate-spin text-primary" />
        </div>
      {/if}
    </div>

    <!-- Loading script indicator -->
    {#if isScriptLoading}
      <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Loading Google Maps...
      </div>
    {/if}

    <!-- Script error -->
    {#if scriptError}
      <div
        class="mt-1 rounded-md bg-yellow-50 p-2 text-xs dark:bg-yellow-900/20"
      >
        <div class="flex items-start">
          <AlertCircle
            class="mr-1 h-4 w-4 flex-shrink-0 text-yellow-600 dark:text-yellow-400"
          />
          <div>
            <p class="text-yellow-800 dark:text-yellow-200">
              Google Maps failed to load. This is often caused by ad blockers.
            </p>
            <p class="mt-1 text-yellow-700 dark:text-yellow-300">
              Try: Disable ad blocker, refresh page, or manually Enter your
              address, estate, or complex name details.
            </p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Error message -->
    {#if error}
      <div class="mt-1 text-xs text-red-500 dark:text-red-400">
        {error}
      </div>
    {/if}

    <!-- Place type indicator -->
    {#if selectedAddress.placeType && selectedAddress.placeType !== "address"}
      <div class="mt-1 text-xs text-primary dark:text-primary-400">
        {#if selectedAddress.placeType === "establishment"}
          📍 Estate/Complex selected
        {:else if selectedAddress.placeType === "point_of_interest"}
          🏢 Point of interest selected
        {:else if selectedAddress.placeType === "sublocality"}
          🏘️ Area selected
        {:else}
          📍 Location selected
        {/if}
      </div>
    {/if}
  </div>
</div>
