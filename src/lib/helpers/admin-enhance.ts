import type { SubmitFunction } from '@sveltejs/kit';

/**
 * Custom enhance function for admin forms that supports optimistic UI updates
 *
 * Pass the returned SubmitFunction to `use:enhance={...}` on the form.
 *
 * @param updateData Function that updates local data optimistically
 * @param onSuccess Optional callback for success state
 * @param onError Optional callback for error state
 * @returns A SubmitFunction to use with `use:enhance`
 */
export function enhanceWithOptimisticUpdate<T>(
  updateData: (result: any) => void,
  onSuccess?: () => void,
  onError?: (error: string) => void
): SubmitFunction {
  return () => {
    return async ({ result, update }) => {
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
      await update();
    };
  };
}
