<script lang="ts">
  import { isNavigating } from '$lib/stores/navigation';

  // Option to override the default state - for manual control
  export let loading = false;
  
  // Combine store value with props
  $: showLoading = $isNavigating || loading;
</script>

{#if showLoading}
  <div class="fixed inset-x-0 top-0 z-50">
    <!-- Progress bar animation -->
    <div class="h-1 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
      <div 
        class="h-full animate-loading-progress bg-primary" 
        style="width: 100%;"
      ></div>
    </div>
  </div>
{/if}

<style>
  /* Custom animation for indeterminate progress */
  @keyframes loading-progress {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .animate-loading-progress {
    animation: loading-progress 1.5s ease-in-out infinite;
  }
</style>