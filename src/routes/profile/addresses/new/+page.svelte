<!-- src/routes/profile/addresses/new/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import Button from "$lib/components/ui/Button.svelte";
  import { AlertTriangle, ArrowLeft, MapPin } from "lucide-svelte";

  // Get form data if there's an error
  export let form;

  // Get redirectTo url param if it exists, default to profile/addresses
  $: redirectTo =
    $page.url.searchParams.get("redirectTo") || "/profile/addresses";

  // Track form state
  let isLoading = false;
  let isSubmitting = false;

  // Form data with defaults
  let street = form?.street || "";
  let aptUnit = form?.aptUnit || "";
  let city = form?.city || "";
  let state = form?.state || "Western Cape"; // Default value
  let zipCode = form?.zipCode || "";
  let isDefault = form?.isDefault || false;
  let instructions = form?.instructions || "";
</script>

<svelte:head>
  <title>Add New Address | BrightBroom</title>
</svelte:head>

{#if isLoading}
  <!-- Full-page loading overlay -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80 dark:bg-gray-900 dark:bg-opacity-80"
  >
    <div class="flex flex-col items-center space-y-4">
      <div
        class="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"
      ></div>
      <p class="text-lg font-medium text-gray-800 dark:text-white">
        Saving address...
      </p>
    </div>
  </div>
{/if}

<div class="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
  <div class="mx-auto max-w-2xl">
    <!-- Page header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Add New Address
        </h1>
        <Button
          variant="outline"
          on:click={() => {
            isLoading = true;
            goto(redirectTo);
          }}
          disabled={isSubmitting}
        >
          <ArrowLeft size={18} class="mr-2" />
          Cancel
        </Button>
      </div>
      <p class="mt-2 text-gray-600 dark:text-gray-300">
        Enter a new address for your cleaning services
      </p>
    </div>

    <!-- Error message if form submission failed -->
    {#if form?.error}
      <div
        class="mb-6 rounded-md bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-200"
      >
        <p>{form.error}</p>
      </div>
    {/if}

    {#if data.maxAddresses && data.addresses?.length >= data.maxAddresses - 1}
      <div
        class="mb-6 bg-yellow-50 p-4 rounded-lg dark:bg-yellow-900/20 flex items-start"
      >
        <AlertTriangle
          class="h-5 w-5 mt-0.5 mr-2 flex-shrink-0 text-yellow-500 dark:text-yellow-400"
        />
        <div>
          <p class="text-yellow-800 dark:text-yellow-300">
            {data.addresses?.length === data.maxAddresses - 1
              ? `This will be your last available address slot. You are limited to ${data.maxAddresses} total addresses.`
              : `You have reached the maximum limit of ${data.maxAddresses} addresses. To add a new address, you must first delete an existing one.`}
          </p>
        </div>
      </div>
    {/if}

    <!-- Address form -->
    <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <form
        method="POST"
        action="?/createAddress"
        use:enhance={({ formData }) => {
          isSubmitting = true;

          return async ({ result }) => {
            if (result.type === "success" && result.data?.redirect) {
              // Keep the loading state active
              isLoading = true;

              const redirectTo = result.data.redirect;

              // If redirecting back to booking flow, add loading parameter
              if (redirectTo.includes("/book/")) {
                // Redirect with loading parameter
                goto(`${redirectTo}?loading=true`, { replaceState: true });
              } else {
                // Normal redirect
                goto(redirectTo, { replaceState: true });
              }
            } else if (result.type === "redirect") {
              // Standard SvelteKit redirect
              isLoading = true;
              goto(result.location, { replaceState: true });
            } else {
              // For errors or other cases, stop loading
              isSubmitting = false;
            }
          };
        }}
      >
        <!-- Street address -->
        <div class="mb-4">
          <label
            for="street"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Street Address <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="street"
            name="street"
            bind:value={street}
            required
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="123 Main Street"
          />
        </div>

        <!-- Apartment/Unit -->
        <div class="mb-4">
          <label
            for="aptUnit"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Apartment/Unit
          </label>
          <input
            type="text"
            id="aptUnit"
            name="aptUnit"
            bind:value={aptUnit}
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Apt 4B (optional)"
          />
        </div>

        <!-- City & State (2-column grid) -->
        <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              for="city"
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              City <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="city"
              name="city"
              bind:value={city}
              required
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Cape Town"
            />
          </div>

          <div>
            <label
              for="state"
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Province <span class="text-red-500">*</span>
            </label>
            <select
              id="state"
              name="state"
              bind:value={state}
              required
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="Eastern Cape">Eastern Cape</option>
              <option value="Free State">Free State</option>
              <option value="Gauteng">Gauteng</option>
              <option value="KwaZulu-Natal">KwaZulu-Natal</option>
              <option value="Limpopo">Limpopo</option>
              <option value="Mpumalanga">Mpumalanga</option>
              <option value="Northern Cape">Northern Cape</option>
              <option value="North West">North West</option>
              <option value="Western Cape">Western Cape</option>
            </select>
          </div>
        </div>

        <!-- Zip/Postal Code -->
        <div class="mb-4">
          <label
            for="zipCode"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Postal Code <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            bind:value={zipCode}
            required
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="8001"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            South African postal codes are typically 4 digits
          </p>
        </div>

        <!-- Access Instructions -->
        <div class="mb-4">
          <label
            for="instructions"
            class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Access Instructions
          </label>
          <textarea
            id="instructions"
            name="instructions"
            bind:value={instructions}
            rows="3"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="E.g., Gate code, building entrance instructions, etc. (optional)"
          ></textarea>
        </div>

        <!-- Default Address Checkbox -->
        <div class="mb-6">
          <label class="flex items-center">
            <input
              type="checkbox"
              name="isDefault"
              bind:checked={isDefault}
              class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Set as default address
            </span>
          </label>
        </div>

        <!-- Hidden redirectTo field -->
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <!-- Submit Button -->
        <div class="flex justify-end">
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {#if isSubmitting}
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
              Saving Address...
            {:else}
              <MapPin size={18} class="mr-2" />
              Save Address
            {/if}
          </Button>
        </div>
      </form>
    </div>
  </div>
</div>
