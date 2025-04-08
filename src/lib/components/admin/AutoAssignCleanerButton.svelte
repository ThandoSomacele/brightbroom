<!-- src/lib/components/admin/AutoAssignCleanerButton.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { CheckCircle, Users } from 'lucide-svelte';
  
  // Props
  export let bookingId: string;
  export let disabled = false;
  export let variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  
  // State
  let isLoading = false;
  let success = false;
  let error: string | null = null;
  
  // Event dispatcher
  const dispatch = createEventDispatcher<{
    success: { cleanerId: string };
    error: { message: string };
  }>();
  
  // Auto-assign a cleaner based on availability
  async function autoAssignCleaner() {
    if (isLoading || disabled) return;
    
    isLoading = true;
    error = null;
    success = false;
    
    try {
      const response = await fetch(`/api/bookings/${bookingId}/assign-cleaner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to assign cleaner');
      }
      
      success = true;
      
      // Dispatch success event
      dispatch('success', { cleanerId: data.cleanerId });
      
      // Reset success state after 3 seconds for UI feedback
      setTimeout(() => {
        success = false;
      }, 3000);
    } catch (err) {
      console.error('Error auto-assigning cleaner:', err);
      error = err instanceof Error ? err.message : 'Unknown error occurred';
      
      // Dispatch error event
      dispatch('error', { message: error });
    } finally {
      isLoading = false;
    }
  }
</script>

<div>
  <Button 
    {variant}
    {size}
    on:click={autoAssignCleaner}
    disabled={disabled || isLoading}
    title="Auto-assign the best available cleaner based on location and availability"
  >
    {#if isLoading}
      <svg class="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Assigning...
    {:else if success}
      <CheckCircle size={16} class="mr-2 text-green-500" />
      Assigned!
    {:else}
      <Users size={16} class="mr-2" />
      Auto-Assign
    {/if}
  </Button>
  
  {#if error}
    <p class="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
  {/if}
</div>
