<!-- src/lib/components/Header.svelte -->
<script lang="ts">
  import { page } from "$app/stores";
  import Button from "$lib/components/ui/Button.svelte";
  import { Menu, X } from "lucide-svelte";

  export let user: any = null;

  let isMenuOpen = false;

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function closeMenu() {
    isMenuOpen = false;
  }

  // Close menu when route changes
  $: if ($page.url.pathname) {
    isMenuOpen = false;
  }
</script>

<header class="bg-white shadow dark:bg-gray-800">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="flex h-16 items-center justify-between">
      <!-- Logo and site name -->
      <div class="flex flex-shrink-0 items-center">
        <a href="/" class="flex items-center">
          <span class="text-2xl font-bold text-primary">BrightBroom</span>
        </a>
      </div>

      <!-- Desktop navigation links -->
      <nav class="hidden space-x-4 md:flex">
        <a
          href="/"
          class="px-3 py-2 text-gray-700 hover:text-primary dark:text-gray-200 {$page
            .url.pathname === '/'
            ? 'text-primary font-medium'
            : ''}">Home</a
        >
        <a
          href="/services"
          class="px-3 py-2 text-gray-700 hover:text-primary dark:text-gray-200 {$page
            .url.pathname === '/services'
            ? 'text-primary font-medium'
            : ''}">Services</a
        >
        <a
          href="/about"
          class="px-3 py-2 text-gray-700 hover:text-primary dark:text-gray-200 {$page
            .url.pathname === '/about'
            ? 'text-primary font-medium'
            : ''}">About</a
        >
        <a
          href="/magazine"
          class="px-3 py-2 text-gray-700 hover:text-primary dark:text-gray-200 {$page
            .url.pathname === '/magazine'
            ? 'text-primary font-medium'
            : ''}">Magazine</a
        >
        <a
          href="/contact"
          class="px-3 py-2 text-gray-700 hover:text-primary dark:text-gray-200 {$page
            .url.pathname === '/contact'
            ? 'text-primary font-medium'
            : ''}">Contact</a
        >
        {#if user && user.role === "ADMIN"}
          <a
            href="/admin/dashboard"
            class="px-3 py-2 font-medium text-primary hover:text-primary-600 dark:text-primary-400"
            >Admin</a
          >
        {/if}
      </nav>

      <!-- Auth buttons or user menu -->
      <div class="hidden md:flex md:items-center space-x-3">
        {#if user}
          <Button variant="outline" href="/profile">
            <span>{user.firstName} {user.lastName}</span>
          </Button>

          {#if user.role === "ADMIN"}
            <Button variant="ghost" href="/admin/dashboard">
              Admin Dashboard
            </Button>
          {/if}

          <form action="/auth/logout" method="POST">
            <Button variant="ghost" type="submit">Sign out</Button>
          </form>
        {:else}
          <Button variant="outline" href="/auth/login">Sign in</Button>
          <Button variant="primary" href="/book">Book Cleaning</Button>
        {/if}
      </div>

      <!-- Mobile menu button -->
      <div class="flex md:hidden">
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          aria-expanded={isMenuOpen}
          on:click={toggleMenu}
        >
          <span class="sr-only">
            {isMenuOpen ? "Close main menu" : "Open main menu"}
          </span>
          {#if isMenuOpen}
            <X class="h-6 w-6" />
          {:else}
            <Menu class="h-6 w-6" />
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile menu -->
  {#if isMenuOpen}
    <div class="md:hidden">
      <div class="space-y-1 bg-white px-2 pb-3 pt-2 shadow-lg dark:bg-gray-800">
        <a
          href="/"
          class="block rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700"
          on:click={closeMenu}>Home</a
        >
        <a
          href="/services"
          class="block rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700"
          on:click={closeMenu}>Services</a
        >
        <a
          href="/about"
          class="block rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700"
          on:click={closeMenu}>About</a
        >
        <a
          href="/magazine"
          class="block rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700"
          on:click={closeMenu}>Magazine</a
        >
        <a
          href="/contact"
          class="block rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700"
          on:click={closeMenu}>Contact</a
        >

        {#if user && user.role === "ADMIN"}
          <a
            href="/admin/dashboard"
            class="block rounded-md px-3 py-2 font-medium text-primary hover:bg-gray-100 dark:hover:bg-gray-700"
            on:click={closeMenu}>Admin Dashboard</a
          >
        {/if}

        <div class="border-t border-gray-200 pt-4 dark:border-gray-700">
          {#if user}
            <div class="flex items-center px-3 py-2">
              <span class="text-gray-900 dark:text-white">
                {user.firstName}
                {user.lastName}
              </span>
            </div>
            <a
              href="/profile"
              class="block rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700"
              on:click={closeMenu}>Your Profile</a
            >
            <form action="/auth/logout" method="POST" class="px-3 py-2">
              <button
                type="submit"
                class="w-full text-left text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white"
                on:click={closeMenu}
              >
                Sign out
              </button>
            </form>
          {:else}
            <a
              href="/auth/login"
              class="block rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700"
              on:click={closeMenu}>Sign in</a
            >
            <a
              href="/book"
              class="block rounded-md px-3 py-2 text-primary font-medium hover:bg-primary-50 dark:hover:bg-gray-700"
              on:click={closeMenu}>Book Cleaning</a
            >
          {/if}
        </div>
      </div>
    </div>
  {/if}
</header>
