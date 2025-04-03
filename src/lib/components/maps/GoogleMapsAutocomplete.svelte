<!-- src/lib/components/maps/GoogleMapsAutocomplete.svelte -->
<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { MapPin, X, Loader2 } from 'lucide-svelte';
  
  // Props
  export let apiKey: string;
  export let label = 'Address';
  export let placeholder = 'Enter your address';
  export let required = false;
  export let value = '';
  export let error = '';
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
  } = {
    formatted: '',
    street: '',
    aptUnit: '',
    city: '',
    state: '',
    zipCode: '',
    lat: 0,
    lng: 0
  };

  // Service area boundaries (approximate coordinates)
  const serviceAreas = [
    { name: 'Fourways', lat: -26.0274, lng: 28.0106, radius: 5 }, // 5km radius
    { name: 'Sandton', lat: -26.1070, lng: 28.0567, radius: 6 },
    { name: 'North Riding', lat: -26.0469, lng: 27.9510, radius: 4 },
    { name: 'Roodepoort', lat: -26.1625, lng: 27.8727, radius: 7 }
  ];
  
  // Create custom dispatch events
  const dispatch = createEventDispatcher<{
    select: { address: typeof selectedAddress },
    outOfServiceArea: { address: string }
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
    value = '';
    selectedAddress = {
      formatted: '',
      street: '',
      aptUnit: '',
      city: '',
      state: '',
      zipCode: '',
      lat: 0,
      lng: 0
    };
    isClearButtonVisible = false;
    
    // Focus the input after clearing
    if (inputElement) {
      inputElement.focus();
    }
  }
  
  // Check if an address is within service areas
  function isWithinServiceArea(lat: number, lng: number): boolean {
    // Calculate distance to each service area center point
    for (const area of serviceAreas) {
      const distance = getDistanceFromLatLonInKm(lat, lng, area.lat, area.lng);
      if (distance <= area.radius) {
        return true;
      }
    }
    return false;
  }
  
  // Calculate distance between coordinates using the Haversine formula
  function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  }
  
  function deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
  
  // Extract address components from Google Places result
  function extractAddressComponents(place: google.maps.places.PlaceResult): typeof selectedAddress {
    const components = place.address_components || [];
    let street_number = '';
    let route = '';
    let sublocality = '';
    let locality = '';
    let administrative_area_level_1 = '';
    let postal_code = '';
    
    // Extract each component
    for (const component of components) {
      const types = component.types;
      
      if (types.includes('street_number')) {
        street_number = component.long_name;
      } else if (types.includes('route')) {
        route = component.long_name;
      } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
        sublocality = component.long_name;
      } else if (types.includes('locality')) {
        locality = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        administrative_area_level_1 = component.long_name;
      } else if (types.includes('postal_code')) {
        postal_code = component.long_name;
      }
    }
    
    // Construct street address
    const street = street_number ? `${street_number} ${route}` : route;
    
    // Determine city (prefer locality, fallback to sublocality)
    const city = locality || sublocality;
    
    return {
      formatted: place.formatted_address || '',
      street,
      aptUnit: '',
      city,
      state: administrative_area_level_1,
      zipCode: postal_code,
      lat: place.geometry?.location?.lat() || 0,
      lng: place.geometry?.location?.lng() || 0
    };
  }
  
  // Initialize Google Maps Places Autocomplete
  function initAutocomplete() {
    if (!inputElement || !window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }
    
    // Initialize the autocomplete with restrictions to South Africa
    autocomplete = new google.maps.places.Autocomplete(inputElement, {
      componentRestrictions: { country: 'za' },
      fields: ['address_components', 'formatted_address', 'geometry'],
      types: ['address']
    });
    
    // Bias results toward Gauteng area
    const gautengBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(-26.5, 27.5), // SW corner
      new google.maps.LatLng(-25.5, 28.5)  // NE corner
    );
    autocomplete.setBounds(gautengBounds);
    
    // Add the place_changed event listener
    autocomplete.addListener('place_changed', handlePlaceSelect);
    
    isGoogleMapsLoaded = true;
    isScriptLoading = false;
  }
  
  // Handle when a place is selected
  function handlePlaceSelect() {
    if (!autocomplete) return;
    
    isLoading = true;
    
    try {
      const place = autocomplete.getPlace();
      
      if (!place.geometry) {
        error = 'Please select an address from the dropdown';
        isLoading = false;
        return;
      }
      
      // Extract location coordinates
      const lat = place.geometry.location?.lat() || 0;
      const lng = place.geometry.location?.lng() || 0;
      
      // Check if address is within our service areas
      if (!isWithinServiceArea(lat, lng)) {
        error = 'Address is outside our current service areas';
        dispatch('outOfServiceArea', { address: place.formatted_address || '' });
        isLoading = false;
        return;
      }
      
      // Clear any previous errors
      error = '';
      
      // Extract address components
      const addressData = extractAddressComponents(place);
      selectedAddress = addressData;
      
      // Set input value to formatted address
      value = addressData.formatted;
      isClearButtonVisible = true;
      
      // Dispatch the select event with the address data
      dispatch('select', { address: addressData });
    } catch (err) {
      console.error('Error selecting place:', err);
      error = 'Error processing the selected address';
    } finally {
      isLoading = false;
    }
  }
  
  // Load Google Maps script
  function loadGoogleMapsScript() {
    if (window.google && window.google.maps && window.google.maps.places) {
      // Script already loaded
      isScriptLoading = false;
      isGoogleMapsLoaded = true;
      initAutocomplete();
      return;
    }
    
    isScriptLoading = true;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      isScriptLoading = false;
      isGoogleMapsLoaded = true;
      initAutocomplete();
    };
    
    script.onerror = () => {
      isScriptLoading = false;
      scriptError = true;
      console.error('Failed to load Google Maps script');
    };
    
    document.head.appendChild(script);
  }
  
  // Update clear button visibility when value changes
  $: isClearButtonVisible = value.length > 0;
  
  // Watch for changes in value
  $: if (value === '') {
    selectedAddress = {
      formatted: '',
      street: '',
      aptUnit: '',
      city: '',
      state: '',
      zipCode: '',
      lat: 0,
      lng: 0
    };
  }
  
  onMount(() => {
    loadGoogleMapsScript();
    
    // Focus input if autoFocus is true
    if (autoFocus && inputElement) {
      inputElement.focus();
    }
  });
  
  onDestroy(() => {
    // Clean up event listeners if needed
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
      {label} {required ? '*' : ''}
    </label>
  {/if}
  
  <!-- Input container -->
  <div class="relative">
    <div class="relative">
      <!-- Map pin icon -->
      <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
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
      <div class="mt-1 text-xs text-red-500 dark:text-red-400">
        Failed to load Google Maps. Please try refreshing the page.
      </div>
    {/if}
    
    <!-- Error message -->
    {#if error}
      <div class="mt-1 text-xs text-red-500 dark:text-red-400">
        {error}
      </div>
    {/if}
  </div>
</div>
