<!-- src/routes/admin/cleaners/new/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import Button from "$lib/components/ui/Button.svelte";
  import { ArrowLeft, Save } from "lucide-svelte";

  // Get data from server load function (services list)
  export let data;
  export let form;

  // Form state
  let isLoading = false;
  let selectedServices = new Map();

  // Initialise service selection
  $: {
    if (data.services) {
      data.services.forEach((service) => {
        if (!selectedServices.has(service.id)) {
          selectedServices.set(service.id, {
            selected: false,
            experience: 0,
          });
        }
      });
    }
  }

  // Toggle service selection
  function toggleService(serviceId: string) {
    if (selectedServices.has(serviceId)) {
      const current = selectedServices.get(serviceId);
      selectedServices.set(serviceId, {
        ...current,
        selected: !current.selected,
      });
      // Force reactivity by creating a new map
      selectedServices = new Map(selectedServices);
    }
  }

  // Update service experience
  function updateExperience(serviceId: string, months: number) {
    if (selectedServices.has(serviceId)) {
      const current = selectedServices.get(serviceId);
      selectedServices.set(serviceId, {
        ...current,
        experience: months,
      });
    }
  }
</script>

<svelte:head>
  <title>Add New Cleaner | BrightBroom Admin</title>
</svelte:head>

<!-- Page header with back button -->
<div class="mb-6 flex items-center">
  <a
    href="/admin/cleaners"
    class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mr-3"
  >
    <ArrowLeft size={20} />
  </a>
  <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
    Add New Cleaner
  </h1>
</div>

<!-- Error/Success message -->
{#if form?.error}
  <div
    class="mb-6 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 p-4 rounded-md"
  >
    {form.error}
  </div>
{:else if form?.success}
  <div
    class="mb-6 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 p-4 rounded-md"
  >
    {form.message}
  </div>
{/if}

<!-- Add Cleaner Form -->
<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
  <form
    method="POST"
    action="?/create"
    use:enhance={() => {
      isLoading = true;

      return async ({ result, update }) => {
        isLoading = false;
        await update();

        if (result.type === "success" || result.type === "redirect") {
          // Optional: Redirect to the new cleaner's page
          if (result.data?.userId) {
            window.location.href = `/admin/cleaners/${result.data.userId}`;
          }
        }
      };
    }}
  >
    <div class="p-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
        <!-- Left column - Basic Info -->
        <div class="space-y-6">
          <h2
            class="text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2"
          >
            Basic Information
          </h2>

          <!-- Email -->
          <div>
            <label
              for="email"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={form?.data?.email || ""}
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

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
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={form?.data?.phone || ""}
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <!-- Password -->
          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Password *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              autocomplete="new-password"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              The cleaner will use this password for their first login.
            </p>
          </div>

          <!-- ID Information -->
          <div>
            <label
              for="idType"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              ID Type *
            </label>
            <select
              id="idType"
              name="idType"
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="SOUTH_AFRICAN_ID">South African ID</option>
              <option value="PASSPORT">Passport</option>
            </select>
          </div>

          <div>
            <label
              for="idNumber"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              ID Number *
            </label>
            <input
              type="text"
              id="idNumber"
              name="idNumber"
              required
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

        <!-- Right column - Work Info -->
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
              Work Address *
            </label>
            <input
              type="text"
              id="workAddress"
              name="workAddress"
              required
              value={form?.data?.workAddress || ""}
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              The cleaner's home location to calculate job distances from
            </p>
          </div>

          <!-- Work Radius -->
          <div>
            <label
              for="workRadius"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Work Radius (km) *
            </label>
            <input
              type="number"
              id="workRadius"
              name="workRadius"
              min="1"
              max="100"
              value={form?.data?.workRadius || "10"}
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Maximum distance in kilometers the cleaner is willing to travel
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
              value={form?.data?.bio || ""}
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            ></textarea>
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

          <!-- Is Active -->
          <div class="mt-4">
            <label class="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={form?.data?.isActive || true}
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">
                Available for bookings (active)
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- Service Specializations -->
      <div class="mt-8">
        <h2
          class="text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4"
        >
          Service Specializations
        </h2>

        <div class="space-y-4">
          {#each data.services as service}
            <div
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div class="flex items-start">
                <input
                  type="checkbox"
                  id={`service-${service.id}`}
                  name="serviceId"
                  value={service.id}
                  checked={selectedServices.get(service.id)?.selected}
                  on:change={() => toggleService(service.id)}
                  class="h-4 w-4 mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div class="ml-3 flex-1">
                  <label
                    for={`service-${service.id}`}
                    class="text-gray-900 dark:text-white font-medium"
                  >
                    {service.name}
                  </label>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {service.description}
                  </p>

                  {#if selectedServices.get(service.id)?.selected}
                    <div class="mt-2">
                      <label
                        for={`experience-${service.id}`}
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Experience (months)
                      </label>
                      <input
                        type="number"
                        id={`experience-${service.id}`}
                        name={`experience-${service.id}`}
                        value={selectedServices.get(service.id)?.experience ||
                          0}
                        on:input={(e) =>
                          updateExperience(
                            service.id,
                            parseInt(e.target.value),
                          )}
                        min="0"
                        class="w-full sm:w-1/3 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Form Actions -->
    <div
      class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end space-x-3"
    >
      <Button type="button" variant="outline" href="/admin/cleaners">
        Cancel
      </Button>

      <Button type="submit" variant="primary" disabled={isLoading}>
        {#if isLoading}
          <div
            class="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"
          ></div>
          Creating...
        {:else}
          <Save size={16} class="mr-2" />
          Create Cleaner
        {/if}
      </Button>
    </div>
  </form>
</div>
