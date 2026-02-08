<!-- src/routes/admin/tenants/new/+page.svelte -->
<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte";
  import { enhance } from "$app/forms";
  import { ArrowLeft } from "lucide-svelte";

  export let form;

  const provinces = [
    "Eastern Cape",
    "Free State",
    "Gauteng",
    "KwaZulu-Natal",
    "Limpopo",
    "Mpumalanga",
    "North West",
    "Northern Cape",
    "Western Cape",
  ];

  // Auto-generate slug from name
  let name = form?.values?.name || "";
  let slug = form?.values?.slug || "";
  let autoSlug = true;

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  function handleNameInput(e: Event) {
    const target = e.target as HTMLInputElement;
    name = target.value;
    if (autoSlug) {
      slug = generateSlug(name);
    }
  }

  function handleSlugInput() {
    autoSlug = false;
  }
</script>

<svelte:head>
  <title>Add Tenant | BrightBroom Admin</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
  <!-- Header -->
  <div class="flex items-center gap-4">
    <a
      href="/admin/tenants"
      class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
    >
      <ArrowLeft class="h-5 w-5" />
    </a>
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Add New Tenant
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Register a new cleaning company on the marketplace
      </p>
    </div>
  </div>

  <!-- Form -->
  <form method="POST" use:enhance class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-6">
    <!-- Company Name -->
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Company Name *
      </label>
      <input
        type="text"
        id="name"
        name="name"
        value={name}
        on:input={handleNameInput}
        required
        class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:text-white sm:text-sm"
        class:border-red-500={form?.errors?.name}
      />
      {#if form?.errors?.name}
        <p class="mt-1 text-sm text-red-600">{form.errors.name}</p>
      {/if}
    </div>

    <!-- Slug -->
    <div>
      <label for="slug" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        URL Slug *
      </label>
      <input
        type="text"
        id="slug"
        name="slug"
        bind:value={slug}
        on:input={handleSlugInput}
        required
        pattern="[a-z0-9-]+"
        class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:text-white sm:text-sm"
        class:border-red-500={form?.errors?.slug}
      />
      <p class="mt-1 text-xs text-gray-500">Lowercase letters, numbers, and hyphens only</p>
      {#if form?.errors?.slug}
        <p class="mt-1 text-sm text-red-600">{form.errors.slug}</p>
      {/if}
    </div>

    <!-- Contact Email -->
    <div>
      <label for="contactEmail" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Contact Email *
      </label>
      <input
        type="email"
        id="contactEmail"
        name="contactEmail"
        value={form?.values?.contactEmail || ""}
        required
        class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:text-white sm:text-sm"
        class:border-red-500={form?.errors?.contactEmail}
      />
      {#if form?.errors?.contactEmail}
        <p class="mt-1 text-sm text-red-600">{form.errors.contactEmail}</p>
      {/if}
    </div>

    <!-- Contact Phone -->
    <div>
      <label for="contactPhone" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Contact Phone
      </label>
      <input
        type="tel"
        id="contactPhone"
        name="contactPhone"
        value={form?.values?.contactPhone || ""}
        class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:text-white sm:text-sm"
      />
    </div>

    <!-- Province -->
    <div>
      <label for="province" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Province
      </label>
      <select
        id="province"
        name="province"
        class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:text-white sm:text-sm"
      >
        <option value="">Select province</option>
        {#each provinces as province}
          <option value={province} selected={form?.values?.province === province}>
            {province}
          </option>
        {/each}
      </select>
    </div>

    <!-- Commission Rate -->
    <div>
      <label for="commissionRate" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Platform Commission Rate (%)
      </label>
      <input
        type="number"
        id="commissionRate"
        name="commissionRate"
        value={form?.values?.commissionRate || "15.00"}
        min="0"
        max="50"
        step="0.5"
        class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:text-white sm:text-sm"
      />
      <p class="mt-1 text-xs text-gray-500">Percentage of net amount (after payment gateway fees)</p>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
      <a href="/admin/tenants">
        <Button variant="outline">Cancel</Button>
      </a>
      <Button type="submit" variant="primary">Create Tenant</Button>
    </div>
  </form>
</div>
