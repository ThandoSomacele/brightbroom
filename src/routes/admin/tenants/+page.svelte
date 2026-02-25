<!-- src/routes/admin/tenants/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/Button.svelte";
  import {
    Building2,
    PlusCircle,
    Users,
    BrushCleaning,
    Crown,
    ToggleLeft,
    ToggleRight,
  } from "lucide-svelte";

  export let data;
</script>

<svelte:head>
  <title>Tenants | BrightBroom Admin</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Tenants</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Manage cleaning companies on the marketplace
      </p>
    </div>
    <a href="/admin/tenants/new">
      <Button variant="primary">
        <PlusCircle class="w-4 h-4 mr-2" />
        Add Tenant
      </Button>
    </a>
  </div>

  <!-- Tenants Table -->
  <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Company
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Province
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Commission
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Members
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Cleaners
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {#each data.tenants as tenant}
            <tr
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
              on:click={() => goto(`/admin/tenants/${tenant.id}`)}
              role="link"
              tabindex="0"
              on:keydown={(e) => e.key === 'Enter' && goto(`/admin/tenants/${tenant.id}`)}
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {#if tenant.isPlatformOwner}
                      <Crown class="h-5 w-5 text-primary" />
                    {:else}
                      <Building2 class="h-5 w-5 text-primary" />
                    {/if}
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {tenant.name}
                      {#if tenant.isPlatformOwner}
                        <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                          Platform
                        </span>
                      {/if}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {tenant.contactEmail || "No email"}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {tenant.province || "Not set"}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {Number(tenant.commissionRate)}%
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Users class="h-4 w-4 mr-1" />
                  {tenant.memberCount}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <BrushCleaning class="h-4 w-4 mr-1" />
                  {tenant.cleanerCount}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {#if tenant.isActive}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Active
                  </span>
                {:else}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    Inactive
                  </span>
                {/if}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <div class="flex items-center gap-2" on:click|stopPropagation>
                  <a
                    href="/admin/tenants/{tenant.id}"
                    class="text-primary hover:text-primary-600 font-medium"
                  >
                    View
                  </a>
                  {#if !tenant.isPlatformOwner}
                    <form method="POST" action="?/toggleActive">
                      <input type="hidden" name="tenantId" value={tenant.id} />
                      <input type="hidden" name="isActive" value={String(tenant.isActive)} />
                      <button
                        type="submit"
                        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title={tenant.isActive ? "Deactivate" : "Activate"}
                      >
                        {#if tenant.isActive}
                          <ToggleRight class="h-5 w-5 text-green-500" />
                        {:else}
                          <ToggleLeft class="h-5 w-5" />
                        {/if}
                      </button>
                    </form>
                  {/if}
                </div>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="7" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                <Building2 class="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p class="text-lg font-medium">No tenants yet</p>
                <p class="mt-1">Add your first cleaning company to get started.</p>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
