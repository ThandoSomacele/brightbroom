<!-- src/lib/components/admin/DbDebugger.svelte -->
<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte";
  import { onMount } from "svelte";
  import CreateMissingProfileButton from "./CreateMissingProfileButton.svelte";

  // Props
  export let userId: string;

  // Local state
  let isLoading = false;
  let userData: any = null;
  let hasProfile = false;
  let profileData: any = null;
  let error: string | null = null;
  let successMessage: string | null = null;

  // Fetch user data and profile
  async function fetchUserData() {
    isLoading = true;
    error = null;

    try {
      const response = await fetch(
        `/api/admin/debug/user-profile?userId=${userId}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const data = await response.json();
      userData = data.user;
      hasProfile = data.hasProfile;
      profileData = data.profile;
    } catch (err) {
      console.error("Error fetching user data:", err);
      error = err instanceof Error ? err.message : "Unknown error occurred";
    } finally {
      isLoading = false;
    }
  }

  // Handle profile creation success
  function handleProfileCreated() {
    successMessage = "Profile created successfully!";
    // Refresh data
    fetchUserData();

    // Clear success message after 5 seconds
    setTimeout(() => {
      successMessage = null;
    }, 5000);
  }

  // Handle profile creation error
  function handleProfileError(message: string) {
    error = `Failed to create profile: ${message}`;
  }

  // Initialise data
  onMount(() => {
    fetchUserData();
  });
</script>

<div class="space-y-4 mt-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
  <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">
    Database Diagnostics
  </h3>

  {#if isLoading}
    <div class="flex items-center text-gray-500 dark:text-gray-400">
      <div
        class="animate-spin h-4 w-4 mr-2 border-2 border-primary border-t-transparent rounded-full"
      ></div>
      <span>Loading user data...</span>
    </div>
  {:else if error}
    <div class="text-red-500 dark:text-red-400">
      <p>{error}</p>
      <Button variant="outline" size="sm" on:click={fetchUserData} class="mt-2">
        Retry
      </Button>
    </div>
  {:else if successMessage}
    <div
      class="text-green-600 dark:text-green-400 p-2 bg-green-50 dark:bg-green-900/20 rounded"
    >
      <p>{successMessage}</p>
    </div>
  {:else}
    <div class="space-y-3">
      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          User Role: <span class="font-medium text-gray-700 dark:text-gray-300"
            >{userData?.role || "Unknown"}</span
          >
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          User Status: <span
            class="font-medium text-gray-700 dark:text-gray-300"
            >{userData?.isActive ? "Active" : "Inactive"}</span
          >
        </p>
      </div>

      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400">Cleaner Profile:</p>
        <CreateMissingProfileButton
          {userId}
          onSuccess={handleProfileCreated}
          onError={handleProfileError}
        />
      </div>

      {#if hasProfile}
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Profile ID: <span class="font-mono text-xs">{profileData?.id}</span>
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Work Address: {profileData?.workAddress || "Not set"}
          </p>
        </div>
      {/if}

      <div>
        <Button variant="outline" size="sm" on:click={fetchUserData}>
          Refresh Data
        </Button>
      </div>
    </div>
  {/if}
</div>
