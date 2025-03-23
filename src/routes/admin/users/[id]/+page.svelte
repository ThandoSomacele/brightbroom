<!-- src/routes/admin/users/[id]/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import Button from "$lib/components/ui/Button.svelte";
  import {
    BookOpen,
    Calendar,
    ChevronLeft,
    Clock,
    Home,
    Mail,
    Phone,
    User,
    Wallet,
  } from "lucide-svelte";

  export let data;
  export let form;

  const { user, addresses, bookings, stats, recentActivity } = data;

  let isEditMode = false;
  let isUpdateLoading = false;

  // Form values for editing
  let editFirstName = user.firstName;
  let editLastName = user.lastName;
  let editPhone = user.phone || "";
  let editRole = user.role;

  // Format date function
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Format time for recent activity
  function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  }

  // Get status badge class
  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  }

  // Format currency
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  }

  // Get activity icon
  function getActivityIcon(type: string) {
    switch (type) {
      case "BOOKING":
        return BookOpen;
      case "PROFILE":
        return User;
      case "ADDRESS":
        return Home;
      default:
        return Clock;
    }
  }

  // Toggle edit mode
  function toggleEditMode() {
    isEditMode = !isEditMode;

    // Reset form values when toggling edit mode
    if (isEditMode) {
      editFirstName = user.firstName;
      editLastName = user.lastName;
      editPhone = user.phone || "";
      editRole = user.role;
    }
  }

  // Navigate to user's bookings
  function viewAllBookings() {
    window.location.href = `/admin/bookings?search=${user.email}`;
  }
</script>

<svelte:head>
  <title>User Details | BrightBroom Admin</title>
</svelte:head>

<!-- Page header with back button -->
<div class="mb-6 flex items-center">
  <a
    href="/admin/users"
    class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mr-3"
  >
    <ChevronLeft size={20} />
  </a>
  <h1 class="text-2xl font-bold text-gray-900 dark:text-white">User Details</h1>
</div>

<!-- Success/Error messages -->
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

<!-- Main grid -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <!-- User profile card -->
  <div class="lg:col-span-1">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {#if isEditMode}
        <form
          method="POST"
          action="?/updateUser"
          use:enhance={() => {
            isUpdateLoading = true;

            return async ({ result, update }) => {
              isUpdateLoading = false;

              if (result.type === "success") {
                isEditMode = false;
              }

              await update();
            };
          }}
        >
          <div class="mb-6 text-center">
            <div
              class="inline-flex h-24 w-24 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 mb-3"
            >
              <User size={36} class="text-gray-500 dark:text-gray-400" />
            </div>

            <div class="space-y-4">
              <div>
                <label
                  for="firstName"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >First Name</label
                >
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  bind:value={editFirstName}
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label
                  for="lastName"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Last Name</label
                >
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  bind:value={editLastName}
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label
                  for="phone"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Phone Number</label
                >
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  bind:value={editPhone}
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label
                  for="role"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Role</label
                >
                <select
                  id="role"
                  name="role"
                  required
                  bind:value={editRole}
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="CLEANER">Cleaner</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
            </div>
          </div>

          <div class="flex justify-end space-x-3">
            <Button type="button" variant="outline" on:click={toggleEditMode}>
              Cancel
            </Button>

            <Button type="submit" variant="primary" disabled={isUpdateLoading}>
              {#if isUpdateLoading}
                <svg
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              {:else}
                Save Changes
              {/if}
            </Button>
          </div>
        </form>
      {:else}
        <div class="mb-6 text-center">
          <div
            class="inline-flex h-24 w-24 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 mb-3"
          >
            <User size={36} class="text-gray-500 dark:text-gray-400" />
          </div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">
            {user.firstName}
            {user.lastName}
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">{user.role}</p>
        </div>

        <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <ul class="space-y-3">
            <li class="flex items-center">
              <Mail class="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
              <span class="text-gray-900 dark:text-white">{user.email}</span>
            </li>

            {#if user.phone}
              <li class="flex items-center">
                <Phone class="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
                <span class="text-gray-900 dark:text-white">{user.phone}</span>
              </li>
            {/if}

            <li class="flex items-center">
              <Calendar class="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
              <span class="text-gray-900 dark:text-white"
                >Joined {formatDate(stats.memberSince)}</span
              >
            </li>
          </ul>
        </div>

        <div class="mt-6">
          <Button variant="outline" class="w-full" on:click={toggleEditMode}>
            Edit User
          </Button>
        </div>
      {/if}
    </div>

    <!-- User stats card -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        User Stats
      </h3>

      <div class="grid grid-cols-2 gap-4">
        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div class="flex items-center justify-center mb-2">
            <BookOpen class="w-6 h-6 text-primary" />
          </div>
          <p
            class="text-lg font-bold text-center text-gray-900 dark:text-white"
          >
            {stats.totalBookings}
          </p>
          <p class="text-xs text-center text-gray-500 dark:text-gray-400">
            Total Bookings
          </p>
        </div>

        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div class="flex items-center justify-center mb-2">
            <Wallet class="w-6 h-6 text-green-500" />
          </div>
          <p
            class="text-lg font-bold text-center text-gray-900 dark:text-white"
          >
            {formatCurrency(stats.totalSpent)}
          </p>
          <p class="text-xs text-center text-gray-500 dark:text-gray-400">
            Total Spent
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Main content area -->
  <div class="lg:col-span-2 space-y-6">
    <!-- Addresses -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Addresses
        </h3>
      </div>

      {#if addresses.length === 0}
        <p class="text-gray-500 dark:text-gray-400 py-4 text-center">
          No addresses found
        </p>
      {:else}
        <div class="space-y-4">
          {#each addresses as address}
            <div
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div class="flex items-start">
                <Home
                  class="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 mr-3"
                />
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {address.street}
                    {#if address.aptUnit}
                      , Unit {address.aptUnit}
                    {/if}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {address.city}, {address.state}
                    {address.zipCode}
                  </p>

                  {#if address.isDefault}
                    <span
                      class="inline-flex mt-2 items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900/20 dark:text-primary-300"
                    >
                      Default
                    </span>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Recent Bookings -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Bookings
        </h3>
        <Button variant="outline" size="sm" on:click={viewAllBookings}>
          View All
        </Button>
      </div>

      {#if bookings.length === 0}
        <p class="text-gray-500 dark:text-gray-400 py-4 text-center">
          No bookings found
        </p>
      {:else}
        <div class="overflow-x-auto">
          <table
            class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
          >
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  scope="col"
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  ID
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody
              class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
            >
              {#each bookings as booking}
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td
                    class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
                  >
                    <a
                      href={`/admin/bookings/${booking.id}`}
                      class="text-primary hover:underline"
                    >
                      {booking.id.substring(0, 8)}...
                    </a>
                  </td>
                  <td
                    class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                  >
                    {formatDate(booking.scheduledDate)}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <span
                      class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td
                    class="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white"
                  >
                    {formatCurrency(parseFloat(booking.price))}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

    <!-- Recent Activity -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Activity
      </h3>

      {#if recentActivity.length === 0}
        <p class="text-gray-500 dark:text-gray-400 py-4 text-center">
          No recent activity
        </p>
      {:else}
        <div class="space-y-4">
          {#each recentActivity as activity}
            <div class="flex items-start">
              <div
                class="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center"
              >
                <svelte:component
                  this={getActivityIcon(activity.type)}
                  class="w-4 h-4 text-primary"
                />
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.action}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {formatRelativeTime(activity.date)}
                </p>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
