<!-- src/routes/auth/register/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/Button.svelte";
  import { Eye, EyeOff, Loader2 } from "lucide-svelte";

  // Get possible error from form action
  export let form;

  let isLoading = false;
  let isAuthenticating = false;
  let oauthLoading = false;

  let showPassword = false;
  let firstName = form?.firstName || "";
  let lastName = form?.lastName || "";
  let email = form?.email || "";
  let phone = form?.phone || "";
  let password = "";

  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }
</script>

<svelte:head>
  <title>Create an Account | BrightBroom</title>
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
        Creating your account...
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
      <p class="mt-2 text-gray-600 dark:text-gray-300">Create a new account</p>
    </div>

    <div class="rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
      <!-- Error message if registration failed -->
      {#if form?.error}
        <div
          class="mb-6 rounded-md bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-200"
        >
          <p>{form.error}</p>
        </div>
      {/if}

      <!-- OAuth Sign Up Form -->

      <div class="mb-6">
        <form method="POST" action="/auth/signin/google">
          <input type="hidden" name="callbackUrl" value="/profile" />
          <Button
            variant="outline"
            type="submit"
            disabled={oauthLoading || isLoading}
            class="w-full mb-3"
            on:click={() => {
              oauthLoading = true;
            }}
          >
            {#if oauthLoading}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            {:else}
              <svg class="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            {/if}
          </Button>
        </form>

        <!-- Divider -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div
              class="w-full border-t border-gray-300 dark:border-gray-600"
            ></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span
              class="bg-white px-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
            >
              Or sign up with email
            </span>
          </div>
        </div>
      </div>

      <form
        method="POST"
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
        <!-- First Name & Last Name (2-column grid) -->
        <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              for="firstName"
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              First name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              bind:value={firstName}
              required
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="John"
            />
          </div>

          <div>
            <label
              for="lastName"
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Last name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              bind:value={lastName}
              required
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Doe"
            />
          </div>
        </div>

        <!-- Email -->
        <div class="mb-4">
          <label
            for="email"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email address <span class="text-red-500">*</span>
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

        <!-- Phone (optional) -->
        <div class="mb-4">
          <label
            for="phone"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Phone number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            bind:value={phone}
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="+27 12 345 6789"
          />
        </div>

        <!-- Password -->
        <div class="mb-4">
          <label
            for="password"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Password <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              bind:value={password}
              required
              autocomplete="new-password"
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

        <!-- Terms of Service -->
        <div class="mb-6">
          <label class="flex items-center">
            <input
              type="checkbox"
              name="terms"
              required
              class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">
              I agree to the
              <a href="/terms" class="text-primary hover:underline"
                >Terms of Service</a
              >
              and
              <a href="/privacy" class="text-primary hover:underline"
                >Privacy Policy</a
              > <span class="text-red-500">*</span>
            </span>
          </label>
        </div>

        <!-- Submit button -->
        <Button
          variant="primary"
          type="submit"
          disabled={isLoading || oauthLoading}
          class="w-full"
        >
          {#if isLoading}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          {:else}
            Create account
          {/if}
        </Button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?
          <a
            href="/auth/login"
            class="font-medium text-primary hover:underline"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  </div>
</div>
