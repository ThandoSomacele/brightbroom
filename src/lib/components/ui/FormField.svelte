<!-- src/lib/components/ui/FormField.svelte -->
<script lang="ts">
  import FormError from './FormError.svelte';
  
  export let label: string;
  export let id: string;
  export let type: string = 'text';
  export let value: string = '';
  export let error: string | null = null;
  export let required: boolean = false;
  export let disabled: boolean = false;
  export let placeholder: string = '';
  export let autocomplete: string = '';
  
  // Generate IDs for accessibility
  $: errorId = error ? `${id}-error` : undefined;
  $: describedBy = error ? errorId : undefined;
  
  // Input classes with error state
  $: inputClasses = `
    w-full px-3 py-2 border rounded-md shadow-sm 
    focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    dark:bg-gray-700 dark:border-gray-600 dark:text-white
    dark:focus:ring-primary-500 dark:focus:border-primary-500
    ${error 
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
      : 'border-gray-300 dark:border-gray-600'
    }
  `.trim();
</script>

<div class="space-y-1">
  <label 
    for={id}
    class="block text-sm font-medium text-gray-700 dark:text-gray-300"
  >
    {label}
    {#if required}
      <span class="text-red-500 ml-1" aria-label="required">*</span>
    {/if}
  </label>
  
  <input
    {id}
    {type}
    {placeholder}
    {required}
    {disabled}
    {autocomplete}
    class={inputClasses}
    bind:value
    aria-invalid={error ? 'true' : 'false'}
    aria-describedby={describedBy}
    on:input
    on:blur
    on:focus
    on:change
    {...$$restProps}
  />
  
  <FormError {error} fieldId={id} />
</div>