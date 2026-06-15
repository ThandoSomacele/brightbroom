<!-- src/routes/admin/+layout.svelte -->
<script lang="ts" context="module">
  // Create stores for admin notifications that can be imported from anywhere
  import { writable } from "svelte/store";

  export const adminNotification = writable({
    visible: false,
    success: true,
    message: "",
  });

  // Helper functions to show notifications
  export function showSuccess(message: string) {
    adminNotification.set({
      visible: true,
      success: true,
      message,
    });
  }

  export function showError(message: string) {
    adminNotification.set({
      visible: true,
      success: false,
      message,
    });
  }
</script>

<script lang="ts">
  import { page } from "$app/stores";
  import UpdateStatusIndicator from "$lib/components/admin/UpdateStatusIndicator.svelte";
  import {
    Banknote,
    Landmark,
    Calendar,
    ChartNoAxesColumnIncreasing,
    FileText,
    Home,
    Menu,
    Settings,
    User,
    Users,
    X,
    BrushCleaning,
    Tag,
  } from "lucide-svelte";

  let showMobileMenu = false;

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: Home },
    { label: "Bookings", href: "/admin/bookings", icon: Calendar },
    { label: "Applications", href: "/admin/applications", icon: FileText },
    { label: "Cleaners", href: "/admin/cleaners", icon: BrushCleaning },
    { label: "Users", href: "/admin/users", icon: User },
    { label: "Pricing", href: "/admin/pricing", icon: Banknote },
    { label: "Coupons", href: "/admin/coupons", icon: Tag },
    { label: "Payouts", href: "/admin/payouts", icon: Landmark },
    { label: "Services", href: "/admin/services", icon: Settings },
    {
      label: "Reports",
      href: "/admin/reports",
      icon: ChartNoAxesColumnIncreasing,
    },
  ];

  function isActive(href: string) {
    return (
      $page.url.pathname === href || $page.url.pathname.startsWith(href + "/")
    );
  }
</script>

<UpdateStatusIndicator
  bind:visible={$adminNotification.visible}
  success={$adminNotification.success}
  message={$adminNotification.message}
/>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <!-- Mobile header -->
  <div
    class="md:hidden bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center"
  >
    <div class="flex items-center">
      <span class="font-bold text-primary text-xl">BrightBroom</span>
      <span class="ml-2 font-semibold text-gray-900 dark:text-white">Admin</span
      >
    </div>
    <button on:click={() => (showMobileMenu = !showMobileMenu)}>
      {#if showMobileMenu}
        <X size={24} />
      {:else}
        <Menu size={24} />
      {/if}
    </button>
  </div>

  <div class="flex">
    <!-- Sidebar navigation -->
    <aside
      class={`
      bg-white dark:bg-gray-800 shadow
      ${showMobileMenu ? "block" : "hidden"}
      md:block md:fixed md:inset-y-0 md:w-20 lg:w-64 overflow-y-auto overflow-x-hidden
    `}
    >
      <!-- Compact logo for tablet icon rail -->
      <div class="hidden md:flex lg:hidden p-4 justify-center">
        <span class="font-bold text-primary text-2xl">B</span>
      </div>
      <!-- Full logo for desktop -->
      <div class="p-4 hidden lg:flex items-center">
        <span class="font-bold text-primary text-xl">BrightBroom</span>
        <span class="ml-2 font-semibold text-gray-900 dark:text-white"
          >Admin</span
        >
      </div>

      <nav class="mt-4 px-2 space-y-1">
        {#each navItems as item}
          <a
            href={item.href}
            title={item.label}
            class={`
              flex items-center rounded-lg py-2 px-4 text-sm font-medium border-l-2 transition-colors duration-150
              md:justify-center md:px-2 lg:justify-start lg:px-4
              ${
                isActive(item.href)
                  ? "border-primary bg-primary-50 text-primary dark:bg-primary-900/20"
                  : "border-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              }
            `}
          >
            <svelte:component
              this={item.icon}
              class="h-5 w-5 flex-shrink-0 mr-3 md:mr-0 lg:mr-3"
            />
            <span class="md:hidden lg:inline">{item.label}</span>
          </a>
        {/each}
      </nav>
    </aside>

    <!-- Main content -->
    <main class="md:ml-20 lg:ml-64 flex-1">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <slot />
      </div>
    </main>
  </div>
</div>
