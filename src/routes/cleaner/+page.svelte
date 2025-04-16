<!-- src/routes/cleaner/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  // Redirect to dashboard
  onMount(() => {
    goto('/cleaner/dashboard');
  });
</script>

<div class="min-h-[50vh] flex items-center justify-center">
  <p class="text-gray-600 dark:text-gray-300">Redirecting to dashboard...</p>
</div>
