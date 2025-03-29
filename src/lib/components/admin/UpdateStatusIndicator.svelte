<script lang="ts">
  import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';

  // Props
  export let visible = false;
  export let success = false;
  export let message = '';
  export let autoHide = true;
  export let duration = 2000;

  // State
  let timer: ReturnType<typeof setTimeout>;

  onMount(() => {
    return () => {
      if (timer) clearTimeout(timer);
    };
  });

  // Set up auto-hide behavior if configured
  $: if (visible && autoHide) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      visible = false;
    }, duration);
  }
</script>

{#if visible}
  <div 
    transition:fade={{ duration: 200 }}
    class={`fixed top-4 right-4 px-4 py-3 rounded-md shadow-md z-50 ${
      success 
        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    }`}
  >
    <div class="flex items-center">
      {#if success}
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
      {:else}
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
      {/if}
      
      <span>{message}</span>
    </div>
  </div>
{/if}