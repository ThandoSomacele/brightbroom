import { navigating } from '$app/stores';
import { derived } from 'svelte/store';

// Create a derived store for tracking loading state that includes
// a small delay before turning off to ensure smooth transitions
export const isNavigating = derived(
  navigating,
  ($navigating, set) => {
    if ($navigating) {
      // Immediately set to true when navigation starts
      set(true);
    } else {
      // Add a slight delay before setting to false
      // This ensures the loading indicator doesn't flicker
      // for very fast navigation events
      setTimeout(() => {
        set(false);
      }, 200);
    }
  },
  false
);