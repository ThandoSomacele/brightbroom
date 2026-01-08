<!-- src/lib/components/booking/AddonSelector.svelte -->
<script lang="ts">
  import {
    Check,
    Sparkles,
    Info,
    X,
    Shirt,
    Snowflake,
    Flame,
    DoorOpen,
    PaintBucket,
    SquareStack,
    type Icon
  } from "lucide-svelte";
  import type { Addon } from "$lib/server/db/schema";
  import type { ComponentType } from "svelte";

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

  // Map addon names to their icons
  const addonIcons: Record<string, ComponentType<Icon>> = {
    "Laundry & Ironing": Shirt,
    "Inside Fridge": Snowflake,
    "Inside Oven": Flame,
    "Inside Cabinets": DoorOpen,
    "Interior Walls": PaintBucket,
    "Interior Windows": SquareStack,
  };

  function getAddonIcon(addonName: string): ComponentType<Icon> {
    return addonIcons[addonName] || Sparkles;
  }

  // State for showing description popup
  let activePopup: string | null = $state(null);

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

  function showPopup(addonId: string, event: MouseEvent) {
    event.stopPropagation();
    activePopup = activePopup === addonId ? null : addonId;
  }

  function closePopup() {
    activePopup = null;
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

  <!-- Addons grid -->
  <div class="grid gap-3 sm:grid-cols-2">
    {#each addons as addon (addon.id)}
      {@const selected = isSelected(addon.id)}
      {@const AddonIcon = getAddonIcon(addon.name)}
      <div class="relative">
        <!-- Addon card container - uses div with role for accessibility -->
        <div
          class="w-full flex items-center justify-between rounded-lg border-2 p-4 transition-all {selected
            ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
            : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'}"
        >
          <!-- Clickable area for toggle -->
          <button
            type="button"
            onclick={() => toggleAddon(addon.id)}
            class="flex items-center gap-3 flex-1 text-left"
          >
            <!-- Checkbox indicator -->
            <div
              class="flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0 {selected
                ? 'bg-primary-500 text-white'
                : 'border-2 border-gray-300 dark:border-gray-600'}"
            >
              {#if selected}
                <Check class="h-4 w-4" />
              {/if}
            </div>

            <!-- Addon icon -->
            <div class="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 {selected
              ? 'bg-primary-100 text-primary-600 dark:bg-primary-800 dark:text-primary-300'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}">
              <AddonIcon class="h-4 w-4" />
            </div>

            <!-- Addon name -->
            <span class="font-medium text-gray-900 dark:text-white">
              {addon.name}
            </span>
          </button>

          <!-- Info button - separate from toggle button -->
          {#if addon.description}
            <button
              type="button"
              onclick={(e) => showPopup(addon.id, e)}
              class="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 ml-2"
              aria-label="View details for {addon.name}"
            >
              <Info class="h-4 w-4" />
            </button>
          {/if}
        </div>

        <!-- Description popup -->
        {#if activePopup === addon.id && addon.description}
          <div class="absolute z-10 mt-2 w-full rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div class="flex items-start justify-between gap-2">
              <div>
                <h4 class="font-medium text-gray-900 dark:text-white mb-1">{addon.name}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {addon.description}
                </p>
              </div>
              <button
                type="button"
                onclick={closePopup}
                class="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 flex-shrink-0"
                aria-label="Close"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
          </div>
        {/if}
      </div>
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

<!-- Click outside to close popup -->
{#if activePopup}
  <button
    type="button"
    class="fixed inset-0 z-0 cursor-default"
    onclick={closePopup}
    aria-label="Close popup"
  ></button>
{/if}
