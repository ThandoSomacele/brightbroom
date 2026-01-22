<!-- src/routes/cleaner/bookings/[id]/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import Button from "$lib/components/ui/Button.svelte";
  import {
    Calendar,
    ChevronLeft,
    Clock,
    DollarSign,
    MapPin,
    MessageSquare,
    Phone,
    Play,
    User,
  } from "lucide-svelte";

  export let data;
  export let form;

  const { bookingDetails, communications } = data;

  let isSubmittingStatus = false;
  let isSubmittingNote = false;
  let noteContent = "";
  let showAddNote = false;

  // Format date
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-ZA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // Format time
  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Format currency
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  }

  // Get cleaner earnings (85% of booking price after fees)
  function getCleanerEarnings(price: number): number {
    return price * 0.85;
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

  // Check if booking is upcoming (in the future)
  function isUpcoming(dateString: string): boolean {
    const bookingDate = new Date(dateString);
    const now = new Date();
    return bookingDate > now;
  }

  // Calculate time relative to now
  function getRelativeTime(dateString: string): string {
    const bookingDate = new Date(dateString);
    const now = new Date();
    const diffMs = bookingDate.getTime() - now.getTime();

    // If in the past
    if (diffMs < 0) {
      return "Past booking";
    }

    // If today
    if (bookingDate.toDateString() === now.toDateString()) {
      return "Today";
    }

    // If tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (bookingDate.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }

    // Calculate days
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return `In ${diffDays} days`;
    }

    // Otherwise return formatted date
    return formatDate(dateString);
  }

  // Format relative time for communications
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
</script>

<svelte:head>
  <title>Booking Details | BrightBroom Cleaner</title>
</svelte:head>

<div class="space-y-6">
  <!-- Page header with back button -->
  <div class="flex items-center">
    <a
      href="/cleaner/bookings"
      class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mr-3"
    >
      <ChevronLeft size={20} />
    </a>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
      Booking Details
    </h1>
  </div>

  <!-- Form result messages -->
  {#if form?.success}
    <div
      class="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 p-4 rounded-md"
    >
      {form.message}
    </div>
  {:else if form?.error}
    <div
      class="bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 p-4 rounded-md"
    >
      {form.error}
    </div>
  {/if}

  <!-- Status and Actions -->
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between"
  >
    <div>
      <div class="flex items-center">
        <span
          class={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(bookingDetails.booking.status)}`}
        >
          {bookingDetails.booking.status}
        </span>

        {#if isUpcoming(bookingDetails.booking.scheduledDate)}
          <span class="ml-3 text-gray-600 dark:text-gray-400 text-sm">
            {getRelativeTime(bookingDetails.booking.scheduledDate)}
          </span>
        {/if}
      </div>

      <div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Booking ID: {bookingDetails.booking.id.substring(0, 8)}...
      </div>
    </div>

    <div class="mt-4 sm:mt-0 flex gap-2">
      {#if bookingDetails.booking.status === "CONFIRMED" && isUpcoming(bookingDetails.booking.scheduledDate)}
        <form
          method="POST"
          action="?/updateStatus"
          use:enhance={() => {
            isSubmittingStatus = true;

            return async ({ result, update }) => {
              isSubmittingStatus = false;
              await update();
            };
          }}
        >
          <input type="hidden" name="status" value="IN_PROGRESS" />
          <Button type="submit" variant="primary" disabled={isSubmittingStatus}>
            <Play size={16} class="mr-1" />
            Start Job
          </Button>
        </form>
      {/if}

      {#if bookingDetails.booking.status === "IN_PROGRESS"}
        <form
          method="POST"
          action="?/updateStatus"
          use:enhance={() => {
            isSubmittingStatus = true;

            return async ({ result, update }) => {
              isSubmittingStatus = false;
              await update();
            };
          }}
        >
          <input type="hidden" name="status" value="COMPLETED" />
          <Button type="submit" variant="primary" disabled={isSubmittingStatus}>
            Complete Job
          </Button>
        </form>
      {/if}

      <Button variant="outline" on:click={() => (showAddNote = !showAddNote)}>
        <MessageSquare size={16} class="mr-1" />
        Add Note
      </Button>
    </div>
  </div>

  <!-- Add Note Form -->
  {#if showAddNote}
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-primary"
    >
      <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Add a Note
      </h2>

      <form
        method="POST"
        action="?/addNote"
        use:enhance={() => {
          isSubmittingNote = true;

          return async ({ result, update }) => {
            isSubmittingNote = false;
            if (result.type === "success") {
              noteContent = "";
              showAddNote = false;
            }
            await update();
          };
        }}
      >
        <div class="mb-4">
          <textarea
            name="content"
            bind:value={noteContent}
            rows="4"
            placeholder="Enter details about the job, issues encountered, or other important information..."
            class="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent p-2"
            required
          ></textarea>
        </div>

        <div class="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            on:click={() => (showAddNote = false)}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={isSubmittingNote || !noteContent.trim()}
          >
            {#if isSubmittingNote}
              <span class="inline-block animate-pulse">Submitting...</span>
            {:else}
              Submit Note
            {/if}
          </Button>
        </div>
      </form>
    </div>
  {/if}

  <!-- Main content grid -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Left column: Booking details -->
    <div class="lg:col-span-2 space-y-6">
      <!-- Service and location details -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Cleaning Details
        </h2>

        <div class="space-y-4">
          <div class="flex items-start">
            <DollarSign class="h-5 w-5 text-primary mr-3 mt-0.5" />
            <div>
              <p class="font-medium text-gray-700 dark:text-gray-300">
                Earnings from this job
              </p>
              <p class="text-xl font-semibold text-primary mt-1">
                {formatCurrency(
                  getCleanerEarnings(bookingDetails.booking.price),
                )}
              </p>
            </div>
          </div>

          <div class="flex items-start">
            <Calendar class="h-5 w-5 text-primary mr-3 mt-0.5" />
            <div>
              <p class="font-medium text-gray-700 dark:text-gray-300">Date</p>
              <p class="text-gray-900 dark:text-white">
                {formatDate(bookingDetails.booking.scheduledDate)}
              </p>
            </div>
          </div>

          <div class="flex items-start">
            <Clock class="h-5 w-5 text-primary mr-3 mt-0.5" />
            <div>
              <p class="font-medium text-gray-700 dark:text-gray-300">Time</p>
              <p class="text-gray-900 dark:text-white">
                {formatTime(bookingDetails.booking.scheduledDate)}
              </p>
            </div>
          </div>

          <div class="flex items-start">
            <MapPin class="h-5 w-5 text-primary mr-3 mt-0.5" />
            <div>
              <p class="font-medium text-gray-700 dark:text-gray-300">
                Location
              </p>
              <p class="text-gray-900 dark:text-white">
                {bookingDetails.address.street}<br />
                {bookingDetails.address.city}, {bookingDetails.address.state}
                {bookingDetails.address.zipCode}
              </p>
            </div>
          </div>

          <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p class="font-medium text-gray-700 dark:text-gray-300 mb-2">
              Service Type
            </p>
            <p class="text-gray-900 dark:text-white">
              General Clean
            </p>
            <p class="mt-1 text-gray-600 dark:text-gray-400">
              {bookingDetails.booking.bedroomCount} bedroom{bookingDetails.booking.bedroomCount !== 1 ? 's' : ''},
              {bookingDetails.booking.bathroomCount} bathroom{bookingDetails.booking.bathroomCount !== 1 ? 's' : ''}
            </p>
          </div>

          {#if bookingDetails.addons && bookingDetails.addons.length > 0}
            <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p class="font-medium text-gray-700 dark:text-gray-300 mb-2">
                Add-ons
              </p>
              <ul class="space-y-2">
                {#each bookingDetails.addons as bookingAddon}
                  <li class="flex justify-between items-center text-sm">
                    <span class="text-gray-900 dark:text-white">
                      {bookingAddon.addon?.name || 'Unknown add-on'}
                    </span>
                    {#if bookingAddon.durationAtBooking}
                      <span class="text-gray-500 dark:text-gray-400">
                        +{bookingAddon.durationAtBooking} min
                      </span>
                    {/if}
                  </li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if bookingDetails.booking.notes}
            <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p class="font-medium text-gray-700 dark:text-gray-300 mb-2">
                Customer Notes
              </p>
              <div
                class="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md text-gray-700 dark:text-gray-300"
              >
                {bookingDetails.booking.notes}
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Customer details -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Customer Details
        </h2>

        <div class="space-y-4">
          <div class="flex items-start">
            <User class="h-5 w-5 text-primary mr-3 mt-0.5" />
            <div>
              <p class="font-medium text-gray-700 dark:text-gray-300">Name</p>
              <p class="text-gray-900 dark:text-white">
                {bookingDetails.customer.firstName}
                {bookingDetails.customer.lastName}
              </p>
            </div>
          </div>

          {#if bookingDetails.customer.phone}
            <div class="flex items-start">
              <Phone class="h-5 w-5 text-primary mr-3 mt-0.5" />
              <div>
                <p class="font-medium text-gray-700 dark:text-gray-300">
                  Phone
                </p>
                <p class="text-gray-900 dark:text-white">
                  {bookingDetails.customer.phone}
                </p>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Communication Log -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">
            Notes & Communications
          </h2>

          <Button
            variant="outline"
            size="sm"
            on:click={() => (showAddNote = !showAddNote)}
          >
            <MessageSquare size={16} class="mr-1" />
            Add Note
          </Button>
        </div>

        {#if communications.length === 0}
          <p class="text-gray-500 dark:text-gray-400 py-4 text-center">
            No notes or communications yet.
          </p>
        {:else}
          <div class="space-y-4">
            {#each communications as comm}
              <div class="border-l-4 border-primary pl-4 py-2">
                <div class="flex justify-between items-start">
                  <div>
                    <p class="text-gray-900 dark:text-white">{comm.content}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span class="font-medium">{comm.type}</span> &middot; {formatDate(
                        comm.createdAt,
                      )} at {formatTime(comm.createdAt)}
                    </p>
                    {#if comm.sentBy}
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        By: {comm.sentBy}
                      </p>
                    {/if}
                  </div>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {formatRelativeTime(comm.createdAt)}
                  </span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Right column: Status timeline and quick actions -->
    <div class="space-y-6">
      <!-- Booking status timeline -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Booking Timeline
        </h2>

        <div class="space-y-6">
          <div class="flex">
            <div class="mr-3 flex flex-col items-center">
              <div class="bg-green-500 h-4 w-4 rounded-full"></div>
              <div
                class="bg-gray-200 dark:bg-gray-700 flex-grow w-px mt-1"
              ></div>
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                Booking Created
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(bookingDetails.booking.createdAt)}
              </p>
            </div>
          </div>

          <div class="flex">
            <div class="mr-3 flex flex-col items-center">
              <div class="bg-blue-500 h-4 w-4 rounded-full"></div>
              <div
                class="bg-gray-200 dark:bg-gray-700 flex-grow w-px mt-1"
              ></div>
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                Booking Confirmed
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Cleaner assigned
              </p>
            </div>
          </div>

          <div class="flex">
            <div class="mr-3 flex flex-col items-center">
              <div
                class={`h-4 w-4 rounded-full ${bookingDetails.booking.status === "IN_PROGRESS" || bookingDetails.booking.status === "COMPLETED" ? "bg-yellow-500" : "bg-gray-300 dark:bg-gray-600"}`}
              ></div>
              <div
                class="bg-gray-200 dark:bg-gray-700 flex-grow w-px mt-1"
              ></div>
            </div>
            <div>
              <p
                class={`font-medium ${bookingDetails.booking.status === "IN_PROGRESS" || bookingDetails.booking.status === "COMPLETED" ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}
              >
                Cleaning In Progress
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {bookingDetails.booking.status === "IN_PROGRESS" ||
                bookingDetails.booking.status === "COMPLETED"
                  ? "Work started"
                  : "Not started yet"}
              </p>
            </div>
          </div>

          <div class="flex">
            <div class="mr-3 flex flex-col items-center">
              <div
                class={`h-4 w-4 rounded-full ${bookingDetails.booking.status === "COMPLETED" ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
              ></div>
              <div class="bg-transparent flex-grow w-px mt-1"></div>
            </div>
            <div>
              <p
                class={`font-medium ${bookingDetails.booking.status === "COMPLETED" ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}
              >
                Booking Completed
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {bookingDetails.booking.status === "COMPLETED"
                  ? "Service successfully delivered"
                  : "Pending completion"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Action card for upcoming bookings -->
      {#if bookingDetails.booking.status === "CONFIRMED" && isUpcoming(bookingDetails.booking.scheduledDate)}
        <div
          class="bg-primary-50 dark:bg-primary-900/10 rounded-lg shadow p-6 border border-primary-100 dark:border-primary-700/30"
        >
          <h3 class="text-lg font-medium text-primary mb-2">Ready to start?</h3>
          <p class="text-gray-700 dark:text-gray-300 mb-4">
            When you arrive at the location and begin cleaning, mark this job as
            "In Progress".
          </p>

          <form
            method="POST"
            action="?/updateStatus"
            use:enhance={() => {
              isSubmittingStatus = true;

              return async ({ result, update }) => {
                isSubmittingStatus = false;
                await update();
              };
            }}
          >
            <input type="hidden" name="status" value="IN_PROGRESS" />
            <Button
              type="submit"
              variant="primary"
              class="w-full"
              disabled={isSubmittingStatus}
            >
              <Play size={16} class="mr-1" />
              Start Job
            </Button>
          </form>
        </div>
      {/if}

      <!-- Action card for in-progress bookings -->
      {#if bookingDetails.booking.status === "IN_PROGRESS"}
        <div
          class="bg-blue-50 dark:bg-blue-900/10 rounded-lg shadow p-6 border border-blue-100 dark:border-blue-700/30"
        >
          <h3 class="text-lg font-medium text-blue-600 dark:text-blue-400 mb-2">
            Job in progress
          </h3>
          <p class="text-gray-700 dark:text-gray-300 mb-4">
            Once you've completed all tasks and the cleaning is done, mark this
            job as completed.
          </p>

          <form
            method="POST"
            action="?/updateStatus"
            use:enhance={() => {
              isSubmittingStatus = true;

              return async ({ result, update }) => {
                isSubmittingStatus = false;
                await update();
              };
            }}
          >
            <input type="hidden" name="status" value="COMPLETED" />
            <Button
              type="submit"
              variant="primary"
              class="w-full"
              disabled={isSubmittingStatus}
            >
              Complete Job
            </Button>
          </form>
        </div>
      {/if}

      <!-- Payment info -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Payment Information
        </h2>

        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-gray-600 dark:text-gray-400">Service fee:</span>
            <span class="text-gray-900 dark:text-white"
              >{formatCurrency(bookingDetails.booking.price)}</span
            >
          </div>

          <div class="flex justify-between items-center">
            <span class="text-gray-600 dark:text-gray-400"
              >Platform fee (15%):</span
            >
            <span class="text-gray-900 dark:text-white"
              >{formatCurrency(bookingDetails.booking.price * 0.15)}</span
            >
          </div>

          <div
            class="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700"
          >
            <span class="font-medium text-gray-900 dark:text-white"
              >Your earnings:</span
            >
            <span class="font-bold text-primary text-lg"
              >{formatCurrency(
                getCleanerEarnings(bookingDetails.booking.price),
              )}</span
            >
          </div>

          <div
            class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400"
          >
            <p>
              Earnings are paid out every Thursday. Check the earnings page for
              your next payment date.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
