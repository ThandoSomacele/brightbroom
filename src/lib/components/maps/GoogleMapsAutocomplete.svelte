<!-- src/lib/components/maps/GoogleMapsAutocomplete.svelte -->
<script context="module" lang="ts">
  // One Maps script per page, however many pickers it has. Google calls the
  // callback once the Places library is ready; with loading=async the
  // script's own onload fires before that.
  const MAPS_READY_CALLBACK = "__mapsPlacesReady";
  let mapsReady: Promise<void> | null = null;

  function loadMapsPlaces(apiKey: string): Promise<void> {
    if (window.google?.maps?.places) return Promise.resolve();
    mapsReady ??= new Promise<void>((resolve, reject) => {
      (window as unknown as Record<string, () => void>)[MAPS_READY_CALLBACK] = () => resolve();
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&loading=async&callback=${MAPS_READY_CALLBACK}`;
      script.async = true;
      script.onerror = () => {
        mapsReady = null; // let a later picker try again
        reject(new Error("The Google Maps script failed to load"));
      };
      document.head.appendChild(script);
    });
    return mapsReady;
  }
</script>

<script lang="ts">
  import Icon from "$lib/components/ui/Icon.svelte";
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import {
    formatServiceAreaList,
    getOutOfServiceAreaMessage,
    isWithinServiceArea,
    serviceAreaBounds,
    type ServiceArea,
  } from "$lib/utils/service-areas";

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
  /** This site's service areas, from the page's load data (serviceAreaService) */
  export let serviceAreas: ServiceArea[];
  /**
   * Refuse addresses outside the service areas. Off for admin forms that pick
   * a point anywhere, such as the centre of a new service area.
   */
  export let enforceServiceArea = true;
  /** The input's id: give each picker on a page its own */
  export let id = "address-autocomplete";

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

  // Service areas come from the serviceAreas prop: the same list the server
  // checks against, so a customer can't be told one thing here and another
  // at checkout.

  // Create custom dispatch events
  const dispatch = createEventDispatcher<{
    select: { address: typeof selectedAddress };
    // Coordinates are included so a listener can report how far out the
    // address was, rather than only that it was rejected
    outOfServiceArea: { address: string; lat: number; lng: number };
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
      // Suggest addresses near the service areas first. A bias, not a limit:
      // someone just outside still finds their address and gets the friendly
      // "not in your area yet" message from the distance check below.
      const box = serviceAreaBounds(serviceAreas);
      const bounds = box
        ? new google.maps.LatLngBounds(
            new google.maps.LatLng(box.south, box.west),
            new google.maps.LatLng(box.north, box.east),
          )
        : undefined;

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
        bounds,
        strictBounds: false,
      });

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
      if (enforceServiceArea && !isWithinServiceArea(serviceAreas, lat, lng)) {
        error = getOutOfServiceAreaMessage(serviceAreas, lat, lng);
        dispatch("outOfServiceArea", {
          address: place.formatted_address || "",
          lat,
          lng,
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

  // Load Google Maps (once per page) and attach the autocomplete
  function loadGoogleMapsScript() {
    isScriptLoading = true;
    loadMapsPlaces(apiKey)
      .then(() => initAutocomplete())
      .catch((loadError) => {
        console.error(loadError);
        scriptError = true;
        isScriptLoading = false;
      });
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
      for={id}
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
        <Icon name="map-pin" size={20} class="text-gray-400" />
      </div>

      <!-- Input field -->
      <input
        {id}
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
          <Icon name="x" size={20} />
        </button>
      {/if}

      <!-- Loading spinner -->
      {#if isLoading}
        <div class="absolute inset-y-0 right-0 flex items-center pr-3">
          <Icon name="spinner-gap" size={20} class="animate-spin text-primary-700" />
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
          <Icon name="warning-circle" size={16}
            class="mr-1 flex-shrink-0 text-yellow-600 dark:text-yellow-400"
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

    <!-- Service area hint (show when no address selected and no error) -->
    {#if enforceServiceArea && !selectedAddress.formatted && !error && !isScriptLoading}
      <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {#if serviceAreas.length}
          We currently serve {formatServiceAreaList(serviceAreas)}.
        {:else}
          {getOutOfServiceAreaMessage(serviceAreas)}
        {/if}
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
      <div class="mt-1 flex items-center gap-1 text-xs text-primary-700 dark:text-primary-400">
        {#if selectedAddress.placeType === "establishment"}
          <Icon name="map-pin" size={12} /> Estate/Complex selected
        {:else if selectedAddress.placeType === "point_of_interest"}
          <Icon name="buildings" size={12} /> Point of interest selected
        {:else if selectedAddress.placeType === "sublocality"}
          <Icon name="house" size={12} /> Area selected
        {:else}
          <Icon name="map-pin" size={12} /> Location selected
        {/if}
      </div>
    {/if}
  </div>
</div>
