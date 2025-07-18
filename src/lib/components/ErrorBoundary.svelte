<!-- src/lib/components/ErrorBoundary.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { AlertTriangle, RefreshCw } from 'lucide-svelte';
  import Button from './ui/Button.svelte';
  
  export let fallback: boolean = true;
  export let showDetails: boolean = false;
  
  let hasError = false;
  let error: Error | null = null;
  let errorInfo: string | null = null;
  
  // Error boundary implementation
  onMount(() => {
    // Global error handler for uncaught errors
    const handleError = (event: ErrorEvent) => {
      hasError = true;
      error = new Error(event.message);
      errorInfo = `File: ${event.filename}\nLine: ${event.lineno}\nColumn: ${event.colno}`;
      console.error('Error caught by boundary:', event.error);
    };
    
    // Global handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      hasError = true;
      error = new Error(event.reason?.message || 'Unhandled promise rejection');
      errorInfo = event.reason?.stack || 'No stack trace available';
      console.error('Unhandled promise rejection caught by boundary:', event.reason);
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  });
  
  function retry() {
    hasError = false;
    error = null;
    errorInfo = null;
    window.location.reload();
  }
  
  function reportError() {
    // In a real application, you would send this to your error reporting service
    console.error('Error reported:', { error, errorInfo });
    
    // For now, just show an alert
    alert('Error has been reported. Thank you for helping us improve!');
  }
</script>

{#if hasError && fallback}
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
    <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div class="text-center mb-6">
        <AlertTriangle 
          class="mx-auto h-12 w-12 text-red-500 mb-4" 
          aria-hidden="true"
        />
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Something went wrong
        </h1>
        <p class="text-gray-600 dark:text-gray-300">
          We're sorry, but something unexpected happened. Please try refreshing the page.
        </p>
      </div>
      
      {#if showDetails && error}
        <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
          <details class="text-sm">
            <summary class="cursor-pointer text-gray-700 dark:text-gray-300 font-medium">
              Error Details
            </summary>
            <div class="mt-2 text-gray-600 dark:text-gray-400">
              <p class="font-mono text-xs break-all">{error.message}</p>
              {#if errorInfo}
                <pre class="mt-2 text-xs overflow-x-auto">{errorInfo}</pre>
              {/if}
            </div>
          </details>
        </div>
      {/if}
      
      <div class="flex flex-col sm:flex-row gap-3">
        <Button 
          variant="primary" 
          class="flex-1" 
          on:click={retry}
        >
          <RefreshCw class="w-4 h-4 mr-2" />
          Retry
        </Button>
        
        <Button 
          variant="outline" 
          class="flex-1" 
          on:click={reportError}
        >
          Report Issue
        </Button>
      </div>
      
      <div class="mt-4 text-center">
        <a 
          href="/"
          class="text-sm text-primary hover:text-primary-600 dark:text-primary-400"
        >
          Return to Home
        </a>
      </div>
    </div>
  </div>
{:else}
  <slot />
{/if}