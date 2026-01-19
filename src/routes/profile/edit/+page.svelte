<!-- src/routes/profile/edit/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/Button.svelte";

  // Get data from the server load function
  export let data;
  export let form;

  // Get user data
  $: user = data.user;

  let isLoading = false;

  // Initialise form fields reactively to avoid undefined errors
  $: firstName = user?.firstName || "";
  $: lastName = user?.lastName || "";
  $: phone = user?.phone || "";
</script>

<svelte:head>
  <title>Edit Profile | BrightBroom</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
  <div class="mx-auto max-w-3xl">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Edit Profile
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-300">
        Update your personal information
      </p>
    </div>

    <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <!-- Success message -->
      {#if form?.success}
        <div
          class="mb-6 rounded-md bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-200"
        >
          <p>{form.success}</p>
        </div>
      {/if}

      <!-- Error message -->
      {#if form?.error}
        <div
          class="mb-6 rounded-md bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-200"
        >
          <p>{form.error}</p>
        </div>
      {/if}

      <form
        method="POST"
        use:enhance={() => {
          isLoading = true;

          return async ({ result, update }) => {
            isLoading = false;

            if (result.type === "redirect") {
              goto(result.location);
            } else {
              await update();
            }
          };
        }}
      >
        <!-- First Name & Last Name (2-column grid) -->
        <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              value={firstName}
              required
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
              value={lastName}
              required
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <!-- Email (readonly) -->
        <div class="mb-6">
          <label
            for="email"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email address
          </label>
          <input
            type="email"
            id="email"
            value={user.email}
            readonly
            disabled
            class="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-300"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Email address cannot be changed
          </p>
        </div>

        <!-- Phone -->
        <div class="mb-6">
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
            value={phone}
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="+27 12 345 6789"
          />
        </div>

        <!-- Action buttons -->
        <div class="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Button type="button" variant="outline" href="/profile">
            Cancel
          </Button>

          <Button type="submit" variant="primary" disabled={isLoading}>
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
              Saving...
            {:else}
              Save Changes
            {/if}
          </Button>
        </div>
      </form>

      <div class="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
        <h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-white">
          Change Password
        </h3>
        <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
          To update your password, click the button below. You'll be sent to a
          separate page.
        </p>
        <Button variant="outline" href="/profile/change-password">
          Change Password
        </Button>
      </div>
    </div>
  </div>
</div>
