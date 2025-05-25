<!-- src/routes/auth/reset-password/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import Button from "$lib/components/ui/Button.svelte";
  import { Eye, EyeOff } from "lucide-svelte";

  // Get data from the server
  export let data;
  export let form;

  let isLoading = false;
  let showPassword = false;
  let password = "";
  let confirmPassword = "";

  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }
</script>

<svelte:head>
  <title>Reset Password | BrightBroom</title>
</svelte:head>

<div
  class="min-h-screen flex items-center justify-center bg-gray-50 p-4 dark:bg-gray-900"
>
  <div class="w-full max-w-md">
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold text-primary">BrightBroom</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-300">Create a new password</p>
    </div>

    <div class="bg-white p-8 rounded-lg shadow-md dark:bg-gray-800">
      {#if form?.success}
        <div
          class="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200 p-4 rounded-md mb-6"
        >
          <p>{form.message}</p>
        </div>

        <div class="mt-6 text-center">
          <Button variant="primary" href="/auth/login" class="w-full">
            Go to Login
          </Button>
        </div>
      {:else}
        {#if form?.error}
          <div
            class="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-200 p-4 rounded-md mb-6"
          >
            <p>{form.error}</p>
          </div>
        {/if}

        <p class="text-gray-600 dark:text-gray-300 mb-6">
          Enter your new password below.
        </p>

        <form
          method="POST"
          use:enhance={() => {
            isLoading = true;

            return async ({ result, update }) => {
              isLoading = false;
              await update();
            };
          }}
        >
          <!-- Hidden token field -->
          <input type="hidden" name="token" value={data.token} />

          <!-- Password -->
          <div class="mb-4">
            <label
              for="password"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              New Password
            </label>
            <div class="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                bind:value={password}
                required
                minlength="8"
                class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="••••••••"
              />
              <Button
                variant="ghost"
                size="sm"
                type="button"
                class="absolute inset-y-0 right-0 px-3 hover:bg-transparent dark:hover:bg-transparent"
                on:click={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {#if showPassword}
                  <EyeOff class="h-5 w-5" />
                {:else}
                  <Eye class="h-5 w-5" />
                {/if}
              </Button>
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Must be at least 8 characters
            </p>
          </div>

          <!-- Confirm Password -->
          <div class="mb-6">
            <label
              for="confirmPassword"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Confirm New Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              bind:value={confirmPassword}
              required
              minlength="8"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            class="w-full inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary hover:bg-primary-600 text-white focus-visible:ring-primary-500"
          >
            {#if isLoading}
              <svg
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              Resetting Password...
            {:else}
              Reset Password
            {/if}
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Remembered your password?
            <a
              href="/auth/login"
              class="font-medium text-primary hover:underline"
            >
              Sign in
            </a>
          </p>
        </div>
      {/if}
    </div>
  </div>
</div>
