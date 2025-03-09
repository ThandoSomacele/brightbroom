<!-- src/routes/profile/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import Button from '$lib/components/ui/Button.svelte';
  
  export let data;
  
  $: user = data.user;
</script>

<svelte:head>
  <title>Profile | BrightBroom</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
  <div class="mx-auto max-w-4xl">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-300">Manage your account and preferences</p>
    </div>
    
    <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <div class="mb-6 flex items-center justify-between border-b border-gray-200 pb-6 dark:border-gray-700">
        <div>
          <h2 class="text-xl font-medium text-gray-900 dark:text-white">
            {user.firstName} {user.lastName}
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
        </div>
        
        <div>
          <Button variant="outline" href="/profile/edit">
            Edit Profile
          </Button>
        </div>
      </div>
      
      <div class="grid gap-6 md:grid-cols-2">
        <div>
          <h3 class="mb-3 text-lg font-medium text-gray-900 dark:text-white">Account Information</h3>
          
          <div class="space-y-3">
            <div>
              <span class="block text-sm font-medium text-gray-500 dark:text-gray-400">Email</span>
              <span class="block text-gray-900 dark:text-white">{user.email}</span>
            </div>
            
            <div>
              <span class="block text-sm font-medium text-gray-500 dark:text-gray-400">Phone</span>
              <span class="block text-gray-900 dark:text-white">
                {user.phone || 'Not provided'}
              </span>
            </div>
            
            <div>
              <span class="block text-sm font-medium text-gray-500 dark:text-gray-400">Account Type</span>
              <span class="block text-gray-900 dark:text-white">
                {user.role === 'CUSTOMER' ? 'Customer' : 
                 user.role === 'CLEANER' ? 'Cleaner' : 'Administrator'}
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 class="mb-3 text-lg font-medium text-gray-900 dark:text-white">Quick Actions</h3>
          
          <div class="space-y-3">
            <Button variant="primary" href="/book" class="w-full justify-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              Book a Cleaning
            </Button>
            
            <Button variant="secondary" href="/profile/bookings" class="w-full justify-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              My Bookings
            </Button>
            
            <Button variant="outline" href="/profile/addresses" class="w-full justify-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              Manage Addresses
            </Button>
          </div>
        </div>
      </div>
      
      <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <form action="/auth/logout" method="POST">
          <Button variant="ghost" type="submit" class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Sign out
          </Button>
        </form>
      </div>
    </div>
  </div>
</div>
