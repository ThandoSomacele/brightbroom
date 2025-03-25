<!-- src/routes/+error.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import Button from '$lib/components/ui/Button.svelte';
  import Forbidden403 from '$lib/components/errors/Forbidden403.svelte';
  
  // Get error information from the page store
  $: status = $page.status;
  $: message = $page.error?.message || 'Something went wrong';
  
  // Determine error type
  $: is404 = status === 404;
  $: is403 = status === 403;
</script>

{#if is403}
  <Forbidden403 />
{:else}
  <div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center dark:bg-gray-900">
    <div class="w-full max-w-md">
      <!-- Error Icon/Illustration -->
      <div class="mb-8 flex justify-center">
        {#if is404}
          <div class="flex h-32 w-32 items-center justify-center rounded-full bg-primary-100 text-primary dark:bg-primary-900/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        {:else}
          <div class="flex h-32 w-32 items-center justify-center rounded-full bg-secondary-100 text-secondary dark:bg-secondary-900/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        {/if}
      </div>
      
      <!-- Error Message -->
      <h1 class="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
        {is404 ? 'Page Not Found' : 'Server Error'}
      </h1>
      <p class="mb-6 text-gray-600 dark:text-gray-300">
        {is404 
          ? 'The page you are looking for doesn\'t exist or has been moved.'
          : 'We\'re sorry, but something went wrong on our end.'}
      </p>
      
      {#if !is404}
        <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Error: {status} - {message}
        </p>
      {/if}
      
      <!-- Action Buttons -->
      <div class="space-y-4">
        <Button variant="primary" href="/" class="w-full">
          Return Home
        </Button>
        
        {#if is404}
          <Button variant="outline" href="/contact" class="w-full">
            Contact Support
          </Button>
        {:else}
          <Button variant="outline" href="/" on:click={() => window.location.reload()} class="w-full">
            Try Again
          </Button>
        {/if}
      </div>
      
      <!-- Error Code -->
      <p class="mt-8 text-sm text-gray-500 dark:text-gray-400">
        Error Code: {status}
      </p>
    </div>
  </div>
{/if}
