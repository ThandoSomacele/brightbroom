<!-- src/lib/components/admin/CreateMissingProfileButton.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  
  // Props
  export let userId: string;
  export let onSuccess: () => void = () => {};
  export let onError: (error: string) => void = () => {};
  
  // Local state
  let isLoading = false;
  let hasProfile = false;
  let hasChecked = false;
  let statusMessage = "Checking...";

  // Check if user has a profile
  async function checkUserProfile() {
    isLoading = true;
    statusMessage = "Checking profile status...";
    
    try {
      const response = await fetch(`/api/admin/debug/user-profile?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to check user profile');
      }
      
      const data = await response.json();
      hasProfile = data.hasProfile;
      hasChecked = true;
      
      statusMessage = hasProfile 
        ? "Profile exists" 
        : "No profile found for this user";
    } catch (error) {
      console.error("Error checking profile:", error);
      statusMessage = "Error checking profile status";
      onError("Failed to check profile status");
    } finally {
      isLoading = false;
    }
  }
  
  // Create missing profile
  async function createMissingProfile() {
    if (hasProfile) return;
    
    isLoading = true;
    statusMessage = "Creating profile...";
    
    try {
      const response = await fetch('/api/admin/debug/create-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create profile');
      }
      
      const data = await response.json();
      
      if (data.success) {
        hasProfile = true;
        statusMessage = "Profile created successfully";
        onSuccess();
      } else {
        throw new Error(data.error || 'Unknown error creating profile');
      }
    } catch (error) {
      console.error("Error creating profile:", error);
      statusMessage = "Error creating profile";
      onError(error instanceof Error ? error.message : 'Failed to create profile');
    } finally {
      isLoading = false;
    }
  }
  
  // Initialize check on mount
  onMount(() => {
    checkUserProfile();
  });
</script>

<div class="profile-checker">
  {#if !hasChecked}
    <div class="flex items-center text-gray-500 dark:text-gray-400">
      <div class="animate-spin h-4 w-4 mr-2 border-2 border-primary border-t-transparent rounded-full"></div>
      <span>{statusMessage}</span>
    </div>
  {:else if hasProfile}
    <div class="text-green-600 dark:text-green-400 flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>
      <span>Cleaner profile exists</span>
    </div>
  {:else}
    <div class="space-y-2">
      <div class="text-amber-600 dark:text-amber-400 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span>Missing cleaner profile</span>
      </div>
      
      <Button 
        variant="primary" 
        size="sm" 
        on:click={createMissingProfile}
        disabled={isLoading}
      >
        {#if isLoading}
          <div class="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
          Creating...
        {:else}
          Create Missing Profile
        {/if}
      </Button>
    </div>
  {/if}
</div>
