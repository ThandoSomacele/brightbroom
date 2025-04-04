// src/lib/stores/addressStore.ts
import {
  getClosestServiceArea,
  isWithinServiceArea,
  SERVICE_AREAS,
} from "$lib/utils/serviceAreaValidator";
import { derived, get, writable } from "svelte/store";

// Maximum addresses constant
export const MAX_ADDRESSES = 3;

// Define address types
export interface AddressInput {
  formatted: string;
  street: string;
  aptUnit: string;
  city: string;
  state: string;
  zipCode: string;
  lat: number;
  lng: number;
}

export interface SavedAddress extends AddressInput {
  id: string;
  userId: string;
  isDefault: boolean;
  instructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Store state interface
interface AddressStoreState {
  currentAddress: AddressInput | null;
  savedAddresses: SavedAddress[];
  isLoading: boolean;
  error: string | null;
  serviceAreaEnabled: boolean;
}

// Create the store with initial state
const initialState: AddressStoreState = {
  currentAddress: null,
  savedAddresses: [],
  isLoading: false,
  error: null,
  serviceAreaEnabled: true,
};

// Create the store
function createAddressStore() {
  const { subscribe, set, update } = writable<AddressStoreState>(initialState);

  return {
    subscribe,

    /**
     * Set the current address from the autocomplete component
     */
    setCurrentAddress: (address: AddressInput | null) => {
      update((state) => {
        // Validate service area if enabled
        if (state.serviceAreaEnabled && address && address.lat && address.lng) {
          if (!isWithinServiceArea(address.lat, address.lng)) {
            // Address outside service area
            return {
              ...state,
              currentAddress: null,
              error: "Address is outside our service area",
            };
          }
        }

        return {
          ...state,
          currentAddress: address,
          error: null,
        };
      });
    },

    /**
     * Toggle service area restriction
     */
    toggleServiceAreaRestriction: (enabled: boolean) => {
      update((state) => ({
        ...state,
        serviceAreaEnabled: enabled,
      }));
    },

    /**
     * Load user's saved addresses from the API
     */
    loadSavedAddresses: async () => {
      update((state) => ({ ...state, isLoading: true, error: null }));

      try {
        const response = await fetch("/api/addresses");
        if (!response.ok) {
          throw new Error("Failed to load addresses");
        }

        const data = await response.json();
        const addresses: SavedAddress[] = data.addresses;

        update((state) => ({
          ...state,
          savedAddresses: addresses,
          isLoading: false,
        }));

        return addresses;
      } catch (error) {
        console.error("Error loading addresses:", error);

        update((state) => ({
          ...state,
          isLoading: false,
          error: error instanceof Error ? error.message : "An error occurred",
        }));

        return [];
      }
    },

    /**
     * Get information about address limits
     */
    getAddressLimitInfo: () => {
      const state = get({ subscribe });
      return {
        current: state.savedAddresses.length,
        max: MAX_ADDRESSES,
        remaining: Math.max(0, MAX_ADDRESSES - state.savedAddresses.length),
        hasReachedLimit: state.savedAddresses.length >= MAX_ADDRESSES,
      };
    },

    /**
     * Check if user has reached address limit
     */
    hasReachedAddressLimit: () => {
      const state = get({ subscribe });
      return state.savedAddresses.length >= MAX_ADDRESSES;
    },

    /**
     * Save the current address to the user's saved addresses
     */
    saveCurrentAddress: async (
      addressInput: AddressInput,
      instructions?: string,
      isDefault?: boolean,
    ) => {
      // Check if user has reached address limit
      if (get({ subscribe }).savedAddresses.length >= MAX_ADDRESSES) {
        update((state) => ({
          ...state,
          error: `You have reached the maximum limit of ${MAX_ADDRESSES} addresses. Please delete an existing address before adding a new one.`,
        }));
        return null;
      }

      // First capture the current state before beginning the async operation
      let currentServiceAreaEnabled: boolean;

      update((state) => {
        currentServiceAreaEnabled = state.serviceAreaEnabled;
        return { ...state, isLoading: true, error: null };
      });

      try {
        // Now use the captured value instead of trying to access state directly
        if (currentServiceAreaEnabled && addressInput.lat && addressInput.lng) {
          if (!isWithinServiceArea(addressInput.lat, addressInput.lng)) {
            update((state) => ({
              ...state,
              isLoading: false,
              error: "Address is outside our service area",
            }));
            return null;
          }
        }

        const response = await fetch("/api/addresses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            street: addressInput.street,
            aptUnit: addressInput.aptUnit,
            city: addressInput.city,
            state: addressInput.state,
            zipCode: addressInput.zipCode,
            instructions,
            isDefault,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to save address");
        }

        const data = await response.json();
        const newAddress = data.address as SavedAddress;

        update((state) => {
          // If this is the new default, update other addresses
          let updatedAddresses = [...state.savedAddresses];

          if (newAddress.isDefault) {
            updatedAddresses = updatedAddresses.map((addr) => ({
              ...addr,
              isDefault: addr.id === newAddress.id,
            }));
          }

          // Add the new address if it's not already in the list
          if (!updatedAddresses.some((addr) => addr.id === newAddress.id)) {
            updatedAddresses.push(newAddress);
          }

          return {
            ...state,
            savedAddresses: updatedAddresses,
            isLoading: false,
          };
        });

        return newAddress;
      } catch (error) {
        console.error("Error saving address:", error);

        update((state) => ({
          ...state,
          isLoading: false,
          error: error instanceof Error ? error.message : "An error occurred",
        }));

        return null;
      }
    },

    /**
     * Get nearest service area information for a given address
     */
    getNearestServiceArea: (address: AddressInput) => {
      if (!address.lat || !address.lng) return null;

      return getClosestServiceArea(address.lat, address.lng);
    },

    /**
     * Clear any errors
     */
    clearError: () => {
      update((state) => ({
        ...state,
        error: null,
      }));
    },

    /**
     * Reset the store to initial state
     */
    reset: () => {
      set(initialState);
    },
  };
}

// Create and export the store
export const addressStore = createAddressStore();

// Derived store for checking if the service is available at the current address
export const isServiceAvailable = derived(addressStore, ($addressStore) => {
  if (
    !$addressStore.currentAddress ||
    !$addressStore.currentAddress.lat ||
    !$addressStore.currentAddress.lng
  ) {
    return false;
  }

  return isWithinServiceArea(
    $addressStore.currentAddress.lat,
    $addressStore.currentAddress.lng,
  );
});

// Derived store to check if user has reached address limit
export const hasReachedAddressLimit = derived(addressStore, ($addressStore) => {
  return $addressStore.savedAddresses.length >= MAX_ADDRESSES;
});

// Export service areas for reference
export { SERVICE_AREAS };
