<!-- src/routes/book/address/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { ArrowLeft, ArrowRight, Info, Plus, MapPin } from "lucide-svelte";
  
  import AddressSelect from "$lib/components/booking/AddressSelect.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import GoogleMapsAutocomplete from "$lib/components/maps/GoogleMapsAutocomplete.svelte";
  import { GuestBookingService } from "$lib/stores/guest-booking";
  import { MAX_ADDRESSES } from "$lib/constants/address";

  // Environment variables
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Get data from the server
  export let data;

  // Extract data from the server
  const { addresses, maxAddresses, hasReachedLimit, remainingAddresses, isGuest, user } = data;

  // Local state variables
  let selectedAddress = "";
  let accessInstructions = "";
  let isLoading = false;
  let selectedService = "";

  // Guest address input state
  let guestAddress = {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'South Africa',
    formatted: '',
    instructions: ''
  };
  let selectedGoogleAddress: any = null;
  let addressError = '';
  let isOutOfServiceArea = false;
  let addressInputValue = ''; // Track the input value separately

  // Address selection mode for guests
  let addressMode: 'select' | 'new' = isGuest ? 'new' : 'select';

  // Simple validation flag - this will be our source of truth
  let hasValidAddressData = false;

  // Initialize data from localStorage and guest booking store on mount
  onMount(() => {
    selectedService = localStorage.getItem("booking_service") || "";

    // If no service selected, go back to service selection
    if (!selectedService) {
      goto("/book");
      return;
    }

    // Load existing guest booking data if available
    const guestBookingData = GuestBookingService.load();
    if (guestBookingData?.addressData?.formatted) {
      guestAddress = guestBookingData.addressData;
      addressInputValue = guestBookingData.addressData.formatted;
      selectedGoogleAddress = {
        formatted_address: guestBookingData.addressData.formatted,
        address_components: []
      };
      hasValidAddressData = true; // Set validation flag
    }

    // Check URL for a 'loading' parameter that might be set during redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("loading") === "true") {
      isLoading = true;
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("loading");
        window.history.replaceState({}, "", url);
        isLoading = false;
      }, 500);
    }
  });

  // Handle Google Maps address selection for guests
  function handleAddressSelect(event: CustomEvent) {
    const addressData = event.detail.address;
    console.log('Address selected from Google Maps:', addressData);
    
    selectedGoogleAddress = addressData;
    addressError = '';
    
    // Update guest address with the selected data
    guestAddress = {
      street: addressData.street || addressData.formatted || addressInputValue,
      city: addressData.city || 'Johannesburg',
      state: addressData.state || 'Gauteng',
      zipCode: addressData.zipCode || '',
      country: 'South Africa',
      formatted: addressData.formatted || addressInputValue,
      instructions: guestAddress.instructions
    };

    // Set validation flag
    hasValidAddressData = true;
    
    console.log('Updated guestAddress:', guestAddress);
  }

  // Handle out of service area for guests
  function handleOutOfServiceArea() {
    isOutOfServiceArea = true;
  }

  // Update validation when input changes
  function updateValidation() {
    if (isGuest || addressMode === 'new') {
      // For guests, check if we have a meaningful address input
      hasValidAddressData = addressInputValue && addressInputValue.length > 10;
      
      // Auto-update guestAddress if we have input but no formatted address
      if (hasValidAddressData && !guestAddress.formatted) {
        guestAddress = {
          ...guestAddress,
          street: addressInputValue,
          city: 'Johannesburg',
          state: 'Gauteng',
          formatted: addressInputValue
        };
      }
    } else {
      // For authenticated users selecting saved address
      hasValidAddressData = selectedAddress && selectedAddress.length > 0;
    }
  }

  // Continue to next step
  async function continueToNext() {
    console.log('Continue clicked - validation check:', {
      hasValidAddressData,
      addressInputValue,
      guestAddressFormatted: guestAddress.formatted,
      selectedGoogleAddress: !!selectedGoogleAddress
    });

    if (!hasValidAddressData) {
      addressError = 'Please enter a valid address';
      return;
    }

    isLoading = true;

    try {
      let addressData;
      let instructions = '';

      if (isGuest || addressMode === 'new') {
        // Ensure we have proper address data
        if (!guestAddress.formatted && addressInputValue) {
          guestAddress = {
            ...guestAddress,
            street: addressInputValue,
            city: 'Johannesburg',
            state: 'Gauteng',
            formatted: addressInputValue
          };
        }

        addressData = guestAddress;
        instructions = guestAddress.instructions;

        // Save to guest booking store
        GuestBookingService.save({
          serviceId: selectedService,
          addressData: addressData
        });

        console.log('Saved guest address data:', addressData);
      } else {
        // Authenticated user selecting saved address
        const address = addresses.find((a) => a.id === selectedAddress);
        if (!address) {
          addressError = 'Selected address not found';
          isLoading = false;
          return;
        }

        instructions = address.instructions || accessInstructions;

        // For authenticated users, store both selected address ID and data
        localStorage.setItem("booking_address", selectedAddress);
        localStorage.setItem("booking_instructions", instructions);

        // Also save to guest booking store for consistency
        addressData = {
          street: address.street,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          country: address.country || 'South Africa',
          formatted: `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`,
          instructions: instructions
        };

        GuestBookingService.save({
          serviceId: selectedService,
          addressData: addressData
        });
      }

      // Navigate to scheduling
      await goto(`/book/schedule?serviceId=${selectedService}`);
    } catch (error) {
      console.error("Navigation error:", error);
      isLoading = false;
    }
  }

  // Go back to service selection
  function goBack() {
    goto("/book");
  }

  // Add new address for authenticated users
  function addNewAddress() {
    const returnUrl = `/book/address`;
    goto(`/profile/addresses/new?returnTo=${encodeURIComponent(returnUrl)}`);
  }

  // Watch for input changes and update validation
  $: if (addressInputValue) {
    updateValidation();
  }

  // Watch for selected address changes (for authenticated users)
  $: if (selectedAddress) {
    updateValidation();
  }

  // Watch for address mode changes
  $: if (addressMode) {
    updateValidation();
  }
</script>

<svelte:head>
  <title>Select Address | BrightBroom</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
  <div class="max-w-2xl mx-auto px-4">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center mb-4">
        <Button
          variant="ghost"
          size="sm"
          on:click={goBack}
          class="mr-4"
          disabled={isLoading}
        >
          <ArrowLeft size={16} class="mr-2" />
          Back
        </Button>
        
        <div class="flex-1">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {isGuest ? 'Enter Your Address' : 'Select Address'}
          </h1>
          <p class="text-gray-600 dark:text-gray-300 mt-1">
            {isGuest 
              ? 'Where would you like your cleaning service?' 
              : 'Choose from your saved addresses or add a new one'
            }
          </p>
        </div>
      </div>

      <!-- Progress indicator -->
      <div class="flex items-center space-x-4 text-sm">
        <span class="text-primary font-medium">1. Service</span>
        <span class="text-gray-400">→</span>
        <span class="text-primary font-medium">2. Address</span>
        <span class="text-gray-400">→</span>
        <span class="text-gray-500">3. Schedule</span>
        <span class="text-gray-400">→</span>
        <span class="text-gray-500">4. Review</span>
      </div>
    </div>

    <!-- Address Selection -->
    <div class="space-y-6">
      {#if !isGuest && addresses.length > 0}
        <!-- Mode selection for authenticated users -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <div class="flex space-x-4 mb-4">
            <button
              class="px-4 py-2 rounded-md text-sm font-medium transition-colors {addressMode === 'select' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}"
              on:click={() => addressMode = 'select'}
            >
              <MapPin size={16} class="inline mr-2" />
              Saved Addresses
            </button>
            <button
              class="px-4 py-2 rounded-md text-sm font-medium transition-colors {addressMode === 'new' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}"
              on:click={() => addressMode = 'new'}
            >
              <Plus size={16} class="inline mr-2" />
              New Address
            </button>
          </div>
        </div>
      {/if}

      {#if !isGuest && addressMode === 'select' && addresses.length > 0}
        <!-- Saved addresses for authenticated users -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Your Saved Addresses
          </h3>
          
          <AddressSelect
            addresses={addresses}
            bind:selectedAddress
            bind:accessInstructions
          />

          {#if hasReachedLimit}
            <div class="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div class="flex">
                <Info class="h-5 w-5 text-amber-400" />
                <div class="ml-3">
                  <p class="text-sm text-amber-800 dark:text-amber-200">
                    You have reached the maximum limit of {maxAddresses} addresses.
                  </p>
                </div>
              </div>
            </div>
          {:else}
            <Button
              variant="outline"
              on:click={addNewAddress}
              class="mt-4 w-full"
              disabled={isLoading}
            >
              <Plus size={16} class="mr-2" />
              Add New Address
            </Button>
          {/if}
        </div>
      {:else}
        <!-- New address input for guests and authenticated users choosing 'new' -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {isGuest ? 'Your Address' : 'Enter New Address'}
          </h3>

          <div class="space-y-4">
            <!-- Google Maps address search -->
            <GoogleMapsAutocomplete
              apiKey={googleMapsApiKey}
              label="Address"
              placeholder="Enter your address, estate, or complex name"
              required
              error={addressError}
              bind:value={addressInputValue}
              bind:selectedAddress={selectedGoogleAddress}
              on:select={handleAddressSelect}
              on:outOfServiceArea={handleOutOfServiceArea}
            />

            <!-- Status indicator -->
            {#if addressInputValue}
              <div class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div class="flex items-center text-sm">
                  <MapPin size={16} class="text-blue-500 mr-2" />
                  <span class="text-blue-700 dark:text-blue-300">
                    Address: {addressInputValue}
                  </span>
                </div>
                <div class="text-xs text-green-600 dark:text-green-400 mt-1">
                  ✓ Ready to continue
                </div>
              </div>
            {/if}

            {#if isOutOfServiceArea}
              <div class="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div class="flex">
                  <Info class="h-5 w-5 text-amber-400" />
                  <div class="ml-3">
                    <p class="text-sm text-amber-800 dark:text-amber-200">
                      Note: This address is outside our current service areas. We may have limited availability in your location.
                    </p>
                  </div>
                </div>
              </div>
            {/if}

            <!-- Access instructions -->
            <div>
              <label for="access-instructions" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Access Instructions (Optional)
              </label>
              <textarea
                id="access-instructions"
                bind:value={guestAddress.instructions}
                placeholder="e.g., Gate code, building entrance details, parking instructions..."
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                rows="3"
              ></textarea>
            </div>
          </div>
        </div>
      {/if}

      <!-- Continue button -->
      <div class="flex justify-end">
        <Button
          on:click={continueToNext}
          disabled={isLoading || !hasValidAddressData}
          class="px-8 {hasValidAddressData ? 'bg-primary hover:bg-primary-600' : ''}"
        >
          {#if isLoading}
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          {/if}
          Continue
          <ArrowRight size={16} class="ml-2" />
        </Button>
      </div>
    </div>
  </div>
</div>
