<!-- src/lib/components/booking/AddressSelect.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import GoogleMapsAutocomplete from "$lib/components/maps/GoogleMapsAutocomplete.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import {
    addressStore,
    type AddressInput,
    type SavedAddress,
  } from "$lib/stores/addressStore";
  import { getServiceAreaDescription } from "$lib/utils/serviceAreaValidator";
  import { AlertCircle, Check, Home, MapPin } from "lucide-svelte";

  // Props
  export let addresses: SavedAddress[] = [];
  export let selectedAddressId = "";
  export let googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Local state
  let isAddingNewAddress = false;
  let isLoading = false;
  let newAddressInput = "";
  let newAddressDetails: AddressInput = {
    formatted: "",
    street: "",
    aptUnit: "",
    city: "",
    state: "",
    zipCode: "",
    lat: 0,
    lng: 0,
  };
  let aptUnit = "";
  let addressInstructions = "";
  let makeDefault = false;
  let addressError = "";
  let serviceAreaError = "";
  let showServiceAreaInfo = true;

  // Handle address selection
  function selectAddress(id: string) {
    selectedAddressId = id;
    serviceAreaError = "";
  }

  // Toggle new address form
  function toggleNewAddressForm() {
    isAddingNewAddress = !isAddingNewAddress;
    if (!isAddingNewAddress) {
      // Reset form if closing
      newAddressInput = "";
      aptUnit = "";
      addressInstructions = "";
      newAddressDetails = {
        formatted: "",
        street: "",
        aptUnit: "",
        city: "",
        state: "",
        zipCode: "",
        lat: 0,
        lng: 0,
      };
      addressError = "";
    }
  }

  // Handle address selected from Google Maps
  function handleAddressSelect(event: CustomEvent<{ address: AddressInput }>) {
    newAddressDetails = event.detail.address;
    serviceAreaError = "";
  }

  // Handle out of service area notification
  function handleOutOfServiceArea(event: CustomEvent<{ address: string }>) {
    const address = event.detail.address;
    serviceAreaError = `Sorry, "${address}" is outside our current service areas. We currently serve Fourways, Sandton, North Riding AH, and Roodepoort in Gauteng.`;
  }

  // Save new address
  async function saveNewAddress() {
    if (!newAddressDetails.formatted || !newAddressDetails.street) {
      addressError = "Please select a valid address from the dropdown";
      return;
    }

    isLoading = true;

    try {
      // Update with apartment/unit number
      newAddressDetails.aptUnit = aptUnit;

      // Save address using the store
      const savedAddress = await addressStore.saveCurrentAddress(
        newAddressDetails,
        addressInstructions,
        makeDefault,
      );

      if (savedAddress) {
        // Add to local addresses list
        addresses = [...addresses, savedAddress];

        // Select the new address
        selectedAddressId = savedAddress.id;

        // Close the form
        isAddingNewAddress = false;

        // Reset form
        newAddressInput = "";
        aptUnit = "";
        addressInstructions = "";
        makeDefault = false;
      } else if (addressStore.error) {
        addressError = addressStore.error;
      }
    } catch (error) {
      console.error("Error saving address:", error);
      addressError = "Failed to save address. Please try again.";
    } finally {
      isLoading = false;
    }
  }

  // Go to address management page
  function goToAddressManagement() {
    goto("/profile/addresses/new?redirectTo=/book/address");
  }
</script>

<div class="space-y-6">
  <!-- Service area info banner -->
  {#if showServiceAreaInfo}
    <div
      class="bg-primary-50 p-4 rounded-lg border border-primary-100 flex items-start dark:bg-primary-900/20 dark:border-primary-800"
    >
      <div class="flex-shrink-0 mt-0.5">
        <AlertCircle class="h-5 w-5 text-primary" />
      </div>
      <div class="ml-3">
        <h3 class="text-sm font-medium text-primary">
          Service Area Information
        </h3>
        <div class="mt-2 text-sm text-primary-800 dark:text-primary-300">
          <p>{getServiceAreaDescription()}</p>
        </div>
        <div class="mt-2">
          <button
            type="button"
            class="text-primary-700 text-xs hover:text-primary-600 dark:text-primary-300 dark:hover:text-primary-200"
            on:click={() => (showServiceAreaInfo = false)}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Saved Addresses -->
  {#if addresses.length > 0}
    <div class="grid gap-4 md:grid-cols-2">
      {#each addresses as address}
        <div
          class={`cursor-pointer rounded-lg border-2 p-5 transition-all hover:shadow-md
              ${
                selectedAddressId === address.id
                  ? "border-primary bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20"
                  : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              }`}
          on:click={() => selectAddress(address.id)}
          on:keydown={(e) => e.key === "Enter" && selectAddress(address.id)}
          role="button"
          tabindex="0"
        >
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary dark:bg-primary-900/20"
              >
                <Home size={20} />
              </div>
            </div>

            <div class="ml-4 flex-1">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  {address.street}
                </h3>
                {#if selectedAddressId === address.id}
                  <div class="bg-primary rounded-full p-1 text-white">
                    <Check size={14} />
                  </div>
                {/if}
              </div>

              {#if address.aptUnit}
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Unit {address.aptUnit}
                </p>
              {/if}

              <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {address.city}, {address.state}
                {address.zipCode}
              </p>

              {#if address.isDefault}
                <span
                  class="mt-2 inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary dark:bg-primary-900/20"
                >
                  Default
                </span>
              {/if}
            </div>
          </div>
        </div>
      {/each}

      <!-- Add new address card -->
      <div
        class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-5 text-center hover:border-primary-300 dark:border-gray-700 dark:hover:border-primary-700"
        on:click={toggleNewAddressForm}
        on:keydown={(e) => e.key === "Enter" && toggleNewAddressForm()}
        role="button"
        tabindex="0"
      >
        <div
          class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
        >
          <MapPin size={24} class="text-gray-600 dark:text-gray-400" />
        </div>
        <h3 class="mb-1 text-lg font-medium text-gray-900 dark:text-white">
          Add New Address
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Add a new location for your cleaning service
        </p>
      </div>
    </div>
  {:else}
    <div
      class="mb-6 rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800"
    >
      <div
        class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
      >
        <MapPin size={24} class="text-gray-500 dark:text-gray-400" />
      </div>
      <h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-white">
        No addresses found
      </h3>
      <p class="mb-4 text-gray-600 dark:text-gray-400">
        You haven't added any addresses yet. Add an address to continue with
        your booking.
      </p>
      <Button variant="primary" on:click={toggleNewAddressForm}>
        Add New Address
      </Button>
    </div>
  {/if}

  <!-- New Address Form -->
  {#if isAddingNewAddress}
    <div class="mt-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
        Add New Address
      </h2>

      <div class="space-y-4">
        <!-- Google Maps Address Search -->
        <GoogleMapsAutocomplete
          apiKey={googleMapsApiKey}
          label="Address"
          placeholder="Enter your address"
          bind:value={newAddressInput}
          bind:selectedAddress={newAddressDetails}
          bind:error={addressError}
          on:select={handleAddressSelect}
          on:outOfServiceArea={handleOutOfServiceArea}
          autoFocus={true}
        />

        <!-- Service area error -->
        {#if serviceAreaError}
          <div
            class="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300"
          >
            <div class="flex">
              <div class="flex-shrink-0">
                <AlertCircle class="h-5 w-5 text-red-400 dark:text-red-300" />
              </div>
              <div class="ml-3">
                <p>{serviceAreaError}</p>
              </div>
            </div>
          </div>
        {/if}

        <!-- Additional Address Fields -->
        <div>
          <label
            for="apt-unit"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Apartment/Unit Number (Optional)
          </label>
          <input
            id="apt-unit"
            type="text"
            bind:value={aptUnit}
            placeholder="Apt #, Unit #, Floor, etc."
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label
            for="instructions"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Access Instructions (Optional)
          </label>
          <textarea
            id="instructions"
            bind:value={addressInstructions}
            rows={3}
            placeholder="Gate code, key location, etc."
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          ></textarea>
        </div>

        <div class="flex items-start">
          <div class="flex h-5 items-center">
            <input
              id="default-address"
              type="checkbox"
              bind:checked={makeDefault}
              class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
          <div class="ml-3 text-sm">
            <label
              for="default-address"
              class="font-medium text-gray-700 dark:text-gray-300"
            >
              Set as default address
            </label>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            on:click={toggleNewAddressForm}
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            on:click={saveNewAddress}
            disabled={!newAddressDetails.formatted ||
              isLoading ||
              !!serviceAreaError}
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
              Saving...
            {:else}
              Save Address
            {/if}
          </Button>
        </div>
      </div>
    </div>
  {/if}
</div>
