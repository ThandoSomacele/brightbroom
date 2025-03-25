<!-- src/routes/auth/login/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  // Get error from form action
  export let form;

  // Get redirect URL from query params if it exists
  $: redirectTo = $page.url.searchParams.get("redirectTo") || "/profile";

  let isLoading = false;
  let showPassword = false;
  let email = form?.email || "";
  let password = "";

  // State to track full authentication process
  let isAuthenticating = false;

  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }
</script>

<svelte:head>
  <title>Login | BrightBroom</title>
</svelte:head>

{#if isAuthenticating}
  <!-- Full-page loading overlay -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80 dark:bg-gray-900 dark:bg-opacity-80"
  >
    <div class="flex flex-col items-center space-y-4">
      <div
        class="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"
      ></div>
      <p class="text-lg font-medium text-gray-800 dark:text-white">
        Logging in to your account...
      </p>
    </div>
  </div>
{/if}

<div
  class="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900"
>
  <div class="w-full max-w-md">
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold text-primary">BrightBroom</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-300">
        Sign in to your account
      </p>
    </div>

    <div class="rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
      <!-- Error message if login failed -->
      {#if form?.error}
        <div
          class="mb-6 rounded-md bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-200"
        >
          <p>{form.error}</p>
        </div>
      {/if}

      <form
        method="POST"
        action="?/login"
        use:enhance={() => {
          isLoading = true;

          return async ({ result, update }) => {
            if (result.type === "redirect") {
              // Don't turn off loading state, but activate full-page overlay
              isAuthenticating = true;

              // Short delay to ensure UI updates before redirect
              setTimeout(() => {
                goto(result.location, { replaceState: true });
              }, 100);
            } else {
              // For failures, update the form and stop loading
              isLoading = false;
              await update();
            }
          };
        }}
      >
        <!-- Email input -->
        <div class="mb-4">
          <label
            for="email"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            bind:value={email}
            required
            autocomplete="email"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="you@example.com"
          />
        </div>

        <!-- Password input -->
        <div class="mb-6">
          <label
            for="password"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Password
          </label>
          <div class="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              bind:value={password}
              required
              autocomplete="current-password"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="••••••••"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              on:click={togglePasswordVisibility}
            >
              {#if showPassword}
                <svg
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                  ></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              {:else}
                <svg
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              {/if}
            </button>
          </div>
          <div class="mt-1 text-right">
            <a
              href="/auth/forgot-password"
              class="text-sm text-primary hover:underline"
            >
              Forgot password?
            </a>
          </div>
        </div>

        <!-- Hidden redirectTo field -->
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <!-- Submit button -->
        <button
          type="submit"
          disabled={isLoading}
          class="w-full inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary hover:bg-primary-600 text-white focus-visible:ring-primary-500"
        >
          {#if isLoading}
            <svg
              class="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Signing in...
          {:else}
            Sign in
          {/if}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?
          <a
            href="/auth/register"
            class="font-medium text-primary hover:underline"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  </div>
</div>
