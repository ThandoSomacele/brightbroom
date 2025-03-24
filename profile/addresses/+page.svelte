<!-- src/routes/profile/addresses/+page.svelte -->
<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import { MapPin, Plus, Check, Pencil, Trash } from 'lucide-svelte';
  
  // Get data from the server load function
  export let data;
  const { addresses } = data;
  
  // Handle form submission state
  export let form;
  
  // Track which address is being edited/deleted
  let addressToDelete: string | null = null;
  let showDeleteConfirmation = false;
  
  // Function to open delete confirmation
  function confirmDelete(id: string) {
    addressToDelete = id;
    showDeleteConfirmation = true;
  }
  
  // Function to cancel delete
  function cancelDelete() {
    addressToDelete = null;
    showDeleteConfirmation = false;
  }
</script>

<svelte:head>
  <title>My Addresses | BrightBroom</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
  <div class="mx-auto max-w-4xl">
    <!-- Page header with back button -->
    <div class="mb-6 flex items-center">
      <Button variant="ghost" href="/profile" class="mr-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </Button>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">My Addresses</h1>
    </div>
    
    <!-- Form feedback messages -->
    {#if form?.success}
      <div class="mb-6 rounded-md bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-200">
        <p>{form.success}</p>
      </div>
    {/if}
    
    {#if form?.error && !showDeleteConfirmation}
      <div class="mb-6 rounded-md bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-200">
        <p>{form.error}</p>
      </div>
    {/if}
    
    <!-- Delete confirmation modal -->
    {#if showDeleteConfirmation}
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
          <h2 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">Confirm Deletion</h2>
          <p class="mb-6 text-gray-600 dark:text-gray-300">
            Are you sure you want to delete this address? This action cannot be undone.
          </p>
          <div class="flex justify-end space-x-3">
            <Button variant="outline" on:click={cancelDelete}>
              Cancel
            </Button>
            <form method="POST" action="?/deleteAddress">
              <input type="hidden" name="id" value={addressToDelete}>
              <Button variant="primary" class="bg-red-600 hover:bg-red-700" type="submit">
                Delete
              </Button>
            </form>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Add new address button -->
    <div class="mb-6">
      <Button variant="primary" href="/profile/addresses/new">
        <Plus size={18} class="mr-2" />
        Add New Address
      </Button>
    </div>
    
    <!-- Addresses list -->
    <div class="space-y-4">
      {#if addresses.length > 0}
        {#each addresses as address}
          <div class="rounded-lg bg-white p-5 shadow-md transition-all hover:shadow-lg dark:bg-gray-800">
            <div class="flex items-start justify-between">
              <div class="flex">
                <div class="flex-shrink-0">
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary dark:bg-primary-900/20">
                    <MapPin size={20} />
                  </div>
                </div>
                
                <div class="ml-4">
                  <div class="flex items-center">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">{address.street}</h3>
                    {#if address.isDefault}
                      <span class="ml-2 inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary dark:bg-primary-900/20">
                        Default
                      </span>
                    {/if}
                  </div>
                  
                  {#if address.aptUnit}
                    <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      Unit {address.aptUnit}
                    </p>
                  {/if}
                  
                  <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {address.city}, {address.state} {address.zipCode}
                  </p>
                  
                  {#if address.instructions}
                    <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span class="font-medium">Instructions:</span> {address.instructions}
                    </p>
                  {/if}
                </div>
              </div>
              
              <div class="flex space-x-2">
                {#if !address.isDefault}
                  <form method="POST" action="?/setDefault">
                    <input type="hidden" name="id" value={address.id}>
                    <Button 
                      variant="ghost" 
                      type="submit"
                      title="Set as default"
                      size="sm"
                    >
                      <Check size={18} />
                    </Button>
                  </form>
                {/if}
                
                <Button 
                  variant="ghost" 
                  href={`/profile/addresses/${address.id}/edit`}
                  title="Edit address"
                  size="sm"
                >
                  <Pencil size={18} />
                </Button>
                
                <Button 
                  variant="ghost" 
                  title="Delete address"
                  size="sm"
                  on:click={() => confirmDelete(address.id)}
                >
                  <Trash size={18} />
                </Button>
              </div>
            </div>
          </div>
        {/each}
      {:else}
        <div class="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <div class="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            <MapPin size={24} class="text-gray-500 dark:text-gray-400" />
          </div>
          <h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-white">No addresses found</h3>
          <p class="mb-4 text-gray-600 dark:text-gray-400">
            You haven't added any addresses yet. Add an address to use for your cleaning bookings.
          </p>
          <Button 
            variant="primary" 
            href="/profile/addresses/new"
          >
            <Plus size={18} class="mr-2" />
            Add New Address
          </Button>
        </div>
      {/if}
    </div>
  </div>
</div>
