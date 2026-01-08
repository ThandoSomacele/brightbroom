<!-- src/lib/components/booking/AddonSelector.svelte -->
<script lang="ts">
  import { Check, Sparkles } from "lucide-svelte";
  import type { Addon } from "$lib/server/db/schema";

  // Props using Svelte 5 runes
  interface Props {
    addons?: Addon[];
    selectedAddonIds?: string[];
    onchange?: (data: { selectedAddonIds: string[] }) => void;
  }

  let {
    addons = [],
    selectedAddonIds = $bindable([]),
    onchange,
  }: Props = $props();

  function toggleAddon(addonId: string) {
    if (selectedAddonIds.includes(addonId)) {
      selectedAddonIds = selectedAddonIds.filter((id) => id !== addonId);
    } else {
      selectedAddonIds = [...selectedAddonIds, addonId];
    }
    onchange?.({ selectedAddonIds });
  }

  function isSelected(addonId: string): boolean {
    return selectedAddonIds.includes(addonId);
  }

  // Get selected addon names for summary
  let selectedAddons = $derived(addons.filter((a) => selectedAddonIds.includes(a.id)));
</script>

<div class="space-y-4">
  <div class="flex items-center gap-2">
    <Sparkles class="h-5 w-5 text-primary-500" />
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
      Optional Add-ons
    </h3>
  </div>

  <p class="text-sm text-gray-600 dark:text-gray-400">
    Enhance your clean with these additional services
  </p>

  <!-- Addons grid -->
  <div class="grid gap-3 sm:grid-cols-2">
    {#each addons as addon (addon.id)}
      {@const selected = isSelected(addon.id)}
      <button
        type="button"
        onclick={() => toggleAddon(addon.id)}
        class="relative flex flex-col rounded-lg border-2 p-4 text-left transition-all {selected
          ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
          : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'}"
      >
        <!-- Checkbox indicator -->
        <div
          class="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full {selected
            ? 'bg-primary-500 text-white'
            : 'border-2 border-gray-300 dark:border-gray-600'}"
        >
          {#if selected}
            <Check class="h-4 w-4" />
          {/if}
        </div>

        <!-- Addon name -->
        <div class="pr-8">
          <h4 class="font-medium text-gray-900 dark:text-white">
            {addon.name}
          </h4>
        </div>

        <!-- Description -->
        {#if addon.description}
          <p class="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
            {addon.description}
          </p>
        {/if}
      </button>
    {/each}
  </div>

  <!-- Selected addons summary -->
  {#if selectedAddonIds.length > 0}
    <div class="mt-4 rounded-lg bg-primary-50 p-4 dark:bg-primary-900/20">
      <p class="text-sm font-medium text-primary-900 dark:text-primary-100">
        {selectedAddonIds.length} add-on{selectedAddonIds.length > 1 ? "s" : ""} selected:
        {selectedAddons.map(a => a.name).join(", ")}
      </p>
    </div>
  {/if}
</div>
