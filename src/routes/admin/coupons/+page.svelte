<!-- src/routes/admin/coupons/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import Button from "$lib/components/ui/Button.svelte";
  import {
    Edit,
    PlusCircle,
    Search,
    Trash2,
    Tag,
    Percent,
    DollarSign,
    Calendar,
    Users,
    RefreshCw,
    ToggleLeft,
    ToggleRight,
    ExternalLink,
  } from "lucide-svelte";

  let { data, form } = $props();

  // Local state
  let showAddModal = $state(false);
  let showEditModal = $state(false);
  let showDeleteModal = $state(false);
  let selectedCoupon: any = $state(null);
  let searchTerm = $state("");
  let isLoading = $state(false);
  let filterStatus = $state<"all" | "active" | "inactive">("all");

  // Form state for add modal
  let newCouponCode = $state("");

  // Format price as currency
  function formatPrice(price: number | string) {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(Number(price));
  }

  // Format date for display
  function formatDate(date: Date | string | null) {
    if (!date) return "No expiry";
    const d = new Date(date);
    return d.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Format date for input
  function formatDateInput(date: Date | string | null) {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  }

  // Check if coupon is expired
  function isExpired(validUntil: Date | string | null): boolean {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  }

  // Modal management
  function openAddModal() {
    newCouponCode = "";
    showAddModal = true;
    showEditModal = false;
    showDeleteModal = false;
  }

  function openEditModal(coupon: any) {
    selectedCoupon = coupon;
    showEditModal = true;
    showAddModal = false;
    showDeleteModal = false;
  }

  function openDeleteModal(coupon: any) {
    selectedCoupon = coupon;
    showDeleteModal = true;
    showAddModal = false;
    showEditModal = false;
  }

  function closeAllModals() {
    showAddModal = false;
    showEditModal = false;
    showDeleteModal = false;
    selectedCoupon = null;
  }

  // Close modals when Escape key is pressed
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      closeAllModals();
    }
  }

  // Generate random coupon code
  async function generateCode(prefix: string = "") {
    const formData = new FormData();
    formData.set("prefix", prefix);

    const response = await fetch("?/generateCode", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (result.data?.[1]?.code) {
      newCouponCode = result.data[1].code;
    }
  }
</script>

<svelte:head>
  <title>Manage Coupons | BrightBroom Admin</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<!-- Page header -->
<div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
  <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Coupons</h1>
  <div class="mt-4 sm:mt-0">
    <Button variant="primary" onclick={openAddModal}>
      <PlusCircle size={16} class="mr-2" />
      Add New Coupon
    </Button>
  </div>
</div>

<!-- Success or Error messages -->
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

<!-- Search and filter -->
<div class="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
  <div class="flex flex-col sm:flex-row gap-4">
    <div class="relative flex-1">
      <div
        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
      >
        <Search size={16} class="text-gray-400" />
      </div>
      <input
        type="text"
        bind:value={searchTerm}
        placeholder="Search coupons..."
        class="pl-10 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
    </div>
    <div class="flex gap-2">
      <button
        class="px-4 py-2 rounded-md transition-colors {filterStatus === 'all'
          ? 'bg-primary text-white'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}"
        onclick={() => (filterStatus = "all")}
      >
        All
      </button>
      <button
        class="px-4 py-2 rounded-md transition-colors {filterStatus === 'active'
          ? 'bg-primary text-white'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}"
        onclick={() => (filterStatus = "active")}
      >
        Active
      </button>
      <button
        class="px-4 py-2 rounded-md transition-colors {filterStatus === 'inactive'
          ? 'bg-primary text-white'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}"
        onclick={() => (filterStatus = "inactive")}
      >
        Inactive
      </button>
    </div>
  </div>
</div>

<!-- Coupons list with streaming -->
{#await data.streamed.coupons}
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    <div class="divide-y divide-gray-200 dark:divide-gray-700">
      {#each Array(5) as _}
        <div class="p-6 animate-pulse">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div class="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div class="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      {/each}
    </div>
  </div>
{:then coupons}
  {@const filteredCoupons = coupons.filter((c: any) => {
    const matchesSearch = searchTerm
      ? c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "active"
          ? c.isActive
          : !c.isActive;
    return matchesSearch && matchesStatus;
  })}

  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    {#if filteredCoupons.length === 0}
      <div class="p-6 text-center text-gray-500 dark:text-gray-400">
        {searchTerm || filterStatus !== "all"
          ? "No coupons found matching your criteria."
          : "No coupons available. Create one to get started."}
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >Code</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >Discount</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >Min. Amount</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >Usage</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >Valid Until</th
              >
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >Status</th
              >
              <th
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >Actions</th
              >
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each filteredCoupons as coupon (coupon.id)}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <Tag size={16} class="text-primary mr-2" />
                    <div>
                      <div
                        class="font-mono font-bold text-gray-900 dark:text-white"
                      >
                        {coupon.code}
                      </div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        {coupon.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    {#if coupon.discountType === "PERCENTAGE"}
                      <Percent size={14} class="text-green-500 mr-1" />
                      <span class="text-green-600 dark:text-green-400 font-semibold"
                        >{parseFloat(coupon.discountValue)}%</span
                      >
                    {:else}
                      <DollarSign size={14} class="text-green-500 mr-1" />
                      <span class="text-green-600 dark:text-green-400 font-semibold"
                        >{formatPrice(coupon.discountValue)}</span
                      >
                    {/if}
                  </div>
                  {#if coupon.requiresFirstBooking}
                    <span
                      class="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full"
                    >
                      First booking only
                    </span>
                  {/if}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                  {formatPrice(coupon.minimumBookingAmount)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center text-gray-700 dark:text-gray-300">
                    <Users size={14} class="mr-1" />
                    {coupon.usedCount}
                    {#if coupon.maxUsesTotal}
                      / {coupon.maxUsesTotal}
                    {:else}
                      <span class="text-gray-400"> (unlimited)</span>
                    {/if}
                  </div>
                  {#if coupon.totalDiscountAmount > 0}
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      Total: {formatPrice(coupon.totalDiscountAmount)}
                    </div>
                  {/if}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <Calendar size={14} class="mr-1 text-gray-400" />
                    <span
                      class={isExpired(coupon.validUntil)
                        ? "text-red-500"
                        : "text-gray-700 dark:text-gray-300"}
                    >
                      {formatDate(coupon.validUntil)}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <form
                    method="POST"
                    action="?/toggleActive"
                    use:enhance={() => {
                      return async ({ update }) => {
                        await update();
                      };
                    }}
                  >
                    <input type="hidden" name="id" value={coupon.id} />
                    <input
                      type="hidden"
                      name="isActive"
                      value={String(!coupon.isActive)}
                    />
                    <button
                      type="submit"
                      class="flex items-center gap-1 px-2 py-1 rounded-full transition-colors {coupon.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}"
                    >
                      {#if coupon.isActive}
                        <ToggleRight size={16} />
                        Active
                      {:else}
                        <ToggleLeft size={16} />
                        Inactive
                      {/if}
                    </button>
                  </form>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <div class="flex justify-end gap-2">
                    <a
                      href="/coupon/{coupon.code}"
                      target="_blank"
                      class="p-2 text-gray-600 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400"
                      title="View shareable coupon"
                    >
                      <ExternalLink size={16} />
                    </a>
                    <button
                      class="p-2 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary"
                      onclick={() => openEditModal(coupon)}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      class="p-2 text-gray-600 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                      onclick={() => openDeleteModal(coupon)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
{:catch error}
  <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 text-center">
    <p class="text-red-600 dark:text-red-400">
      Failed to load coupons. Please refresh the page.
    </p>
  </div>
{/await}

<!-- Add coupon modal -->
{#if showAddModal}
  <div
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="flex items-center justify-center min-h-screen p-4 text-center sm:p-0"
    >
      <div
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        aria-hidden="true"
        onclick={closeAllModals}
        onkeydown={(e) => e.key === "Enter" && closeAllModals()}
        role="button"
        tabindex="0"
      ></div>

      <div
        class="inline-block bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full max-h-[90vh] overflow-y-auto"
      >
        <form
          method="POST"
          action="?/create"
          use:enhance={() => {
            isLoading = true;

            return async ({ result, update }) => {
              isLoading = false;

              if (result.type === "success" || result.type === "redirect") {
                closeAllModals();
              }

              await update();
            };
          }}
        >
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3
              class="text-lg font-medium text-gray-900 dark:text-white"
              id="modal-title"
            >
              Add New Coupon
            </h3>
          </div>

          <div class="px-6 py-4">
            <div class="space-y-4">
              <!-- Coupon Code -->
              <div>
                <label
                  for="code"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Coupon Code
                </label>
                <div class="flex gap-2">
                  <input
                    type="text"
                    id="code"
                    name="code"
                    bind:value={newCouponCode}
                    class="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g. FIRST50"
                  />
                  <button
                    type="button"
                    onclick={() => generateCode("")}
                    class="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
                <p class="text-xs text-gray-500 mt-1">
                  Leave empty to auto-generate a code
                </p>
              </div>

              <!-- Name -->
              <div>
                <label
                  for="name"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Name <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g. First Booking Discount"
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
                  rows="2"
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Optional description for this coupon"
                ></textarea>
              </div>

              <!-- Discount Type and Value -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label
                    for="discountType"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Discount Type <span class="text-red-500">*</span>
                  </label>
                  <select
                    id="discountType"
                    name="discountType"
                    required
                    class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (ZAR)</option>
                  </select>
                </div>
                <div>
                  <label
                    for="discountValue"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Discount Value <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="discountValue"
                    name="discountValue"
                    required
                    min="0"
                    step="0.01"
                    class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g. 15 or 50"
                  />
                </div>
              </div>

              <!-- Minimum Booking Amount -->
              <div>
                <label
                  for="minimumBookingAmount"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Minimum Booking Amount (ZAR) <span class="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="minimumBookingAmount"
                  name="minimumBookingAmount"
                  required
                  min="0"
                  step="0.01"
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g. 350"
                />
              </div>

              <!-- First Booking Only -->
              <div class="flex items-center">
                <input
                  type="checkbox"
                  id="requiresFirstBooking"
                  name="requiresFirstBooking"
                  value="true"
                  class="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label
                  for="requiresFirstBooking"
                  class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  Only valid for first-time customers
                </label>
              </div>

              <!-- Max Uses -->
              <div>
                <label
                  for="maxUsesTotal"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Maximum Total Uses
                </label>
                <input
                  type="number"
                  id="maxUsesTotal"
                  name="maxUsesTotal"
                  min="1"
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <!-- Valid Dates -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label
                    for="validFrom"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Valid From <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="validFrom"
                    name="validFrom"
                    required
                    value={new Date().toISOString().split("T")[0]}
                    class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label
                    for="validUntil"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Valid Until
                  </label>
                  <input
                    type="date"
                    id="validUntil"
                    name="validUntil"
                    class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p class="text-xs text-gray-500 mt-1">
                    Leave empty for no expiry
                  </p>
                </div>
              </div>

              <!-- Active Status -->
              <div class="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  value="true"
                  checked
                  class="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label
                  for="isActive"
                  class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  Active (customers can use this coupon)
                </label>
              </div>
            </div>
          </div>

          <div
            class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex flex-row-reverse gap-2"
          >
            <Button type="submit" variant="primary" disabled={isLoading}>
              {#if isLoading}
                <div
                  class="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"
                ></div>
                Creating...
              {:else}
                Create Coupon
              {/if}
            </Button>
            <Button type="button" variant="outline" onclick={closeAllModals}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- Edit coupon modal -->
{#if showEditModal && selectedCoupon}
  <div
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="flex items-center justify-center min-h-screen p-4 text-center sm:p-0"
    >
      <div
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        aria-hidden="true"
        onclick={closeAllModals}
        onkeydown={(e) => e.key === "Enter" && closeAllModals()}
        role="button"
        tabindex="0"
      ></div>

      <div
        class="inline-block bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full max-h-[90vh] overflow-y-auto"
      >
        <form
          method="POST"
          action="?/update"
          use:enhance={() => {
            isLoading = true;

            return async ({ result, update }) => {
              isLoading = false;

              if (result.type === "success" || result.type === "redirect") {
                closeAllModals();
              }

              await update();
            };
          }}
        >
          <input type="hidden" name="id" value={selectedCoupon.id} />

          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3
              class="text-lg font-medium text-gray-900 dark:text-white"
              id="modal-title"
            >
              Edit Coupon
            </h3>
          </div>

          <div class="px-6 py-4">
            <div class="space-y-4">
              <!-- Coupon Code -->
              <div>
                <label
                  for="edit-code"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Coupon Code
                </label>
                <input
                  type="text"
                  id="edit-code"
                  name="code"
                  value={selectedCoupon.code}
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <!-- Name -->
              <div>
                <label
                  for="edit-name"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Name <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  required
                  value={selectedCoupon.name}
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <!-- Description -->
              <div>
                <label
                  for="edit-description"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="edit-description"
                  name="description"
                  rows="2"
                  value={selectedCoupon.description || ""}
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                ></textarea>
              </div>

              <!-- Discount Type and Value -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label
                    for="edit-discountType"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Discount Type <span class="text-red-500">*</span>
                  </label>
                  <select
                    id="edit-discountType"
                    name="discountType"
                    required
                    value={selectedCoupon.discountType}
                    class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (ZAR)</option>
                  </select>
                </div>
                <div>
                  <label
                    for="edit-discountValue"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Discount Value <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="edit-discountValue"
                    name="discountValue"
                    required
                    min="0"
                    step="0.01"
                    value={parseFloat(selectedCoupon.discountValue)}
                    class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <!-- Minimum Booking Amount -->
              <div>
                <label
                  for="edit-minimumBookingAmount"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Minimum Booking Amount (ZAR) <span class="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="edit-minimumBookingAmount"
                  name="minimumBookingAmount"
                  required
                  min="0"
                  step="0.01"
                  value={parseFloat(selectedCoupon.minimumBookingAmount)}
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <!-- First Booking Only -->
              <div class="flex items-center">
                <input
                  type="checkbox"
                  id="edit-requiresFirstBooking"
                  name="requiresFirstBooking"
                  value="true"
                  checked={selectedCoupon.requiresFirstBooking}
                  class="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label
                  for="edit-requiresFirstBooking"
                  class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  Only valid for first-time customers
                </label>
              </div>

              <!-- Max Uses -->
              <div>
                <label
                  for="edit-maxUsesTotal"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Maximum Total Uses
                </label>
                <input
                  type="number"
                  id="edit-maxUsesTotal"
                  name="maxUsesTotal"
                  min="1"
                  value={selectedCoupon.maxUsesTotal || ""}
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Leave empty for unlimited"
                />
                {#if selectedCoupon.usedCount > 0}
                  <p class="text-xs text-gray-500 mt-1">
                    Currently used: {selectedCoupon.usedCount} times
                  </p>
                {/if}
              </div>

              <!-- Valid Dates -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label
                    for="edit-validFrom"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Valid From <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="edit-validFrom"
                    name="validFrom"
                    required
                    value={formatDateInput(selectedCoupon.validFrom)}
                    class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label
                    for="edit-validUntil"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Valid Until
                  </label>
                  <input
                    type="date"
                    id="edit-validUntil"
                    name="validUntil"
                    value={formatDateInput(selectedCoupon.validUntil)}
                    class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <!-- Active Status -->
              <div class="flex items-center">
                <input
                  type="checkbox"
                  id="edit-isActive"
                  name="isActive"
                  value="true"
                  checked={selectedCoupon.isActive}
                  class="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label
                  for="edit-isActive"
                  class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  Active (customers can use this coupon)
                </label>
              </div>
            </div>
          </div>

          <div
            class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex flex-row-reverse gap-2"
          >
            <Button type="submit" variant="primary" disabled={isLoading}>
              {#if isLoading}
                <div
                  class="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"
                ></div>
                Updating...
              {:else}
                Update Coupon
              {/if}
            </Button>
            <Button type="button" variant="outline" onclick={closeAllModals}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- Delete confirmation modal -->
{#if showDeleteModal && selectedCoupon}
  <div
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="flex items-center justify-center min-h-screen p-4 text-center sm:p-0"
    >
      <div
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        aria-hidden="true"
        onclick={closeAllModals}
        onkeydown={(e) => e.key === "Enter" && closeAllModals()}
        role="button"
        tabindex="0"
      ></div>

      <div
        class="inline-block bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full"
      >
        <form
          method="POST"
          action="?/delete"
          use:enhance={() => {
            isLoading = true;

            return async ({ result, update }) => {
              isLoading = false;

              if (result.type === "success" || result.type === "redirect") {
                closeAllModals();
              }

              await update();
            };
          }}
        >
          <input type="hidden" name="id" value={selectedCoupon.id} />

          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3
              class="text-lg font-medium text-gray-900 dark:text-white"
              id="modal-title"
            >
              Confirm Deletion
            </h3>
          </div>

          <div class="px-6 py-4">
            <p class="text-gray-700 dark:text-gray-300">
              Are you sure you want to delete the coupon <span
                class="font-mono font-bold">{selectedCoupon.code}</span
              >?
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
              This will deactivate the coupon. It will no longer be usable but
              historical usage data will be preserved.
            </p>
          </div>

          <div
            class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex flex-row-reverse gap-2"
          >
            <Button
              type="submit"
              variant="primary"
              class="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {#if isLoading}
                <div
                  class="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"
                ></div>
                Deleting...
              {:else}
                Delete Coupon
              {/if}
            </Button>
            <Button type="button" variant="outline" onclick={closeAllModals}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}
