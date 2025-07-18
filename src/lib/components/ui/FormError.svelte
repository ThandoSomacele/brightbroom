<!-- src/lib/components/ui/FormError.svelte -->
<script lang="ts">
  import { AlertCircle } from 'lucide-svelte';
  
  export let error: string | null = null;
  export let fieldId: string | null = null;
  export let id: string = fieldId ? `${fieldId}-error` : 'error-message';
</script>

{#if error}
  <div
    {id}
    class="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mt-1"
    role="alert"
    aria-live="polite"
  >
    <AlertCircle size={16} aria-hidden="true" />
    <span>{error}</span>
  </div>
{/if}