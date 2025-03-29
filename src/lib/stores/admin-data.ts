import { writable } from 'svelte/store';
import { invalidate } from '$app/navigation';

// Create a store for admin data that will be updated optimistically
const adminStore = writable({
  // Cache for various admin data types
  data: new Map(),
  
  // Timestamps for when data was last fetched
  lastFetched: new Map()
});

// Function to get a value from the store
export function getAdminData(key: string) {
  let storeValue;
  
  adminStore.update(store => {
    storeValue = store.data.get(key);
    return store;
  });
  
  return storeValue;
}

// Function to set a value in the store (used for optimistic updates)
export function setAdminData(key: string, value: any) {
  adminStore.update(store => {
    store.data.set(key, value);
    store.lastFetched.set(key, Date.now());
    return store;
  });
}

// Function to invalidate and reload data for a specific resource
export async function invalidateAdminData(path: string) {
  // Invalidate the SvelteKit cache for this path
  await invalidate(`/admin/${path}`);
  
  // Remove from our local cache
  adminStore.update(store => {
    store.data.delete(path);
    store.lastFetched.delete(path);
    return store;
  });
}

// Export the store for subscribing
export { adminStore };