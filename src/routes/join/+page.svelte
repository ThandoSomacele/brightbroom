<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  // Redirect to cleaner application page
  onMount(() => {
    goto('/join/cleaner');
  });
</script>

<div class="min-h-screen flex items-center justify-center">
  <p class="text-gray-600 dark:text-gray-300">Redirecting to cleaner application...</p>
</div>