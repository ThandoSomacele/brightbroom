<!-- src/routes/admin/pricing/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import Button from "$lib/components/ui/Button.svelte";
  import { showSuccess, showError } from "../+layout.svelte";
  import {
    DollarSign,
    Clock,
    Home,
    Bed,
    Bath,
    Sparkles,
    Plus,
    Pencil,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Save,
  } from "lucide-svelte";
  import type { PageData, ActionData } from "./$types";

  // Get data from server using Svelte 5 props
  let { data, form }: { data: PageData; form: ActionData } = $props();

  // Reactive state
  let isSubmitting = $state(false);
  let showAddAddonModal = $state(false);
  let editingAddon: typeof data.addons[0] | null = $state(null);

  // Form values for pricing config
  let basePrice = $state(data.pricingConfig.basePrice);
  let baseDurationMinutes = $state(data.pricingConfig.baseDurationMinutes);
  let baseDescription = $state(data.pricingConfig.baseDescription || "");
  let bedroomPrice = $state(data.pricingConfig.bedroomPrice);
  let bedroomDurationMinutes = $state(data.pricingConfig.bedroomDurationMinutes);
  let bedroomMin = $state(data.pricingConfig.bedroomMin);
  let bedroomMax = $state(data.pricingConfig.bedroomMax);
  let bathroomPrice = $state(data.pricingConfig.bathroomPrice);
  let bathroomDurationMinutes = $state(data.pricingConfig.bathroomDurationMinutes);
  let bathroomMin = $state(data.pricingConfig.bathroomMin);
  let bathroomMax = $state(data.pricingConfig.bathroomMax);

  // Form values for new addon
  let newAddonName = $state("");
  let newAddonDescription = $state("");
  let newAddonPrice = $state("");
  let newAddonDuration = $state(60);

  // Format duration for display
  function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  // Handle form result
  $effect(() => {
    if (form?.success) {
      showSuccess(form.message || "Changes saved successfully");
      // Reset addon form
      if (showAddAddonModal) {
        showAddAddonModal = false;
        newAddonName = "";
        newAddonDescription = "";
        newAddonPrice = "";
        newAddonDuration = 60;
      }
      if (editingAddon) {
        editingAddon = null;
      }
    } else if (form?.error) {
      showError(form.error);
    }
  });

  // Open edit modal for addon
  function openEditAddon(addon: typeof data.addons[0]) {
    editingAddon = addon;
  }
</script>

<svelte:head>
  <title>Pricing Configuration | Admin | BrightBroom</title>
</svelte:head>

<div class="space-y-8">
  <!-- Page Header -->
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Pricing Configuration</h1>
    <p class="mt-1 text-gray-600 dark:text-gray-400">
      Manage base pricing, room rates, and add-on services
    </p>
  </div>

  <!-- Pricing Configuration Form -->
  <form
    method="POST"
    action="?/updatePricing"
    use:enhance={() => {
      isSubmitting = true;
      return async ({ result, update }) => {
        isSubmitting = false;
        await update();
      };
    }}
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-8">
      <!-- Base Pricing Section -->
      <div>
        <div class="flex items-center gap-2 mb-4">
          <Home class="h-5 w-5 text-primary-600" />
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Base Pricing (Living Room + Kitchen)
          </h2>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <label for="basePrice" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Base Price (R)
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
              <input
                type="number"
                id="basePrice"
                name="basePrice"
                step="0.01"
                min="0"
                bind:value={basePrice}
                class="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label for="baseDurationMinutes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              id="baseDurationMinutes"
              name="baseDurationMinutes"
              min="0"
              step="15"
              bind:value={baseDurationMinutes}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label for="baseDescription" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              type="text"
              id="baseDescription"
              name="baseDescription"
              bind:value={baseDescription}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      <!-- Bedroom Pricing Section -->
      <div>
        <div class="flex items-center gap-2 mb-4">
          <Bed class="h-5 w-5 text-primary-600" />
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Bedroom Pricing</h2>
        </div>

        <div class="grid gap-4 sm:grid-cols-4">
          <div>
            <label for="bedroomPrice" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Price per Bedroom (R)
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
              <input
                type="number"
                id="bedroomPrice"
                name="bedroomPrice"
                step="0.01"
                min="0"
                bind:value={bedroomPrice}
                class="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label for="bedroomDurationMinutes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              id="bedroomDurationMinutes"
              name="bedroomDurationMinutes"
              min="0"
              step="15"
              bind:value={bedroomDurationMinutes}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label for="bedroomMin" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Minimum
            </label>
            <input
              type="number"
              id="bedroomMin"
              name="bedroomMin"
              min="0"
              bind:value={bedroomMin}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label for="bedroomMax" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Maximum
            </label>
            <input
              type="number"
              id="bedroomMax"
              name="bedroomMax"
              min="1"
              bind:value={bedroomMax}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      <!-- Bathroom Pricing Section -->
      <div>
        <div class="flex items-center gap-2 mb-4">
          <Bath class="h-5 w-5 text-secondary-600" />
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Bathroom Pricing</h2>
        </div>

        <div class="grid gap-4 sm:grid-cols-4">
          <div>
            <label for="bathroomPrice" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Price per Bathroom (R)
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
              <input
                type="number"
                id="bathroomPrice"
                name="bathroomPrice"
                step="0.01"
                min="0"
                bind:value={bathroomPrice}
                class="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label for="bathroomDurationMinutes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              id="bathroomDurationMinutes"
              name="bathroomDurationMinutes"
              min="0"
              step="15"
              bind:value={bathroomDurationMinutes}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label for="bathroomMin" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Minimum
            </label>
            <input
              type="number"
              id="bathroomMin"
              name="bathroomMin"
              min="0"
              bind:value={bathroomMin}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label for="bathroomMax" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Maximum
            </label>
            <input
              type="number"
              id="bathroomMax"
              name="bathroomMax"
              min="1"
              bind:value={bathroomMax}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {#if isSubmitting}
            Saving...
          {:else}
            <Save class="h-4 w-4 mr-2" />
            Save Pricing Configuration
          {/if}
        </Button>
      </div>
    </div>
  </form>

  <!-- Add-ons Section -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <Sparkles class="h-5 w-5 text-primary-600" />
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Add-on Services</h2>
      </div>

      <Button
        variant="primary"
        onclick={() => (showAddAddonModal = true)}
      >
        <Plus class="h-4 w-4 mr-2" />
        Add New
      </Button>
    </div>

    <!-- Add-ons Table -->
    {#if data.addons.length > 0}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Price
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Duration
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {#each data.addons as addon (addon.id)}
              <tr class={!addon.isActive ? "opacity-50" : ""}>
                <td class="px-4 py-4 whitespace-nowrap">
                  <div class="font-medium text-gray-900 dark:text-white">{addon.name}</div>
                  {#if addon.description}
                    <div class="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {addon.description}
                    </div>
                  {/if}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                  R{parseFloat(addon.price as unknown as string).toFixed(2)}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                  {formatDuration(addon.durationMinutes)}
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <span
                    class={`px-2 py-1 text-xs font-medium rounded-full ${
                      addon.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {addon.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-right space-x-2">
                  <button
                    type="button"
                    onclick={() => openEditAddon(addon)}
                    class="text-primary-600 hover:text-primary-800 dark:text-primary-400"
                    title="Edit"
                  >
                    <Pencil class="h-4 w-4 inline" />
                  </button>

                  <form method="POST" action="?/toggleAddonStatus" class="inline" use:enhance>
                    <input type="hidden" name="id" value={addon.id} />
                    <button
                      type="submit"
                      class={addon.isActive ? "text-yellow-600 hover:text-yellow-800" : "text-green-600 hover:text-green-800"}
                      title={addon.isActive ? "Deactivate" : "Activate"}
                    >
                      {#if addon.isActive}
                        <ToggleRight class="h-4 w-4 inline" />
                      {:else}
                        <ToggleLeft class="h-4 w-4 inline" />
                      {/if}
                    </button>
                  </form>

                  <form
                    method="POST"
                    action="?/deleteAddon"
                    class="inline"
                    use:enhance={() => {
                      if (!confirm(`Are you sure you want to delete "${addon.name}"?`)) {
                        return ({ cancel }) => cancel();
                      }
                      return async ({ update }) => await update();
                    }}
                  >
                    <input type="hidden" name="id" value={addon.id} />
                    <button
                      type="submit"
                      class="text-red-600 hover:text-red-800 dark:text-red-400"
                      title="Delete"
                    >
                      <Trash2 class="h-4 w-4 inline" />
                    </button>
                  </form>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <div class="text-center py-8 text-gray-500 dark:text-gray-400">
        <Sparkles class="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No add-on services configured yet.</p>
        <p class="text-sm mt-1">Click "Add New" to create your first add-on.</p>
      </div>
    {/if}
  </div>
</div>

<!-- Add Addon Modal -->
{#if showAddAddonModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onclick={(e) => e.target === e.currentTarget && (showAddAddonModal = false)}
    role="dialog"
    aria-modal="true"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Add-on</h3>

      <form
        method="POST"
        action="?/createAddon"
        use:enhance={() => {
          isSubmitting = true;
          return async ({ result, update }) => {
            isSubmitting = false;
            await update();
          };
        }}
      >
        <div class="space-y-4">
          <div>
            <label for="newName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              id="newName"
              name="name"
              bind:value={newAddonName}
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label for="newDescription" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="newDescription"
              name="description"
              bind:value={newAddonDescription}
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="newPrice" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Price (R) *
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                <input
                  type="number"
                  id="newPrice"
                  name="price"
                  step="0.01"
                  min="0"
                  bind:value={newAddonPrice}
                  required
                  class="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label for="newDuration" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                id="newDuration"
                name="durationMinutes"
                min="0"
                step="15"
                bind:value={newAddonDuration}
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onclick={() => (showAddAddonModal = false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Add-on"}
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Edit Addon Modal -->
{#if editingAddon}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onclick={(e) => e.target === e.currentTarget && (editingAddon = null)}
    role="dialog"
    aria-modal="true"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Add-on</h3>

      <form
        method="POST"
        action="?/updateAddon"
        use:enhance={() => {
          isSubmitting = true;
          return async ({ result, update }) => {
            isSubmitting = false;
            await update();
          };
        }}
      >
        <input type="hidden" name="id" value={editingAddon.id} />

        <div class="space-y-4">
          <div>
            <label for="editName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              id="editName"
              name="name"
              value={editingAddon.name}
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label for="editDescription" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="editDescription"
              name="description"
              rows="3"
              value={editingAddon.description || ""}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="editPrice" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Price (R) *
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                <input
                  type="number"
                  id="editPrice"
                  name="price"
                  step="0.01"
                  min="0"
                  value={editingAddon.price}
                  required
                  class="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label for="editDuration" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                id="editDuration"
                name="durationMinutes"
                min="0"
                step="15"
                value={editingAddon.durationMinutes}
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                name="isActive"
                value="true"
                checked={editingAddon.isActive}
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Active (visible to customers)</span>
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onclick={() => (editingAddon = null)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}
