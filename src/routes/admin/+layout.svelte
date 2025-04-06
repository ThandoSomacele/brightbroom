<!-- src/routes/admin/+layout.svelte -->
<script lang="ts" context="module">
  // Create stores for admin notifications that can be imported from anywhere
  import { writable } from 'svelte/store';
  
  export const adminNotification = writable({
    visible: false,
    success: true,
    message: ""
  });
  
  // Helper functions to show notifications
  export function showSuccess(message: string) {
    adminNotification.set({
      visible: true,
      success: true,
      message
    });
  }
  
  export function showError(message: string) {
    adminNotification.set({
      visible: true,
      success: false,
      message
    });
  }
</script>

<script lang="ts">
  import { page } from '$app/stores';
  import {
      ChartNoAxesColumnIncreasing,
      Calendar,
      FileText,
      Home,
      Menu,
      Settings,
      User,
      Users,
      X
  } from 'lucide-svelte';
  import UpdateStatusIndicator from "$lib/components/admin/UpdateStatusIndicator.svelte";
  
  let showMobileMenu = false;
  
  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
    { label: 'Bookings', href: '/admin/bookings', icon: Calendar },
    { label: 'Applications', href: '/admin/applications', icon: FileText },
    { label: 'Cleaners', href: '/admin/cleaners', icon: Users },
    { label: 'Users', href: '/admin/users', icon: User },
    { label: 'Services', href: '/admin/services', icon: Settings },
    { label: 'Reports', href: '/admin/reports', icon: ChartNoAxesColumnIncreasing },
  ];
  
  function isActive(href: string) {
    return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
  }
</script>

<UpdateStatusIndicator 
  bind:visible={$adminNotification.visible}
  success={$adminNotification.success}
  message={$adminNotification.message}
/>

<div class="min-h-screen bg-gray-100 dark:bg-gray-900">
  <!-- Mobile header -->
  <div class="lg:hidden bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center">
    <div class="flex items-center">
      <span class="font-bold text-primary text-xl">BrightBroom</span>
      <span class="ml-2 font-semibold text-gray-900 dark:text-white">Admin</span>
    </div>
    <button on:click={() => showMobileMenu = !showMobileMenu}>
      {#if showMobileMenu}
        <X size={24} />
      {:else}
        <Menu size={24} />
      {/if}
    </button>
  </div>
  
  <div class="flex">
    <!-- Sidebar navigation -->
    <aside class={`
      bg-white dark:bg-gray-800 shadow
      ${showMobileMenu ? 'block' : 'hidden'} 
      lg:block lg:w-64 lg:fixed lg:inset-y-0 overflow-y-auto
    `}>
      <div class="p-4 hidden lg:flex items-center">
        <span class="font-bold text-primary text-xl">BrightBroom</span>
        <span class="ml-2 font-semibold text-gray-900 dark:text-white">Admin</span>
      </div>
      
      <nav class="mt-4 px-2 space-y-1">
        {#each navItems as item}
          <a 
            href={item.href}
            class={`
              flex items-center px-4 py-2 rounded-md text-sm font-medium
              ${isActive(item.href) 
                ? 'bg-primary text-white hover:text-white' 
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}
            `}
          >
            <svelte:component this={item.icon} class="mr-3 h-5 w-5" />
            {item.label}
          </a>
        {/each}
      </nav>
    </aside>
    
    <!-- Main content -->
    <main class="lg:ml-64 flex-1">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <slot />
      </div>
    </main>
  </div>
</div>
