<!-- src/routes/cleaner/+layout.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import Button from '$lib/components/ui/Button.svelte';
  import LoadingIndicator from "$lib/components/ui/LoadingIndicator.svelte";
  import MobileNav from '$lib/components/cleaner/MobileNav.svelte';
  import {
    Calendar,
    DollarSign,
    Home,
    LogOut,
    Menu,
    User,
    X
  } from 'lucide-svelte';
  
  // Get user data from the layout load function
  $: user = $page.data.user;
  
  // Mobile menu state
  let isMenuOpen = false;
  
  // Navigation items with icons
  const navItems = [
    { 
      label: 'Dashboard', 
      href: '/cleaner/dashboard', 
      icon: Home 
    },
    { 
      label: 'My Bookings', 
      href: '/cleaner/bookings', 
      icon: Calendar 
    },
    { 
      label: 'Earnings', 
      href: '/cleaner/earnings', 
      icon: DollarSign 
    }
  ];
  
  // Active route helper
  function isActive(href: string): boolean {
    return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
  }
</script>

<!-- Global loading indicator for page navigation -->
<LoadingIndicator />

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
  <!-- Header bar -->
  <header class="bg-white shadow dark:bg-gray-800 sticky top-0 z-10">
    <div class="mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <!-- Logo -->
        <div class="flex flex-shrink-0 items-center">
          <span class="text-xl font-bold text-primary">BrightBroom</span>
          <span class="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">Cleaner Portal</span>
        </div>
        
        <!-- Desktop navigation -->
        <nav class="hidden md:flex space-x-4">
          {#each navItems as item}
            <a 
              href={item.href}
              class={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActive(item.href)
                  ? 'bg-primary-50 text-primary dark:bg-primary-900/20 dark:text-primary-300'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <svelte:component this={item.icon} class="h-5 w-5 mr-1.5" />
              {item.label}
            </a>
          {/each}
        </nav>
        
        <!-- User menu (desktop) -->
        <div class="hidden md:flex md:items-center">
          <div class="mr-4 text-sm">
            <span class="font-medium text-gray-900 dark:text-white">
              {user.firstName} {user.lastName}
            </span>
          </div>
          
          <form action="/auth/logout" method="POST">
            <Button variant="outline" type="submit" class="flex items-center">
              <LogOut size={16} class="mr-1" />
              Sign out
            </Button>
          </form>
        </div>
        
        <!-- Mobile menu button -->
        <div class="flex md:hidden">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            aria-expanded={isMenuOpen}
            on:click={() => isMenuOpen = !isMenuOpen}
          >
            <span class="sr-only">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
            {#if isMenuOpen}
              <X size={24} />
            {:else}
              <Menu size={24} />
            {/if}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Mobile menu -->
    {#if isMenuOpen}
      <div class="md:hidden shadow-lg">
        <div class="space-y-1 px-2 pb-3 pt-2">
          {#each navItems as item}
            <a
              href={item.href}
              class={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                isActive(item.href)
                  ? 'bg-primary-50 text-primary dark:bg-primary-900/20 dark:text-primary-300'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-primary dark:text-gray-200 dark:hover:bg-gray-700'
              }`}
              on:click={() => isMenuOpen = false}
            >
              <svelte:component this={item.icon} class="h-5 w-5 mr-1.5" />
              {item.label}
            </a>
          {/each}
        </div>
        
        <div class="border-t border-gray-200 dark:border-gray-700 pb-3 pt-4">
          <div class="flex items-center px-5">
            <div class="flex-shrink-0">
              <div class="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
                {user.firstName[0]}{user.lastName[0]}
              </div>
            </div>
            <div class="ml-3">
              <div class="text-base font-medium text-gray-800 dark:text-white">
                {user.firstName} {user.lastName}
              </div>
              <div class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {user.email}
              </div>
            </div>
          </div>
          <div class="mt-3 space-y-1 px-2">
            <form 
              action="/auth/logout" 
              method="POST"
              class="w-full"
              on:submit={() => isMenuOpen = false}
            >
              <button
                type="submit"
                class="flex w-full items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <LogOut size={16} class="mr-1.5" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    {/if}
  </header>
  
  <!-- Main content -->
  <main class="flex-1">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <slot />
    </div>
  </main>
  
  <!-- Footer -->
  <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <p class="text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} BrightBroom. All rights reserved.
      </p>
    </div>
  </footer>

  <!-- Mobile Navigation -->
  <MobileNav />
</div>
