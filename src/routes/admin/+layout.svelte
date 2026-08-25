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
    Building2,
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
    ShieldCheck,
    Tag,
  } from "lucide-svelte";

  export let data;

  let showMobileMenu = false;

  const isPlatformAdmin = data.isPlatformAdmin;
  const tenantName = data.tenant?.name ?? "BrightBroom";

  // A company can use the dashboard while pending, so it needs a standing
  // reminder of why it is not receiving work yet.
  $: verificationStatus = data.tenant?.verificationStatus;
  $: needsVerification =
    !isPlatformAdmin && !!verificationStatus && verificationStatus !== "APPROVED";
  $: verificationHeadline =
    verificationStatus === "SUBMITTED"
      ? "Your documents are with us for review"
      : verificationStatus === "REJECTED"
        ? "Your verification needs attention"
        : "Verification not finished";
  $: verificationDetail =
    verificationStatus === "SUBMITTED"
      ? "You can keep setting up. Bookings start once we have approved your company."
      : verificationStatus === "REJECTED"
        ? "Something was not right with your documents. Tap to see what to replace."
        : "Upload your company documents so you can start taking bookings.";

  // All nav items with optional platformOnly flag
  const allNavItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: Home },
    { label: "Bookings", href: "/admin/bookings", icon: Calendar },
    { label: "Applications", href: "/admin/applications", icon: FileText },
    { label: "Cleaners", href: "/admin/cleaners", icon: BrushCleaning },
    { label: "Users", href: "/admin/users", icon: User, platformOnly: true },
    { label: "Tenants", href: "/admin/tenants", icon: Building2, platformOnly: true },
    { label: "Pricing", href: "/admin/pricing", icon: Banknote, platformOnly: true },
    { label: "Coupons", href: "/admin/coupons", icon: Tag },
    { label: "Payouts", href: "/admin/payouts", icon: Landmark },
    { label: "Services", href: "/admin/services", icon: Settings, platformOnly: true },
    { label: "Verification", href: "/admin/verification", icon: ShieldCheck, tenantOnly: true },
    {
      label: "Reports",
      href: "/admin/reports",
      icon: ChartNoAxesColumnIncreasing,
    },
  ];

  // Filter nav items based on user role
  $: navItems = isPlatformAdmin
    ? allNavItems.filter((item) => !item.tenantOnly)
    : allNavItems.filter((item) => !item.platformOnly);

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
      <span class="font-bold text-primary text-xl">{tenantName}</span>
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
        <span class="font-bold text-primary text-xl">{tenantName}</span>
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
        {#if needsVerification}
          <!-- Persistent until the company is approved. It can set itself up
               while pending, so this is the only thing telling it why bookings
               are not arriving. -->
          <a
            href="/admin/verification"
            class="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:hover:bg-amber-900/30"
          >
            <ShieldCheck class="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p class="text-sm font-medium text-amber-800 dark:text-amber-400">
                {verificationHeadline}
              </p>
              <p class="text-sm text-amber-700 dark:text-amber-500">
                {verificationDetail}
              </p>
            </div>
          </a>
        {/if}
        <slot />
      </div>
    </main>
  </div>
</div>
