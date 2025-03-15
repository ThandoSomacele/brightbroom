<!-- src/routes/profile/addresses/new/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Button from '$lib/components/ui/Button.svelte';
  
  // Get data from the server load function
  export let data;
  
  // Handle form submission feedback
  export let form;
  
  // Get redirect URL if coming from booking flow
  $: redirectTo = data.redirectTo || $page.url.searchParams.get('redirectTo') || '';
  
  // Form state
  let isLoading = false;
</script>

<svelte:head>
  <title>Add New Address | BrightBroom</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
  <div class="mx-auto max-w-3xl">
    <!-- Page header with back button -->
    <div class="mb-6 flex items-center">
      <Button variant="ghost" href="/profile/addresses" class="mr-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </Button>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Add New Address</h1>
    </div>
    
    <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <!-- Form feedback messages -->
      {#if form?.error}
        <div class="mb-6 rounded-md bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-200">
          <p>{form.error}</p>
        </div>
      {/if}
      
      <form 
        method="POST" 
        use:enhance={() => {
          isLoading = true;
          
          return async ({ result, update }) => {
            isLoading = false;
            
            if (result.type === 'redirect') {
              goto(result.location);
            } else {
              await update();
            }
          };
        }}
      >
        <!-- Street address -->
        <div class="mb-4">
          <label for="street" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Street Address <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="street"
            name="street"
            value={form?.street || ''}
            required
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="123 Main Street"
          />
        </div>
        
        <!-- Apt/Unit -->
        <div class="mb-4">
          <label for="aptUnit" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Apartment/Unit (optional)
          </label>
          <input
            type="text"
            id="aptUnit"
            name="aptUnit"
            value={form?.aptUnit || ''}
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Apt #, Suite #, etc."
          />
        </div>
        
        <!-- City, State, Zip in a grid -->
        <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label for="city" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              City <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={form?.city || ''}
              required
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Cape Town"
            />
          </div>
          
          <div>
            <label for="state" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Province <span class="text-red-500">*</span>
            </label>
            <select
              id="state"
              name="state"
              required
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="" disabled selected={!form?.state}>Select province</option>
              <option value="Eastern Cape" selected={form?.state === 'Eastern Cape'}>Eastern Cape</option>
              <option value="Free State" selected={form?.state === 'Free State'}>Free State</option>
              <option value="Gauteng" selected={form?.state === 'Gauteng'}>Gauteng</option>
              <option value="KwaZulu-Natal" selected={form?.state === 'KwaZulu-Natal'}>KwaZulu-Natal</option>
              <option value="Limpopo" selected={form?.state === 'Limpopo'}>Limpopo</option>
              <option value="Mpumalanga" selected={form?.state === 'Mpumalanga'}>Mpumalanga</option>
              <option value="Northern Cape" selected={form?.state === 'Northern Cape'}>Northern Cape</option>
              <option value="North West" selected={form?.state === 'North West'}>North West</option>
              <option value="Western Cape" selected={form?.state === 'Western Cape'}>Western Cape</option>
            </select>
          </div>
          
          <div>
            <label for="zipCode" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Postal Code <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={form?.zipCode || ''}
              required
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="8001"
            />
          </div>
        </div>
        
        <!-- Access instructions -->
        <div class="mb-6">
          <label for="instructions" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Access Instructions (optional)
          </label>
          <textarea
            id="instructions"
            name="instructions"
            value={form?.instructions || ''}
            rows={3}
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Gate code, key location, or special instructions for the cleaner..."
          ></textarea>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Provide any details that will help the cleaner access your property.
          </p>
        </div>
        
        <!-- Default address checkbox -->
        <div class="mb-6">
          <label class="flex items-center">
            <input
              type="checkbox"
              name="isDefault"
              class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={form?.isDefault || false}
            />
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Set as default address
            </span>
          </label>
        </div>
        
        <!-- Hidden redirect field if provided -->
        {#if redirectTo}
          <input type="hidden" name="redirectTo" value={redirectTo}>
        {/if}
        
        <!-- Action buttons -->
        <div class="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Button 
            type="button" 
            variant="outline"
            href={redirectTo || "/profile/addresses"}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            {#if isLoading}
              <svg class="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            {:else}
              Save Address
            {/if}
          </Button>
        </div>
      </form>
    </div>
  </div>
</div>
