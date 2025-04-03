<!-- src/routes/profile/addresses/[id]/edit/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import Button from "$lib/components/ui/Button.svelte";
  import { 
    MapPin, 
    Building, 
    Map, 
    Globe, 
    Hash, 
    Star
  } from "lucide-svelte";
  
  // Get data from the server
  export let data;
  const { address } = data;
  
  // Get form data for error handling
  export let form;
  
  // Local state
  let isLoading = false;
</script>

<svelte:head>
  <title>Edit Address | BrightBroom</title>
</svelte:head>

<div class="py-8 px-4 mx-auto max-w-2xl">
  <div class="mb-8">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
      Edit Address
    </h1>
    <p class="mt-2 text-gray-600 dark:text-gray-300">
      Update your address information
    </p>
  </div>
  
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    {#if form?.error}
      <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-200 rounded-md">
        <p>{form.error}</p>
      </div>
    {/if}
    
    <form
      method="POST"
      use:enhance={() => {
        isLoading = true;
        
        return async ({ result, update }) => {
          isLoading = false;
          await update();
        };
      }}
    >
      <!-- Street Address -->
      <div class="mb-4">
        <label 
          for="street" 
          class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Street Address <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400">
            <MapPin size={18} />
          </div>
          <input
            type="text"
            id="street"
            name="street"
            required
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            placeholder="123 Main Street"
            value={address.street}
          />
        </div>
      </div>
      
      <!-- Apartment/Unit -->
      <div class="mb-4">
        <label 
          for="aptUnit" 
          class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Apartment/Unit
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400">
            <Building size={18} />
          </div>
          <input
            type="text"
            id="aptUnit"
            name="aptUnit"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            placeholder="Apt 4B"
            value={address.aptUnit || ''}
          />
        </div>
      </div>
      
      <!-- City -->
      <div class="mb-4">
        <label 
          for="city" 
          class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          City <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400">
            <Map size={18} />
          </div>
          <input
            type="text"
            id="city"
            name="city"
            required
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            placeholder="Cape Town"
            value={address.city}
          />
        </div>
      </div>
      
      <!-- State/Province -->
      <div class="mb-4">
        <label 
          for="state" 
          class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          State/Province <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400">
            <Globe size={18} />
          </div>
          <input
            type="text"
            id="state"
            name="state"
            required
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            placeholder="Western Cape"
            value={address.state}
          />
        </div>
      </div>
      
      <!-- Zip/Postal Code -->
      <div class="mb-4">
        <label 
          for="zipCode" 
          class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Zip/Postal Code <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400">
            <Hash size={18} />
          </div>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            required
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            placeholder="8001"
            value={address.zipCode}
          />
        </div>
      </div>
      
      <!-- Access instructions -->
      <div class="mb-4">
        <label 
          for="instructions" 
          class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Access Instructions
        </label>
        <textarea
          id="instructions"
          name="instructions"
          rows={3}
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          placeholder="Gate code, key location, etc."
        >{address.instructions || ''}</textarea>
      </div>
      
      <!-- Default Address Checkbox -->
      <div class="flex items-center mb-6">
        <input
          id="isDefault"
          name="isDefault"
          type="checkbox"
          class="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
          checked={address.isDefault}
        />
        <label
          for="isDefault"
          class="flex items-center ml-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          <Star size={16} class="mr-1 text-yellow-400" />
          Set as default address
        </label>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex justify-between mt-8">
        <Button variant="outline" href="/profile/addresses">
          Cancel
        </Button>
        
        <Button type="submit" variant="primary" disabled={isLoading}>
          {#if isLoading}
            <svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
