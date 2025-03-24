<!-- src/routes/admin/services/[id]/edit/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import Button from "$lib/components/ui/Button.svelte";
  import { ArrowLeft, Clock, DollarSign, Save } from "lucide-svelte";

  // Get the service data from the server
  export let data;
  const { service } = data;

  // Form result data
  export let form;

  let isLoading = false;

  // Form values with defaults from service data
  let name = service.name;
  let description = service.description;
  let basePrice = service.basePrice.toString();
  let durationHours = service.durationHours.toString();
</script>

<svelte:head>
  <title>Edit {service.name} | BrightBroom Admin</title>
</svelte:head>

<!-- Page header with back button -->
<div class="mb-6 flex items-center">
  <a
    href={`/admin/services/${service.id}`}
    class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mr-3"
  >
    <ArrowLeft size={20} />
  </a>
  <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Edit Service</h1>
</div>

<!-- Success/error messages -->
{#if form?.success}
  <div
    class="mb-6 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 p-4 rounded-md"
  >
    {form.message}
  </div>
{:else if form?.error}
  <div
    class="mb-6 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 p-4 rounded-md"
  >
    {form.error}
  </div>
{/if}

<!-- Edit form -->
<div
  class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6"
>
  <form
    method="POST"
    action="/admin/services?/update"
    use:enhance={() => {
      isLoading = true;

      return async ({ result, update }) => {
        isLoading = false;
        await update();
      };
    }}
  >
    <input type="hidden" name="id" value={service.id} />

    <div class="p-6">
      <div class="space-y-6">
        <!-- Service name -->
        <div>
          <label
            for="name"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Service Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            bind:value={name}
            required
            class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <!-- Description -->
        <div>
          <label
            for="description"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            bind:value={description}
            required
            rows="4"
            class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          ></textarea>
        </div>

        <!-- Price and duration -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label
              for="basePrice"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Base Price (ZAR)
            </label>
            <div class="relative">
              <div
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              >
                <DollarSign size={16} class="text-gray-400" />
              </div>
              <input
                type="number"
                id="basePrice"
                name="basePrice"
                bind:value={basePrice}
                min="0"
                step="0.01"
                required
                class="pl-10 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label
              for="durationHours"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Duration (hours)
            </label>
            <div class="relative">
              <div
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              >
                <Clock size={16} class="text-gray-400" />
              </div>
              <input
                type="number"
                id="durationHours"
                name="durationHours"
                bind:value={durationHours}
                min="1"
                max="24"
                step="1"
                required
                class="pl-10 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end space-x-3"
    >
      <Button
        type="button"
        variant="outline"
        href={`/admin/services/${service.id}`}
      >
        Cancel
      </Button>

      <Button type="submit" variant="primary" disabled={isLoading}>
        {#if isLoading}
          <div
            class="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"
          ></div>
          Saving...
        {:else}
          <Save size={16} class="mr-2" />
          Save Changes
        {/if}
      </Button>
    </div>
  </form>
</div>
