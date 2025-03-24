<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { page } from "$app/stores";
  import Button from "$lib/components/ui/Button.svelte";
  import "../app.css";

  // Access user data from the page store
  $: user = $page.data.user;

  let isMenuOpen = false;

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }
</script>

<!-- Header with navigation -->
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
          class="px-3 py-2 text-gray-700 hover:text-primary dark:text-gray-200"
          >Home</a
        >
        <a
          href="/services"
          class="px-3 py-2 text-gray-700 hover:text-primary dark:text-gray-200"
          >Services</a
        >
        <a
          href="/about"
          class="px-3 py-2 text-gray-700 hover:text-primary dark:text-gray-200"
          >About</a
        >
        <a
          href="/contact"
          class="px-3 py-2 text-gray-700 hover:text-primary dark:text-gray-200"
          >Contact</a
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
      <div class="hidden md:flex md:items-center">
        {#if user}
          <div class="relative ml-3">
            <Button variant="outline" href="/profile">
              <span>{user.firstName} {user.lastName}</span>
            </Button>
          </div>
          {#if user.role === "ADMIN"}
            <a
              href="/admin/dashboard"
              class="block px-3 py-2 text-primary font-medium hover:bg-gray-50 hover:text-primary-600 dark:text-primary-400 dark:hover:bg-gray-700"
            >
              Admin Dashboard
            </a>
          {/if}
          <div class="ml-2">
            <form action="/auth/logout" method="POST">
              <Button variant="ghost" type="submit">Sign out</Button>
            </form>
          </div>
        {:else}
          <Button variant="outline" href="/auth/login">Sign in</Button>
          <Button variant="primary" href="/auth/register" class="ml-2"
            >Sign up</Button
          >
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
          <span class="sr-only"
            >{isMenuOpen ? "Close main menu" : "Open main menu"}</span
          >
          {#if isMenuOpen}
            <!-- Close icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          {:else}
            <!-- Menu icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile menu -->
  {#if isMenuOpen}
    <div class="md:hidden">
      <div class="space-y-1 px-2 pb-3 pt-2">
        <a
          href="/"
          class="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary dark:text-gray-200 dark:hover:bg-gray-700"
          >Home</a
        >
        <a
          href="/services"
          class="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary dark:text-gray-200 dark:hover:bg-gray-700"
          >Services</a
        >
        <a
          href="/about"
          class="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary dark:text-gray-200 dark:hover:bg-gray-700"
          >About</a
        >
        <a
          href="/contact"
          class="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary dark:text-gray-200 dark:hover:bg-gray-700"
          >Contact</a
        >
      </div>

      <div class="border-t border-gray-200 pb-3 pt-4 dark:border-gray-700">
        {#if user}
          <div class="flex items-center px-5">
            <div>
              <div class="text-base font-medium text-gray-800 dark:text-white">
                {user.firstName}
                {user.lastName}
              </div>
              <div class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {user.email}
              </div>
            </div>
          </div>
          <div class="mt-3 space-y-1 px-2">
            <a
              href="/profile"
              class="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary dark:text-gray-200 dark:hover:bg-gray-700"
              >Your Profile</a
            >
            {#if user.role === "ADMIN"}
              <a
                href="/admin"
                class="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary dark:text-gray-200 dark:hover:bg-gray-700"
                >Admin Dashboard</a
              >
            {/if}
            <form action="/auth/logout" method="POST">
              <button
                type="submit"
                class="block w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 hover:text-primary dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Sign out
              </button>
            </form>
          </div>
        {:else}
          <div class="mt-3 space-y-1 px-2">
            <a
              href="/auth/login"
              class="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary dark:text-gray-200 dark:hover:bg-gray-700"
              >Sign in</a
            >
            <a
              href="/auth/register"
              class="block px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary dark:text-gray-200 dark:hover:bg-gray-700"
              >Sign up</a
            >
          </div>
        {/if}
      </div>
    </div>
  {/if}
</header>

<!-- Page content -->
<main>
  <slot />
</main>

<!-- Footer -->
<footer class="bg-gray-50 py-8 dark:bg-gray-900">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="md:flex md:items-center md:justify-between">
      <div class="mb-6 md:mb-0">
        <span class="text-xl font-bold text-primary">BrightBroom</span>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          On-demand cleaning services
        </p>
      </div>

      <div class="flex space-x-6">
        <a
          href="/terms"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >Terms</a
        >
        <a
          href="/privacy"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >Privacy</a
        >
        <a
          href="/contact"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >Contact</a
        >
      </div>
    </div>

    <div class="mt-8 border-t border-gray-200 pt-8 dark:border-gray-700">
      <p class="text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} BrightBroom. All rights reserved.
      </p>
    </div>
  </div>
</footer>
