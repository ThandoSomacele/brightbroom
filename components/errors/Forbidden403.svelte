<!-- src/lib/components/errors/Forbidden403.svelte -->
<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
</script>

<svelte:head>
  <title>Access Denied | BrightBroom</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center dark:bg-gray-900">
  <div class="w-full max-w-md">
    <!-- Lock Icon -->
    <div class="mb-8 flex justify-center">
      <div class="flex h-32 w-32 items-center justify-center rounded-full bg-secondary-100 text-secondary dark:bg-secondary-900/20">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
    </div>
    
    <!-- Error Message -->
    <h1 class="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Access Denied</h1>
    <p class="mb-6 text-gray-600 dark:text-gray-300">
      You don't have permission to access this page.
    </p>
    
    <!-- Action Buttons -->
    <div class="space-y-4">
      <Button variant="primary" href="/" class="w-full">
        Return Home
      </Button>
      
      <Button variant="outline" href="/auth/login" class="w-full">
        Sign In
      </Button>
    </div>
    
    <!-- Error Code -->
    <p class="mt-8 text-sm text-gray-500 dark:text-gray-400">
      Error Code: 403
    </p>
  </div>
</div>
