<!-- src/routes/admin/tenants/[id]/+page.svelte -->
<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte";
  import { enhance } from "$app/forms";
  import { ArrowLeft, Crown, Users, BrushCleaning, Trash2 } from "lucide-svelte";

  export let data;
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
</script>

<svelte:head>
  <title>{data.tenant.name} | Tenants | BrightBroom Admin</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <!-- Header -->
  <div class="flex items-center gap-4">
    <a
      href="/admin/tenants"
      class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
    >
      <ArrowLeft class="h-5 w-5" />
    </a>
    <div class="flex-1">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {data.tenant.name}
        {#if data.tenant.isPlatformOwner}
          <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
            <Crown class="h-3 w-3 mr-1" /> Platform Owner
          </span>
        {/if}
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        /{data.tenant.slug}
      </p>
    </div>
  </div>

  {#if form?.success}
    <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
      <p class="text-sm text-green-800 dark:text-green-400">{form.message}</p>
    </div>
  {/if}

  <!-- Stats -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Users class="h-5 w-5 text-primary" />
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Members</p>
          <p class="text-xl font-semibold text-gray-900 dark:text-white">
            {data.members.length}
          </p>
        </div>
      </div>
    </div>
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <BrushCleaning class="h-5 w-5 text-primary" />
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Cleaners</p>
          <p class="text-xl font-semibold text-gray-900 dark:text-white">
            {data.cleanerCount}
          </p>
        </div>
      </div>
    </div>
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <span class="text-primary font-bold text-sm">%</span>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Commission</p>
          <p class="text-xl font-semibold text-gray-900 dark:text-white">
            {Number(data.tenant.commissionRate)}%
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Edit Form -->
  <form
    method="POST"
    action="?/update"
    use:enhance
    class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-6"
  >
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Details</h2>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Company Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={data.tenant.name}
          required
          class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:text-white sm:text-sm"
        />
      </div>
      <div>
        <label for="contactEmail" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Contact Email
        </label>
        <input
          type="email"
          id="contactEmail"
          name="contactEmail"
          value={data.tenant.contactEmail || ""}
          class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:text-white sm:text-sm"
        />
      </div>
      <div>
        <label for="contactPhone" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Contact Phone
        </label>
        <input
          type="tel"
          id="contactPhone"
          name="contactPhone"
          value={data.tenant.contactPhone || ""}
          class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:text-white sm:text-sm"
        />
      </div>
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
            <option value={province} selected={data.tenant.province === province}>
              {province}
            </option>
          {/each}
        </select>
      </div>
      <div>
        <label for="commissionRate" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Commission Rate (%)
        </label>
        <input
          type="number"
          id="commissionRate"
          name="commissionRate"
          value={data.tenant.commissionRate}
          min="0"
          max="50"
          step="0.5"
          class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:text-white sm:text-sm"
        />
      </div>
    </div>

    <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
      <Button type="submit" variant="primary">Save Changes</Button>
    </div>
  </form>

  <!-- Members -->
  <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      Team Members
    </h2>

    {#if data.members.length === 0}
      <p class="text-gray-500 dark:text-gray-400 text-sm">No team members yet.</p>
    {:else}
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        {#each data.members as { member, user }}
          <div class="py-3 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
            <div class="flex items-center gap-3">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {member.role}
              </span>
              {#if member.role !== "OWNER"}
                <form method="POST" action="?/removeMember">
                  <input type="hidden" name="userId" value={user.id} />
                  <button
                    type="submit"
                    class="text-red-400 hover:text-red-600"
                    title="Remove member"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </form>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
