<!-- src/lib/components/admin/CleanerAssignmentDialog.svelte -->
<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte";
  
  // Props
  export let bookingId: string;
  export let onClose: () => void = () => {};
  export let onAssign: (cleanerId: string | null) => void = () => {};
  
  // State
  let isLoading = true;
  let error: string | null = null;
  let cleaners: Array<{
    id: string;
    firstName: string;
    lastName: string;
    rating: number | null;
    distance: number;
    availability: "AVAILABLE" | "LIMITED" | "UNAVAILABLE";
  }> = [];
  let selectedCleanerId: string | null = null;
  
  // Load cleaners on mount
  async function loadCleaners() {
    isLoading = true;
    error = null;
    
    try {
      const response = await fetch(`/api/bookings/${bookingId}/available-cleaners`);
      
      if (!response.ok) {
        throw new Error('Failed to load available cleaners');
      }
      
      const data = await response.json();
      cleaners = data.cleaners;
      
      // Default to "No Cleaner Assigned"
      selectedCleanerId = null;
    } catch (err) {
      console.error('Error loading cleaners:', err);
      error = err instanceof Error ? err.message : 'Failed to load cleaners';
    } finally {
      isLoading = false;
    }
  }
  
  // Format distance with proper handling of edge cases
  function formatDistance(distance: number): string {
    if (distance <= 0) {
      return "Distance unknown";
    }
    return `${distance}km away`;
  }
  
  // Assign selected cleaner
  async function assignCleaner() {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/assign-cleaner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cleanerId: selectedCleanerId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to assign cleaner');
      }
      
      onAssign(selectedCleanerId);
    } catch (err) {
      console.error('Error assigning cleaner:', err);
      error = err instanceof Error ? err.message : 'Failed to assign cleaner';
    }
  }
  
  // Load cleaners on component mount
  loadCleaners();
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
  <div class="w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-800">
    <div class="p-6">
      <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
        Assign Cleaner
      </h2>
      
      {#if error}
        <div class="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      {/if}
      
      <div class="mb-4">
        <div class="mb-2 flex items-center space-x-2 text-sm">
          <span class="flex items-center">
            <span class="mr-1 inline-block h-3 w-3 rounded-full bg-green-400"></span> Available
          </span>
          <span class="flex items-center">
            <span class="mr-1 inline-block h-3 w-3 rounded-full bg-yellow-400"></span> Limited
          </span>
          <span class="flex items-center">
            <span class="mr-1 inline-block h-3 w-3 rounded-full bg-red-400"></span> Unavailable
          </span>
        </div>
        
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Select a cleaner to assign to this booking, or select "No Cleaner Assigned" to clear the current assignment.
        </p>
      </div>
      
      {#if isLoading}
        <div class="flex h-40 items-center justify-center">
          <div class="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary"></div>
        </div>
      {:else}
        <div class="max-h-60 overflow-y-auto">
          <!-- No cleaner option -->
          <label class="block w-full mb-2">
            <div class="flex items-center p-3 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
              <input
                type="radio"
                name="selectedCleanerId" 
                bind:group={selectedCleanerId}
                value={null}
                class="mr-3"
              />
              <div class="font-medium text-gray-900 dark:text-white">
                No Cleaner Assigned
              </div>
            </div>
          </label>
          
          <!-- Cleaner options -->
          {#each cleaners as cleaner}
            <label class="block w-full mb-2">
              <div class="flex items-center p-3 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                <input
                  type="radio"
                  name="selectedCleanerId" 
                  value={cleaner.id}
                  bind:group={selectedCleanerId}
                  class="mr-3"
                  disabled={cleaner.availability === "UNAVAILABLE"}
                />
                <div class="flex-grow">
                  <div class="font-medium text-gray-900 dark:text-white">
                    {cleaner.firstName} {cleaner.lastName}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {#if cleaner.distance > 0}
                      • {cleaner.distance}km away
                    {:else}
                      • Distance unknown
                    {/if}
                  </div>
                </div>
                <div>
                  <span 
                    class={`px-2 py-1 text-xs rounded-full ${
                      cleaner.availability === "AVAILABLE" 
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" 
                        : cleaner.availability === "LIMITED"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }`}
                  >
                    {cleaner.availability === "AVAILABLE" 
                      ? "Available" 
                      : cleaner.availability === "LIMITED" 
                        ? "Limited" 
                        : "Unavailable"}
                  </span>
                </div>
              </div>
            </label>
          {/each}
          
          {#if cleaners.length === 0}
            <p class="text-center py-4 text-gray-500 dark:text-gray-400">
              No cleaners available.
            </p>
          {/if}
        </div>
      {/if}
      
      <div class="mt-6 flex justify-end space-x-3">
        <Button variant="outline" on:click={onClose}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          on:click={assignCleaner}
          disabled={isLoading}
        >
          Assign Cleaner
        </Button>
      </div>
    </div>
  </div>
</div>
