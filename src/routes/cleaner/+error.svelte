<!-- src/routes/cleaner/+error.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import Button from '$lib/components/ui/Button.svelte';
  
  // Get error information from the page store
  $: status = $page.status;
  $: message = $page.error?.message || 'Something went wrong';
</script>

<div class="min-h-[50vh] flex flex-col items-center justify-center p-4 text-center">
  <div class="w-full max-w-md">
    <!-- Error Icon/Illustration -->
    <div class="mb-6 flex justify-center">
      <div class="flex h-24 w-24 items-center justify-center rounded-full bg-primary-100 text-primary dark:bg-primary-900/20">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
      </div>
    </div>
    
    <!-- Error Message -->
    <h1 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
      {status === 404 ? 'Page Not Found' : 'Error'}
    </h1>
    <p class="mb-6 text-gray-600 dark:text-gray-300">
      {status === 404
        ? "The page you're looking for doesn't exist or has been moved."
        : message}
    </p>
    
    <!-- Action Buttons -->
    <div class="space-y-4">
      <Button variant="primary" href="/cleaner/dashboard" class="w-full">
        Return to Dashboard
      </Button>
      
      {#if status !== 404}
        <Button 
          variant="outline" 
          on:click={() => window.location.reload()} 
          class="w-full"
        >
          Try Again
        </Button>
      {/if}
    </div>
  </div>
</div>
