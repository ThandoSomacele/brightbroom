<!-- src/routes/admin/applications/new/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import Button from "$lib/components/ui/Button.svelte";
  import { ArrowLeft, Save, Zap } from "lucide-svelte";

  export let form;

  let isLoading = false;
  let autoApprove = form?.data?.autoApprove || false;
</script>

<svelte:head>
  <title>Create Application | BrightBroom Admin</title>
</svelte:head>

<!-- Page header -->
<div class="mb-6 flex items-center">
  <a
    href="/admin/applications"
    class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mr-3"
  >
    <ArrowLeft size={20} />
  </a>
  <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
    Create Application
  </h1>
</div>

<!-- Error message -->
{#if form?.error}
  <div
    class="mb-6 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 p-4 rounded-md"
  >
    {form.error}
  </div>
{/if}

<!-- Form -->
<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
  <form
    method="POST"
    action="?/create"
    use:enhance={() => {
      isLoading = true;
      return async ({ update }) => {
        isLoading = false;
        await update();
      };
    }}
  >
    <div class="p-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
        <!-- Left column -->
        <div class="space-y-6">
          <h2
            class="text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2"
          >
            Basic Information
          </h2>

          <!-- First Name -->
          <div>
            <label
              for="firstName"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              required
              value={form?.data?.firstName || ""}
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <!-- Last Name -->
          <div>
            <label
              for="lastName"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              required
              value={form?.data?.lastName || ""}
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <!-- Phone -->
          <div>
            <label
              for="phone"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={form?.data?.phone || ""}
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <!-- City -->
          <div>
            <label
              for="city"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              City *
            </label>
            <input
              type="text"
              id="city"
              name="city"
              required
              value={form?.data?.city || ""}
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <!-- Email (optional) -->
          <div>
            <label
              for="email"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={form?.data?.email || ""}
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              If left blank, a placeholder email will be generated. You can set real credentials later on the cleaner detail page.
            </p>
          </div>

          <!-- ID Information -->
          <div>
            <label
              for="idType"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              ID Type
            </label>
            <select
              id="idType"
              name="idType"
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Not provided</option>
              <option value="SOUTH_AFRICAN_ID">South African ID</option>
              <option value="PASSPORT">Passport</option>
            </select>
          </div>

          <div>
            <label
              for="idNumber"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              ID Number
            </label>
            <input
              type="text"
              id="idNumber"
              name="idNumber"
              value={form?.data?.idNumber || ""}
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label
              for="taxNumber"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Tax Number
            </label>
            <input
              type="text"
              id="taxNumber"
              name="taxNumber"
              value={form?.data?.taxNumber || ""}
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <!-- Right column -->
        <div class="space-y-6">
          <h2
            class="text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2"
          >
            Work Information
          </h2>

          <!-- Work Address -->
          <div>
            <label
              for="workAddress"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Work Address
            </label>
            <input
              type="text"
              id="workAddress"
              name="workAddress"
              value={form?.data?.workAddress || ""}
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Home address for calculating job distances. If blank, city will be used.
            </p>
          </div>

          <!-- Pet Compatibility -->
          <div>
            <label
              for="petCompatibility"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Pet Compatibility
            </label>
            <select
              id="petCompatibility"
              name="petCompatibility"
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="NONE">No pets</option>
              <option value="DOGS">Dogs only</option>
              <option value="CATS">Cats only</option>
              <option value="BOTH">Dogs and cats</option>
            </select>
          </div>

          <!-- Bio -->
          <div>
            <label
              for="bio"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows="3"
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >{form?.data?.bio || ""}</textarea>
          </div>

          <!-- Available Days -->
          <div>
            <span
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Available Days
            </span>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {#each ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as day}
                <label class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name={`day-${day}`}
                    id={`day-${day}`}
                    class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={form?.data?.availableDays?.includes(day) || false}
                  />
                  <span class="text-sm text-gray-700 dark:text-gray-300">
                    {day.charAt(0) + day.slice(1).toLowerCase()}
                  </span>
                </label>
              {/each}
            </div>
          </div>

          <!-- Transport & WhatsApp -->
          <div class="flex gap-6">
            <label class="flex items-center space-x-2">
              <input
                type="checkbox"
                name="ownTransport"
                id="ownTransport"
                class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={form?.data?.ownTransport || false}
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">
                Own Transport
              </span>
            </label>

            <label class="flex items-center space-x-2">
              <input
                type="checkbox"
                name="whatsApp"
                id="whatsApp"
                class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={form?.data?.whatsApp || false}
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">
                WhatsApp
              </span>
            </label>
          </div>

          <!-- Bank Details -->
          <h3
            class="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 pt-2"
          >
            Bank Details
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                for="bankName"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Bank Name
              </label>
              <input
                type="text"
                id="bankName"
                name="bankName"
                value={form?.data?.bankName || ""}
                class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label
                for="bankAccountType"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Account Type
              </label>
              <select
                id="bankAccountType"
                name="bankAccountType"
                class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Not provided</option>
                <option value="SAVINGS">Savings</option>
                <option value="CHEQUE">Cheque</option>
                <option value="TRANSMISSION">Transmission</option>
              </select>
            </div>

            <div>
              <label
                for="bankAccountNumber"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Account Number
              </label>
              <input
                type="text"
                id="bankAccountNumber"
                name="bankAccountNumber"
                value={form?.data?.bankAccountNumber || ""}
                class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label
                for="bankBranchCode"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Branch Code
              </label>
              <input
                type="text"
                id="bankBranchCode"
                name="bankBranchCode"
                value={form?.data?.bankBranchCode || ""}
                class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div class="sm:col-span-2">
              <label
                for="bankAccountHolder"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Account Holder Name
              </label>
              <input
                type="text"
                id="bankAccountHolder"
                name="bankAccountHolder"
                value={form?.data?.bankAccountHolder || ""}
                class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Auto-approve toggle -->
      <div
        class="mt-8 p-4 border-2 rounded-lg"
        class:border-primary={autoApprove}
        class:bg-primary/5={autoApprove}
        class:border-gray-200={!autoApprove}
        class:dark:border-gray-600={!autoApprove}
      >
        <label class="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            name="autoApprove"
            id="autoApprove"
            bind:checked={autoApprove}
            class="h-5 w-5 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <div>
            <span class="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Zap size={16} class="text-primary" />
              Auto-approve and create cleaner account
            </span>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Immediately creates a user account and cleaner profile. If no email is provided, the cleaner will have placeholder credentials that need to be set up on their detail page.
            </p>
          </div>
        </label>
      </div>
    </div>

    <!-- Form Actions -->
    <div
      class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end space-x-3"
    >
      <Button type="button" variant="outline" href="/admin/applications">
        Cancel
      </Button>

      <Button type="submit" variant="primary" disabled={isLoading}>
        {#if isLoading}
          <div
            class="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"
          ></div>
          Creating...
        {:else if autoApprove}
          <Zap size={16} class="mr-2" />
          Create & Approve
        {:else}
          <Save size={16} class="mr-2" />
          Create Application
        {/if}
      </Button>
    </div>
  </form>
</div>
