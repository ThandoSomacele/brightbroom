import { enhance as svelteEnhance } from '$app/forms';
import type { SubmitFunction } from '@sveltejs/kit';

/**
 * Custom enhance function for admin forms that supports optimistic UI updates
 * 
 * @param updateData Function that updates local data optimistically
 * @param onSuccess Optional callback for success state
 * @param onError Optional callback for error state
 * @returns An enhance function to use with forms
 */
export function enhanceWithOptimisticUpdate<T>(
  updateData: (result: any) => void,
  onSuccess?: () => void,
  onError?: (error: string) => void
): SubmitFunction {
  return (options) => {
    return svelteEnhance(options)(({ form, data, action, cancel, result }) => {
      // Optimistically update the UI data if successful
      if (result.type === 'success') {
        // Apply data updates
        updateData(result);
        
        // Call success callback if provided
        if (onSuccess) onSuccess();
      } else if (result.type === 'failure' && onError) {
        // Call error callback if provided
        onError(result.data?.error || 'An unknown error occurred');
      }
      
      // Always update the form to show any validation errors
      return ({ update }) => {
        update();
      };
    });
  };
}