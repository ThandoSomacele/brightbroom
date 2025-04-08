<!-- src/lib/components/admin/DbDebugger.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  
  export let userId: string;
  
  let isLoading = false;
  let results: any = null;
  let error: string | null = null;
  
  async function checkUserProfile() {
    isLoading = true;
    error = null;
    results = null;
    
    try {
      const response = await fetch(`/api/admin/debug/user-profile?userId=${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to check user profile');
      }
      
      results = await response.json();
    } catch (err) {
      console.error('Error checking user profile:', err);
      error = err instanceof Error ? err.message : 'Unknown error occurred';
    } finally {
      isLoading = false;
    }
  }
  
  async function createMissingProfile() {
    isLoading = true;
    error = null;
    
    try {
      const response = await fetch(`/api/admin/debug/create-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create profile');
      }
      
      const data = await response.json();
      results = {
        ...results,
        profileCreated: true,
        newProfile: data.profile
      };
    } catch (err) {
      console.error('Error creating profile:', err);
      error = err instanceof Error ? err.message : 'Unknown error occurred';
    } finally {
      isLoading = false;
    }
  }
  
  // Automatically check on mount
  onMount(() => {
    checkUserProfile();
  });
</script>

<div class="bg-gray-50 p-4 rounded-md border border-gray-200 dark:bg-gray-800 dark:border-gray-700 mt-4">
  <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Database Diagnostic Tool</h3>
  
  {#if isLoading}
    <div class="animate-pulse p-4 text-center">
      <p class="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
    </div>
  {:else if error}
    <div class="bg-red-50 p-3 rounded-md dark:bg-red-900/20 mb-3">
      <p class="text-sm text-red-700 dark:text-red-300">{error}</p>
    </div>
    <Button variant="outline" size="sm" on:click={checkUserProfile} class="w-full mb-2">
      Retry Check
    </Button>
  {:else if results}
    <div class="space-y-3">
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div class="text-gray-500 dark:text-gray-400">User ID:</div>
        <div class="text-gray-900 dark:text-white">{results.user?.id || 'Not found'}</div>
        
        <div class="text-gray-500 dark:text-gray-400">User Role:</div>
        <div class="text-gray-900 dark:text-white">{results.user?.role || 'N/A'}</div>
        
        <div class="text-gray-500 dark:text-gray-400">Profile Exists:</div>
        <div class="text-gray-900 dark:text-white">
          {#if results.hasProfile}
            <span class="text-green-600 dark:text-green-400">Yes</span>
          {:else}
            <span class="text-red-600 dark:text-red-400">No</span>
          {/if}
        </div>
        
        {#if results.profile}
          <div class="text-gray-500 dark:text-gray-400">Profile ID:</div>
          <div class="text-gray-900 dark:text-white">{results.profile.id}</div>
        {/if}
      </div>
      
      {#if !results.hasProfile && !results.profileCreated}
        <Button variant="primary" size="sm" on:click={createMissingProfile} class="w-full mt-3">
          Create Missing Profile
        </Button>
      {:else if results.profileCreated}
        <div class="bg-green-50 p-3 rounded-md dark:bg-green-900/20 mt-3">
          <p class="text-sm text-green-700 dark:text-green-300">Profile created successfully!</p>
        </div>
      {/if}
      
      <Button variant="outline" size="sm" on:click={checkUserProfile} class="w-full mt-3">
        Refresh Data
      </Button>
    </div>
  {:else}
    <Button variant="outline" size="sm" on:click={checkUserProfile} class="w-full">
      Check Profile
    </Button>
  {/if}
</div>
