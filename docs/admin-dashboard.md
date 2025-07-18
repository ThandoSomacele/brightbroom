# Admin Dashboard

The BrightBroom admin dashboard provides comprehensive management capabilities for administrators to oversee the entire cleaning service platform.

## Dashboard Overview

The admin dashboard is designed with the following key principles:

- **Role-Based Access**: Only users with the `ADMIN` role can access
- **Comprehensive Management**: All aspects of the platform can be managed
- **Data Visualization**: Key metrics displayed with charts and graphs
- **Responsive Design**: Fully functional on both desktop and mobile devices
- **Efficient Workflows**: Optimised for common administration tasks

## Core Features

### 1. Main Dashboard

The main dashboard provides an at-a-glance overview of the platform's status:

- **Key Metrics**:

  - Total bookings (daily, weekly, monthly)
  - Revenue (daily, weekly, monthly)
  - Active cleaners
  - Customer satisfaction rating
  - Pending bookings requiring attention

- **Charts and Graphs**:

  - Booking volume trends
  - Revenue trends
  - Service type distribution
  - Geographic distribution of bookings

- **Recent Activity**:
  - Latest bookings
  - Recent customer signups
  - Latest reviews

**Implementation:**

```svelte
<!-- src/routes/admin/dashboard/+page.svelte -->
<script lang="ts">
  import { BarChart, LineChart, PieChart } from 'lucide-svelte';
  import MetricCard from '$lib/components/admin/MetricCard.svelte';
  import BookingChart from '$lib/components/admin/BookingChart.svelte';
  import RevenueChart from '$lib/components/admin/RevenueChart.svelte';
  import ActivityFeed from '$lib/components/admin/ActivityFeed.svelte';

  export let data;
  const { metrics, bookingTrends, revenueTrends, recentActivity } = data;
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
  <MetricCard
    title="Total Bookings"
    value={metrics.totalBookings}
    trend={metrics.bookingTrend}
    icon={BarChart}
  />
  <!-- More metric cards -->
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
  <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
    <h3 class="text-lg font-medium mb-4">Booking Trends</h3>
    <BookingChart data={bookingTrends} />
  </div>
  <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
    <h3 class="text-lg font-medium mb-4">Revenue</h3>
    <RevenueChart data={revenueTrends} />
  </div>
</div>

<div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
  <h3 class="text-lg font-medium mb-4">Recent Activity</h3>
  <ActivityFeed activities={recentActivity} />
</div>
```

```typescript
// src/routes/admin/dashboard/+page.server.ts
import type { PageServerLoad } from "./$types";
import { prisma } from "$lib/server/prisma";
import { error, redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();

  if (!session) {
    throw redirect(302, "/auth/login");
  }

  if (session.user.role !== "ADMIN") {
    throw error(403, "Unauthorized");
  }

  // Get metrics data
  const totalBookings = await prisma.booking.count();
  const totalRevenue = await prisma.payment.aggregate({
    _sum: { amount: true },
  });
  const activeCleaners = await prisma.user.count({
    where: { role: "CLEANER" },
  });
  const pendingBookings = await prisma.booking.count({
    where: { status: "PENDING" },
  });

  // Get booking trends data
  const bookingTrends = await getBookingTrends();

  // Get revenue trends data
  const revenueTrends = await getRevenueTrends();

  // Get recent activity
  const recentActivity = await getRecentActivity();

  return {
    metrics: {
      totalBookings,
      totalRevenue: totalRevenue._sum.amount || 0,
      activeCleaners,
      pendingBookings,
      bookingTrend: 5.2, // Percentage increase, would be calculated in real app
    },
    bookingTrends,
    revenueTrends,
    recentActivity,
  };
};

// Helper functions for data fetching
async function getBookingTrends() {
  // Implementation to get booking trend data
}

async function getRevenueTrends() {
  // Implementation to get revenue trend data
}

async function getRecentActivity() {
  // Implementation to get recent activity
}
```

### 2. Booking Management

The booking management section allows administrators to:

- View all bookings with filtering options
- See booking details including customer and cleaner information
- Change booking status (confirm, cancel, etc.)
- Assign cleaners to bookings
- Handle special requests and issues
- Generate booking reports

**Implementation:**

```svelte
<!-- src/routes/admin/bookings/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import BookingTable from '$lib/components/admin/BookingTable.svelte';
  import BookingFilter from '$lib/components/admin/BookingFilter.svelte';
  import BookingModal from '$lib/components/admin/BookingModal.svelte';

  export let data;
  let { bookings, cleaners } = data;

  let filteredBookings = bookings;
  let selectedBooking = null;
  let showModal = false;

  function handleFilter(filterParams) {
    // Apply filters to bookings
  }

  function viewBookingDetails(booking) {
    selectedBooking = booking;
    showModal = true;
  }

  function assignCleaner(bookingId, cleanerId) {
    // API call to assign cleaner
  }

  function updateBookingStatus(bookingId, status) {
    // API call to update status
  }
</script>

<div class="mb-6">
  <h2 class="text-2xl font-bold mb-4">Booking Management</h2>
  <BookingFilter onFilter={handleFilter} />
</div>

<BookingTable
  bookings={filteredBookings}
  onViewDetails={viewBookingDetails}
  onAssignCleaner={assignCleaner}
  onUpdateStatus={updateBookingStatus}
/>

{#if showModal && selectedBooking}
  <BookingModal
    booking={selectedBooking}
    cleaners={cleaners}
    onClose={() => showModal = false}
    onAssignCleaner={assignCleaner}
    onUpdateStatus={updateBookingStatus}
  />
{/if}
```

### 3. Cleaner Management

The cleaner management section allows administrators to:

- View all cleaners and their details
- Add new cleaners to the platform
- Edit cleaner information and credentials
- Set cleaner availability and service areas
- Monitor cleaner performance metrics
- Handle cleaner onboarding and offboarding

**Implementation:**

```svelte
<!-- src/routes/admin/cleaners/+page.svelte -->
<script lang="ts">
  import CleanerTable from '$lib/components/admin/CleanerTable.svelte';
  import CleanerForm from '$lib/components/admin/CleanerForm.svelte';
  import CleanerModal from '$lib/components/admin/CleanerModal.svelte';

  export let data;
  let { cleaners } = data;

  let showAddForm = false;
  let selectedCleaner = null;
  let showModal = false;

  function addCleaner(cleanerData) {
    // API call to add cleaner
  }

  function viewCleanerDetails(cleaner) {
    selectedCleaner = cleaner;
    showModal = true;
  }

  function updateCleaner(id, cleanerData) {
    // API call to update cleaner
  }

  function deactivateCleaner(id) {
    // API call to deactivate cleaner
  }
</script>

<div class="mb-6 flex justify-between items-center">
  <h2 class="text-2xl font-bold">Cleaner Management</h2>
  <button
    class="bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-md"
    on:click={() => showAddForm = true}
  >
    Add New Cleaner
  </button>
</div>

<CleanerTable
  cleaners={cleaners}
  onViewDetails={viewCleanerDetails}
  onDeactivate={deactivateCleaner}
/>

{#if showAddForm}
  <CleanerForm
    onSubmit={addCleaner}
    onCancel={() => showAddForm = false}
  />
{/if}

{#if showModal && selectedCleaner}
  <CleanerModal
    cleaner={selectedCleaner}
    onClose={() => showModal = false}
    onUpdate={updateCleaner}
    onDeactivate={deactivateCleaner}
  />
{/if}
```

### 4. User Management

The user management section allows administrators to:

- View all customers and their information
- Search and filter users
- Review user booking history
- Handle user account issues
- Manage user roles and permissions
- Assist with password resets and account recovery

**Implementation:**

```svelte
<!-- src/routes/admin/users/+page.svelte -->
<script lang="ts">
  import UserTable from '$lib/components/admin/UserTable.svelte';
  import UserSearch from '$lib/components/admin/UserSearch.svelte';
  import UserModal from '$lib/components/admin/UserModal.svelte';

  export let data;
  let { users } = data;

  let filteredUsers = users;
  let selectedUser = null;
  let showModal = false;

  function handleSearch(searchParams) {
    // Filter users based on search
  }

  function viewUserDetails(user) {
    selectedUser = user;
    showModal = true;
  }

  function updateUser(id, userData) {
    // API call to update user
  }
</script>

<div class="mb-6">
  <h2 class="text-2xl font-bold mb-4">User Management</h2>
  <UserSearch onSearch={handleSearch} />
</div>

<UserTable
  users={filteredUsers}
  onViewDetails={viewUserDetails}
/>

{#if showModal && selectedUser}
  <UserModal
    user={selectedUser}
    onClose={() => showModal = false}
    onUpdate={updateUser}
  />
{/if}
```

### 5. Service Management

The service management section allows administrators to:

- Manage available cleaning services
- Set and update pricing
- Define service durations and details
- Create special offers and promotions
- Configure service availability by location

**Implementation:**

```svelte
<!-- src/routes/admin/services/+page.svelte -->
<script lang="ts">
  import ServiceTable from '$lib/components/admin/ServiceTable.svelte';
  import ServiceForm from '$lib/components/admin/ServiceForm.svelte';
  import ServiceModal from '$lib/components/admin/ServiceModal.svelte';

  export let data;
  let { services } = data;

  let showAddForm = false;
  let selectedService = null;
  let showModal = false;

  function addService(serviceData) {
    // API call to add service
  }

  function viewServiceDetails(service) {
    selectedService = service;
    showModal = true;
  }

  function updateService(id, serviceData) {
    // API call to update service
  }
</script>

<div class="mb-6 flex justify-between items-center">
  <h2 class="text-2xl font-bold">Service Management</h2>
  <button
    class="bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-md"
    on:click={() => showAddForm = true}
  >
    Add New Service
  </button>
</div>

<ServiceTable
  services={services}
  onViewDetails={viewServiceDetails}
/>

{#if showAddForm}
  <ServiceForm
    onSubmit={addService}
    onCancel={() => showAddForm = false}
  />
{/if}

{#if showModal && selectedService}
  <ServiceModal
    service={selectedService}
    onClose={() => showModal = false}
    onUpdate={updateService}
  />
{/if}
```

### 6. Reports

The reports section provides detailed analytics and data exports:

- Financial reports (revenue, transaction history)
- Booking reports (volume, trends, completion rates)
- Cleaner performance reports
- Customer satisfaction metrics
- Exportable data in CSV or PDF formats

**Implementation:**

```svelte
<!-- src/routes/admin/reports/+page.svelte -->
<script lang="ts">
  import ReportGenerator from '$lib/components/admin/ReportGenerator.svelte';
  import ReportChart from '$lib/components/admin/ReportChart.svelte';
  import DownloadButton from '$lib/components/ui/DownloadButton.svelte';

  export let data;

  let reportType = 'financial';
  let dateRange = { start: '', end: '' };
  let reportData = null;

  async function generateReport() {
    // API call to generate report based on criteria
    const response = await fetch('/api/admin/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: reportType,
        dateRange
      })
    });

    reportData = await response.json();
  }

  function downloadReport(format) {
    // Handle report download in specified format
  }
</script>

<div class="mb-6">
  <h2 class="text-2xl font-bold mb-4">Reports</h2>
</div>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div class="lg:col-span-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
    <ReportGenerator
      onGenerate={generateReport}
      bind:reportType
      bind:dateRange
    />

    {#if reportData}
      <div class="mt-4">
        <DownloadButton
          onDownload={() => downloadReport('csv')}
          format="CSV"
        />
        <DownloadButton
          onDownload={() => downloadReport('pdf')}
          format="PDF"
        />
      </div>
    {/if}
  </div>

  <div class="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
    {#if reportData}
      <ReportChart data={reportData} type={reportType} />
    {:else}
      <p class="text-center text-gray-500 py-12">
        Select report criteria and click "Generate Report" to see data
      </p>
    {/if}
  </div>
</div>
```

## Admin Layout and Navigation

The admin dashboard uses a consistent layout with side navigation:

```svelte
<!-- src/routes/admin/+layout.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import {
    Home,
    Calendar,
    Users,
    User,
    Settings,
    BarChart,
    Menu,
    X
  } from 'lucide-svelte';

  let showMobileMenu = false;

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
    { label: 'Bookings', href: '/admin/bookings', icon: Calendar },
    { label: 'Cleaners', href: '/admin/cleaners', icon: Users },
    { label: 'Users', href: '/admin/users', icon: User },
    { label: 'Services', href: '/admin/services', icon: Settings },
    { label: 'Reports', href: '/admin/reports', icon: BarChart },
  ];

  function isActive(href: string) {
    return $page.url.pathname === href;
  }
</script>

<div class="min-h-screen bg-gray-100 dark:bg-gray-900">
  <!-- Mobile header -->
  <div class="lg:hidden bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center">
    <div class="flex items-center">
      <img src="/logo.svg" alt="BrightBroom" class="h-8 w-auto" />
      <span class="ml-2 font-semibold text-gray-900 dark:text-white">Admin</span>
    </div>
    <button on:click={() => showMobileMenu = !showMobileMenu}>
      {#if showMobileMenu}
        <X />
      {:else}
        <Menu />
      {/if}
    </button>
  </div>

  <div class="flex">
    <!-- Sidebar navigation -->
    <aside class={`
      bg-white dark:bg-gray-800 shadow
      ${showMobileMenu ? 'block' : 'hidden'}
      lg:block lg:w-64 lg:fixed lg:inset-y-0 overflow-y-auto
    `}>
      <div class="p-4 hidden lg:flex items-center">
        <img src="/logo.svg" alt="BrightBroom" class="h-8 w-auto" />
        <span class="ml-2 font-semibold text-gray-900 dark:text-white">Admin Dashboard</span>
      </div>

      <nav class="mt-4 px-2 space-y-1">
        {#each navItems as item}
          <a
            href={item.href}
            class={`
              flex items-center px-4 py-2 rounded-md text-sm font-medium
              ${isActive(item.href)
                ? 'bg-primary-500 text-white'
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}
            `}
          >
            <svelte:component this={item.icon} class="mr-3 h-5 w-5" />
            {item.label}
          </a>
        {/each}
      </nav>
    </aside>

    <!-- Main content -->
    <main class="lg:ml-64 flex-1">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <slot />
      </div>
    </main>
  </div>
</div>
```

## Access Control

The admin dashboard is protected with proper authentication and authorization:

```typescript
// src/routes/admin/+layout.server.ts
import type { LayoutServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";

export const load: LayoutServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();

  if (!session) {
    throw redirect(302, "/auth/login");
  }

  if (session.user.role !== "ADMIN") {
    throw redirect(302, "/");
  }

  return {
    user: session.user,
  };
};
```

## Server-Side API Routes

The admin dashboard requires various API endpoints for data management:

```typescript
// src/routes/api/admin/users/+server.ts
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/prisma";

export const GET: RequestHandler = async ({ url, locals }) => {
  const session = await locals.auth.validate();

  if (!session || session.user.role !== "ADMIN") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const search = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ],
    },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.user.count({
    where: {
      OR: [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ],
    },
  });

  return json({
    users,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      page,
      limit,
    },
  });
};
```

Similar API endpoints would be implemented for other admin functions like booking management, cleaner management, etc.
