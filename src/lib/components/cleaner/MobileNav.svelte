<!-- src/lib/components/cleaner/MobileNav.svelte -->
<script lang="ts">
  import Icon from "$lib/components/ui/Icon.svelte";
  import { page } from '$app/stores';
    
  // Check if route is active
  function isActive(path: string): boolean {
    return $page.url.pathname === path || $page.url.pathname.startsWith(path + '/');
  }
</script>

<div class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around py-2 md:hidden z-10">
  <a 
    href="/cleaner/dashboard"
    class={`flex flex-col items-center py-2 px-3 ${isActive('/cleaner/dashboard') ? 'text-primary-700' : 'text-gray-500 dark:text-gray-400'}`}
  >
    <Icon name="house" size={24} />
    <span class="text-xs mt-1">Dashboard</span>
  </a>
  
  <a 
    href="/cleaner/bookings"
    class={`flex flex-col items-center py-2 px-3 ${isActive('/cleaner/bookings') ? 'text-primary-700' : 'text-gray-500 dark:text-gray-400'}`}
  >
    <Icon name="calendar-blank" size={24} />
    <span class="text-xs mt-1">Bookings</span>
  </a>
  
  <a 
    href="/cleaner/earnings"
    class={`flex flex-col items-center py-2 px-3 ${isActive('/cleaner/earnings') ? 'text-primary-700' : 'text-gray-500 dark:text-gray-400'}`}
  >
    <Icon name="money" size={24} />
    <span class="text-xs mt-1">Earnings</span>
  </a>
</div>

<!-- Add padding to prevent content from being hidden behind the nav bar on mobile -->
<div class="pb-16 md:pb-0"></div>
