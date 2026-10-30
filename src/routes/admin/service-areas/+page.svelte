<!-- src/routes/admin/service-areas/+page.svelte -->
<!--
  Where this company takes bookings and recruits cleaners. Each area is a
  circle: a centre picked from the address search and a radius in km. Booking,
  cleaner sign-up and saved addresses all check against the active areas.
-->
<script lang="ts">
  import { enhance } from "$app/forms";
  import { brand } from "$lib/config/brand";
  import GoogleMapsAutocomplete from "$lib/components/maps/GoogleMapsAutocomplete.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Icon from "$lib/components/ui/Icon.svelte";
  import { DEFAULT_SERVICE_AREA_RADIUS_KM } from "$lib/utils/service-areas";

  let { data, form } = $props();

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const emptyPick = {
    formatted: "",
    street: "",
    aptUnit: "",
    city: "",
    state: "",
    zipCode: "",
    lat: 0,
    lng: 0,
    placeType: "",
    placeName: "",
  };

  // A new area: the address search fills its centre and suggests a name
  let picked = $state({ ...emptyPick });
  let newName = $state("");
  let pickerValue = $state("");
  let editingId = $state<string | null>(null);

  const activeCount = $derived(data.areas.filter((area) => area.isActive).length);

  function handlePick(event: CustomEvent<{ address: typeof emptyPick }>) {
    const place = event.detail.address;
    if (!newName) newName = place.placeName || place.city || place.formatted.split(",")[0];
  }

  function resetNewArea() {
    picked = { ...emptyPick };
    newName = "";
    pickerValue = "";
  }
</script>

<svelte:head>
  <title>Service Areas | {brand.name} Admin</title>
</svelte:head>

<div class="mb-6">
  <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Service areas</h1>
  <p class="mt-2 max-w-3xl text-gray-600 dark:text-gray-300">
    Where you take bookings and recruit cleaners. Customers can only book, and cleaners can only
    apply, at an address inside an active area.
  </p>
</div>

{#if form?.success}
  <div class="mb-6 rounded-md bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-300">
    {form.message}
  </div>
{:else if form?.error}
  <div class="mb-6 rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-300">
    {form.error}
  </div>
{/if}

{#if activeCount === 0}
  <div class="mb-6 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
    <Icon name="warning" size={20} class="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
    <p class="text-sm text-amber-800 dark:text-amber-300">
      No active areas yet, so customers can't book online. Add at least one area below.
    </p>
  </div>
{/if}

<!-- Add an area -->
<div class="card mb-8 p-6">
  <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Add an area</h2>
  <form
    method="POST"
    action="?/create"
    use:enhance={() =>
      async ({ result, update }) => {
        await update();
        if (result.type === "success") resetNewArea();
      }}
    class="grid gap-4 md:grid-cols-[2fr_2fr_1fr_auto] md:items-end"
  >
    <div>
      <GoogleMapsAutocomplete
        apiKey={googleMapsApiKey}
        serviceAreas={data.areas}
        enforceServiceArea={false}
        id="new-area-centre"
        label="Centre"
        placeholder="Search for a suburb or address"
        bind:value={pickerValue}
        bind:selectedAddress={picked}
        on:select={handlePick}
      />
      <input type="hidden" name="lat" value={picked.lat || ""} />
      <input type="hidden" name="lng" value={picked.lng || ""} />
    </div>

    <div>
      <label for="new-area-name" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Name customers see
      </label>
      <input
        id="new-area-name"
        name="name"
        required
        maxlength="80"
        bind:value={newName}
        placeholder="e.g. Sea Point"
        class="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      />
    </div>

    <div>
      <label for="new-area-radius" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Radius (km)
      </label>
      <input
        id="new-area-radius"
        name="radiusKm"
        type="number"
        min="0.5"
        max="100"
        step="0.5"
        value={DEFAULT_SERVICE_AREA_RADIUS_KM}
        class="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      />
    </div>

    <Button type="submit" variant="primary" disabled={!picked.lat}>
      <Icon name="plus-circle" size={16} class="mr-2" />
      Add area
    </Button>
  </form>
</div>

<!-- The areas -->
<div class="card overflow-hidden">
  {#if data.areas.length === 0}
    <p class="p-6 text-gray-600 dark:text-gray-300">No service areas yet.</p>
  {:else}
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Area</th>
            <th scope="col" class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Radius</th>
            <th scope="col" class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Order</th>
            <th scope="col" class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
            <th scope="col" class="px-4 py-3"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
          {#each data.areas as area (area.id)}
            <tr>
              {#if editingId === area.id}
                <td colspan="5" class="px-4 py-3">
                  <form
                    method="POST"
                    action="?/update"
                    use:enhance={() =>
                      async ({ result, update }) => {
                        await update();
                        if (result.type === "success") editingId = null;
                      }}
                    class="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto_auto] md:items-end"
                  >
                    <input type="hidden" name="id" value={area.id} />
                    <input type="hidden" name="lat" value={area.lat} />
                    <input type="hidden" name="lng" value={area.lng} />
                    <label class="text-sm text-gray-700 dark:text-gray-300">
                      Name
                      <input name="name" required maxlength="80" value={area.name} class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    </label>
                    <label class="text-sm text-gray-700 dark:text-gray-300">
                      Radius (km)
                      <input name="radiusKm" type="number" min="0.5" max="100" step="0.5" value={area.radiusKm} class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    </label>
                    <label class="text-sm text-gray-700 dark:text-gray-300">
                      Order
                      <input name="sortOrder" type="number" min="0" max="9999" step="1" value={area.sortOrder} class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    </label>
                    <Button type="submit" variant="primary" size="sm">Save</Button>
                    <Button type="button" variant="ghost" size="sm" onclick={() => (editingId = null)}>Cancel</Button>
                  </form>
                  <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    To move an area's centre, add the new one and delete this one.
                  </p>
                </td>
              {:else}
                <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{area.name}</td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{area.radiusKm} km</td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{area.sortOrder}</td>
                <td class="px-4 py-3 text-sm">
                  {#if area.isActive}
                    <span class="rounded-full bg-green-50 px-2 py-0.5 text-green-800 dark:bg-green-900/20 dark:text-green-300">Active</span>
                  {:else}
                    <span class="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Off</span>
                  {/if}
                </td>
                <td class="px-4 py-3">
                  <div class="flex justify-end gap-2">
                    <Button type="button" variant="ghost" size="sm" onclick={() => (editingId = area.id)}>Edit</Button>
                    <form method="POST" action="?/toggleActive" use:enhance>
                      <input type="hidden" name="id" value={area.id} />
                      <input type="hidden" name="isActive" value={String(!area.isActive)} />
                      <Button type="submit" variant="outline" size="sm">{area.isActive ? "Switch off" : "Switch on"}</Button>
                    </form>
                    <form
                      method="POST"
                      action="?/delete"
                      use:enhance={({ cancel }) => {
                        if (!confirm(`Delete ${area.name}? Switching it off keeps it for later.`)) cancel();
                      }}
                    >
                      <input type="hidden" name="id" value={area.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        <Icon name="trash" size={16} label="Delete {area.name}" />
                      </Button>
                    </form>
                  </div>
                </td>
              {/if}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
