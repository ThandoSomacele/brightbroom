<!-- src/routes/admin/bookings/[id]/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import AutoAssignCleanerButton from "$lib/components/admin/AutoAssignCleanerButton.svelte";
  import CleanerAssignmentDialog from "$lib/components/admin/CleanerAssignmentDialog.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import {
    AlertTriangle,
    Calendar,
    ChevronLeft,
    ClipboardList,
    Clock,
    CreditCard,
    History,
    Home,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    Send,
    User,
  } from "lucide-svelte";

  export let data;
  export let form;

  const {
    booking,
    availableCleaners,
    communicationLog,
    adminNotes,
    relatedBookings,
  } = data;

  // Local state
  let showStatusChangeModal = false;
  let showCleanerAssignModal = false;
  let showAddNoteModal = false;
  let showAddCommentModal = false;
  let showCleanerChangeNotifyModal = false;
  let selectedStatus = booking.status;
  let selectedCleaner = booking.cleaner?.id || "";
  let isUpdateLoading = false;
  let isSendingNotification = false;
  let newNote = "";
  let newComment = "";
  let originalCleanerFirstName = "";
  let originalCleanerLastName = "";

  // Format date function
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-ZA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // Format time function
  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
    });
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

  // Add these variables to your component state
  let showAssignDialog = false;

  // Add these functions to your component
  function openAssignDialog() {
    showAssignDialog = true;
  }

  function closeAssignDialog() {
    showAssignDialog = false;
  }

  function handleCleanerAssigned(cleanerId: string | null) {
    showAssignDialog = false;
    invalidateAll(); // This will refresh all data
  }

  function getCleanerAvailabilityBadge(availability: string) {
    switch (availability) {
      case "AVAILABLE":
        return {
          class:
            "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
          label: "Available",
        };
      case "LIMITED":
        return {
          class:
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
          label: "Limited",
        };
      case "UNAVAILABLE":
        return {
          class: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
          label: "Unavailable",
        };
      default:
        return {
          class:
            "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300",
          label: "Unknown",
        };
    }
  }

  // Is the booking in the past?
  function isPastBooking(): boolean {
    const now = new Date();
    const bookingDate = new Date(booking.scheduledDate);
    return bookingDate < now;
  }

  // Format price
  function formatPrice(price): string {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(Number(price));
  }

  // Format relative time (for notes/comments)
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

  // Close modal on escape key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      showStatusChangeModal = false;
      showCleanerAssignModal = false;
      showAddNoteModal = false;
      showAddCommentModal = false;
      showCleanerChangeNotifyModal = false;
    }
  }

  // Send SMS to customer
  async function sendSMS(phoneNumber: string, message: string) {
    try {
      const response = await fetch(`/api/admin/communications/sms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: booking.id,
          phoneNumber,
          message,
        }),
      });

      if (!response.ok) throw new Error("Failed to send SMS");

      await invalidateAll();
      showAddCommentModal = false;
      newComment = "";
    } catch (error) {
      console.error("Error sending SMS:", error);
      alert("Failed to send SMS. Please try again.");
    }
  }

  // Send email to customer
  async function sendEmail(email: string, subject: string, message: string) {
    try {
      const response = await fetch(`/api/admin/communications/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: booking.id,
          email,
          subject,
          message,
        }),
      });

      if (!response.ok) throw new Error("Failed to send email");

      await invalidateAll();
      showAddCommentModal = false;
      newComment = "";
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Failed to send email. Please try again.");
    }
  }

  // View customer profile
  function viewCustomerProfile() {
    window.location.href = `/admin/users/${booking.customer.id}`;
  }

  // View cleaner profile
  function viewCleanerProfile() {
    window.location.href = `/admin/cleaners/${booking.cleaner.id}`;
  }
</script>

<svelte:head>
  <title>Booking Details | BrightBroom Admin</title>
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

<!-- Page header with back button -->
<div class="mb-6 flex items-center">
  <a
    href="/admin/bookings"
    class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mr-3"
  >
    <ChevronLeft size={20} />
  </a>
  <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
    Booking Details
  </h1>
</div>

<!-- Status message if form action was performed -->
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

<!-- Booking status and actions header -->
<div
  class="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
>
  <div class="flex items-center">
    <span
      class={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(booking.status)}`}
    >
      {booking.status}
    </span>
    <span class="ml-2 text-gray-500 dark:text-gray-400">
      ID: {booking.id.substring(0, 8)}...
    </span>

    {#if isPastBooking() && booking.status !== "COMPLETED" && booking.status !== "CANCELLED"}
      <span
        class="ml-2 flex items-center text-amber-600 dark:text-amber-400 text-sm"
      >
        <AlertTriangle size={16} class="mr-1" />
        Past due
      </span>
    {/if}
  </div>

  <div class="flex mt-4 sm:mt-0 space-x-2">
    <Button
      variant="outline"
      on:click={() => (showStatusChangeModal = true)}
      disabled={booking.status === "CANCELLED"}
    >
      Change Status
    </Button>

    <Button
      variant="outline"
      on:click={openAssignDialog}
      disabled={booking.status === "CANCELLED" ||
        booking.status === "COMPLETED" ||
        isPastBooking()}
    >
      {booking.cleaner ? "Reassign Cleaner" : "Assign Cleaner"}
    </Button>

    <AutoAssignCleanerButton
      bookingId={booking.id}
      variant="outline"
      size="sm"
      disabled={booking.status === "CANCELLED" ||
        booking.status === "COMPLETED" ||
        isPastBooking() ||
        booking.cleaner !== null}
      on:success={async () => {
        // Refresh the page data after successful assignment
        await invalidateAll();
      }}
    />

    <Button variant="primary" on:click={() => (showAddCommentModal = true)}>
      Contact Customer
    </Button>
  </div>
</div>

<!-- Main content grid -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
  <!-- Left column: Booking details -->
  <div class="lg:col-span-2 space-y-6">
    <!-- Service details -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Cleaning Details
      </h2>

      <div class="space-y-4">
        <div class="flex items-start">
          <Home size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              General Clean
            </p>
            <p class="text-gray-600 dark:text-gray-300">
              {booking.bedroomCount || 1} bedroom{(booking.bedroomCount || 1) > 1 ? 's' : ''},
              {booking.bathroomCount || 1} bathroom{(booking.bathroomCount || 1) > 1 ? 's' : ''}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Living room & kitchen included
            </p>
          </div>
        </div>

        {#if booking.addons && booking.addons.length > 0}
          <div class="flex items-start">
            <svg class="mr-3 mt-0.5 flex-shrink-0 text-primary w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Add-ons</p>
              <ul class="text-gray-600 dark:text-gray-300 text-sm mt-1 space-y-1">
                {#each booking.addons as bookingAddon}
                  <li class="flex justify-between">
                    <span>{bookingAddon.addon?.name || 'Add-on'}</span>
                    <span class="text-gray-500">R{parseFloat(bookingAddon.priceAtBooking || '0').toFixed(2)}</span>
                  </li>
                {/each}
              </ul>
            </div>
          </div>
        {/if}

        <div class="flex items-start">
          <Calendar size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Date</p>
            <p class="text-gray-600 dark:text-gray-300">
              {formatDate(booking.scheduledDate)}
            </p>
          </div>
        </div>

        <div class="flex items-start">
          <Clock size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Time</p>
            <p class="text-gray-600 dark:text-gray-300">
              {formatTime(booking.scheduledDate)}
            </p>
          </div>
        </div>

        <div class="flex items-start">
          <MapPin size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Location</p>
            <p class="text-gray-600 dark:text-gray-300">
              {booking.address.street}<br />
              {booking.address.city}, {booking.address.state}
              {booking.address.zipCode}
            </p>
          </div>
        </div>

        {#if booking.notes}
          <div
            class="flex items-start pt-3 border-t border-gray-200 dark:border-gray-700"
          >
            <MessageSquare
              size={20}
              class="mr-3 mt-0.5 flex-shrink-0 text-primary"
            />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                Customer Notes
              </p>
              <p class="text-gray-600 dark:text-gray-300">{booking.notes}</p>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Customer details -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          Customer Details
        </h2>
        <Button variant="outline" size="sm" on:click={viewCustomerProfile}>
          View Profile
        </Button>
      </div>

      <div class="space-y-4">
        <div class="flex items-start">
          <User size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Name</p>
            <p class="text-gray-600 dark:text-gray-300">
              {booking.customer.firstName}
              {booking.customer.lastName}
            </p>
          </div>
        </div>

        <div class="flex items-start">
          <Mail size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Email</p>
            <div class="flex items-center">
              <p class="text-gray-600 dark:text-gray-300">
                {booking.customer.email}
              </p>
              <Button
                variant="ghost"
                size="sm"
                class="ml-2 text-primary"
                on:click={() => {
                  showAddCommentModal = true;
                  setTimeout(() => {
                    document
                      .getElementById("communicationMethod")
                      ?.setAttribute("value", "email");
                  }, 100);
                }}
              >
                Email
              </Button>
            </div>
          </div>
        </div>

        {#if booking.customer.phone}
          <div class="flex items-start">
            <Phone size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Phone</p>
              <div class="flex items-center">
                <p class="text-gray-600 dark:text-gray-300">
                  {booking.customer.phone}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  class="ml-2 text-primary"
                  on:click={() => {
                    showAddCommentModal = true;
                    setTimeout(() => {
                      document
                        .getElementById("communicationMethod")
                        ?.setAttribute("value", "sms");
                    }, 100);
                  }}
                >
                  SMS
                </Button>
              </div>
            </div>
          </div>
        {/if}

        <div class="flex items-start">
          <History size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              Customer Since
            </p>
            <p class="text-gray-600 dark:text-gray-300">
              {formatDate(booking.customer.createdAt)}
            </p>
          </div>
        </div>

        <div
          class="flex items-start pt-3 border-t border-gray-200 dark:border-gray-700"
        >
          <ClipboardList
            size={20}
            class="mr-3 mt-0.5 flex-shrink-0 text-primary"
          />
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              Booking History
            </p>
            <p class="text-gray-600 dark:text-gray-300">
              {booking.customer.bookingsCount || 0} total bookings
              {#if relatedBookings && relatedBookings.length > 0}
                <span class="mx-1">·</span>
                {relatedBookings.filter((b) => b.status === "COMPLETED").length}
                completed
              {/if}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Cleaner details if assigned -->
    {#if booking.cleaner}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Assigned Cleaner
          </h2>
          <Button variant="outline" size="sm" on:click={viewCleanerProfile}>
            View Profile
          </Button>
        </div>

        <div class="space-y-4">
          <div class="flex items-start">
            <User size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Name</p>
              <p class="text-gray-600 dark:text-gray-300">
                {booking.cleaner.firstName}
                {booking.cleaner.lastName}
              </p>
            </div>
          </div>

          <div class="flex items-start">
            <Mail size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Email</p>
              <p class="text-gray-600 dark:text-gray-300">
                {booking.cleaner.email}
              </p>
            </div>
          </div>

          {#if booking.cleaner.phone}
            <div class="flex items-start">
              <Phone size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Phone</p>
                <p class="text-gray-600 dark:text-gray-300">
                  {booking.cleaner.phone}
                </p>
              </div>
            </div>
          {/if}

          {#if booking.cleaner.cleanerProfile && booking.cleaner.cleanerProfile.rating}
            <div class="flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="mr-3 mt-0.5 flex-shrink-0 text-primary h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                />
              </svg>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Rating</p>
                <p class="text-gray-600 dark:text-gray-300">
                  {booking.cleaner.cleanerProfile.rating} / 5
                </p>
              </div>
            </div>
          {/if}

          <div
            class="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700"
          >
            <Button
              variant="outline"
              size="sm"
              on:click={() => (showCleanerChangeNotifyModal = true)}
              disabled={booking.status === "CANCELLED" ||
                booking.status === "COMPLETED" ||
                isPastBooking()}
            >
              <Send size={14} class="mr-1" />
              Notify Change
            </Button>
            <Button
              variant="outline"
              size="sm"
              on:click={openAssignDialog}
              disabled={booking.status === "CANCELLED" ||
                booking.status === "COMPLETED" ||
                isPastBooking()}
            >
              Reassign
            </Button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Communication Log -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          Communication Log
        </h2>
        <Button
          variant="outline"
          size="sm"
          on:click={() => (showAddCommentModal = true)}
        >
          Add Communication
        </Button>
      </div>

      {#if communicationLog && communicationLog.length > 0}
        <div class="space-y-4">
          {#each communicationLog as log}
            <div class="border-l-4 border-primary pl-4 py-2">
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-gray-900 dark:text-white">{log.content}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span class="font-medium">{log.type}</span> &middot; {formatDate(
                      log.createdAt,
                    )} at {formatTime(log.createdAt)}
                  </p>
                  {#if log.sentBy}
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      By: {log.sentBy}
                    </p>
                  {/if}
                </div>
                <span
                  class={`px-2 py-1 text-xs rounded-full ${log.direction === "OUTGOING" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300" : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"}`}
                >
                  {log.direction === "OUTGOING" ? "Sent" : "Received"}
                </span>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-gray-500 dark:text-gray-400 py-4 text-center">
          No communication history
        </p>
      {/if}
    </div>

    <!-- Admin Notes -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          Admin Notes
        </h2>
        <Button
          variant="outline"
          size="sm"
          on:click={() => (showAddNoteModal = true)}
        >
          Add Note
        </Button>
      </div>

      {#if adminNotes && adminNotes.length > 0}
        <div class="space-y-4">
          {#each adminNotes as note}
            <div class="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              <p class="text-gray-900 dark:text-white">{note.content}</p>
              <div
                class="mt-2 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400"
              >
                <span>By: {note.addedBy}</span>
                <span>{formatRelativeTime(note.createdAt)}</span>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-gray-500 dark:text-gray-400 py-4 text-center">
          No admin notes
        </p>
      {/if}
    </div>
  </div>

  <!-- Right column: Payment and actions -->
  <div class="space-y-6">
    <!-- Payment information -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Payment Details
      </h2>

      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <span class="text-gray-600 dark:text-gray-300">Amount:</span>
          <span class="font-bold text-gray-900 dark:text-white"
            >{formatPrice(booking.price)}</span
          >
        </div>

        {#if booking.payment}
          <div class="flex justify-between items-center">
            <span class="text-gray-600 dark:text-gray-300">Payment Status:</span
            >
            <span
              class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
              ${
                booking.payment.status === "COMPLETED"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                  : booking.payment.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
              }`}
            >
              {booking.payment.status}
            </span>
          </div>

          <div class="flex justify-between items-center">
            <span class="text-gray-600 dark:text-gray-300">Payment Method:</span
            >
            <span class="text-gray-900 dark:text-white"
              >{booking.payment.paymentMethod.replace("_", " ")}</span
            >
          </div>

          <div class="flex justify-between items-center">
            <span class="text-gray-600 dark:text-gray-300">Date:</span>
            <span class="text-gray-900 dark:text-white"
              >{formatDate(booking.payment.createdAt)}</span
            >
          </div>

          {#if booking.payment.payFastId}
            <div class="flex justify-between items-center">
              <span class="text-gray-600 dark:text-gray-300">Payment ID:</span>
              <span class="text-gray-900 dark:text-white"
                >{booking.payment.payFastId}</span
              >
            </div>
          {/if}
        {:else}
          <div class="py-2 text-center text-gray-500 dark:text-gray-400">
            No payment information available
          </div>
        {/if}
      </div>

      {#if booking.payment}
        <div class="mt-4 flex justify-end">
          <Button variant="outline" size="sm">
            <CreditCard size={16} class="mr-1" />
            View Receipt
          </Button>
        </div>
      {/if}
    </div>

    <!-- Payout Breakdown (only shown when payment exists and cleaner is assigned) -->
    {#if booking.payment && booking.payment.status === "COMPLETED"}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Payout Breakdown
        </h2>

        <div class="space-y-3">
          <!-- Booking Total -->
          <div class="flex justify-between items-center">
            <span class="text-gray-600 dark:text-gray-300">Booking Total:</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {formatPrice(booking.payment.amount)}
            </span>
          </div>

          <!-- PayFast Fee -->
          <div class="flex justify-between items-center">
            <span class="text-gray-600 dark:text-gray-300">PayFast Fee:</span>
            <span class="text-red-600 dark:text-red-400">
              -{formatPrice(booking.payment.payFastFeeAmount || 0)}
            </span>
          </div>

          <!-- Net After Fees -->
          <div class="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
            <span class="text-gray-600 dark:text-gray-300">Net After Fees:</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {formatPrice(Number(booking.payment.amount) - Number(booking.payment.payFastFeeAmount || 0))}
            </span>
          </div>

          <!-- Platform Commission -->
          <div class="flex justify-between items-center">
            <span class="text-gray-600 dark:text-gray-300">
              BrightBroom Commission ({booking.payment.platformCommissionRate || 15}%):
            </span>
            <span class="text-red-600 dark:text-red-400">
              -{formatPrice(booking.payment.platformCommissionAmount || 0)}
            </span>
          </div>

          <!-- Cleaner Payout -->
          <div class="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
            <span class="font-medium text-gray-900 dark:text-white">Cleaner Payout:</span>
            <span class="font-bold text-lg text-primary">
              {formatPrice(booking.payment.cleanerPayoutAmount || 0)}
            </span>
          </div>

          <!-- Payout Status -->
          <div class="flex justify-between items-center pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
            <span class="text-gray-600 dark:text-gray-300">Payout Status:</span>
            <span
              class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                booking.payment.isPaidToProvider
                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
              }`}
            >
              {booking.payment.isPaidToProvider ? "Paid" : "Pending"}
            </span>
          </div>

          {#if booking.payment.isPaidToProvider && booking.payment.providerPayoutDate}
            <div class="flex justify-between items-center">
              <span class="text-gray-600 dark:text-gray-300">Paid On:</span>
              <span class="text-gray-900 dark:text-white">
                {formatDate(booking.payment.providerPayoutDate)}
              </span>
            </div>
          {/if}
        </div>

        {#if !booking.cleaner}
          <div class="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p class="text-sm text-amber-800 dark:text-amber-300">
              No cleaner assigned yet. Payout will be processed once a cleaner completes this booking.
            </p>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Booking timeline -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Booking Timeline
      </h2>

      <div class="space-y-4">
        <div class="flex">
          <div class="mr-3 flex flex-col items-center">
            <div class="bg-green-500 h-4 w-4 rounded-full"></div>
            <div class="bg-gray-200 dark:bg-gray-700 flex-grow w-px mt-1"></div>
          </div>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              Booking Created
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(booking.createdAt)}
            </p>
          </div>
        </div>

        {#if booking.status !== "PENDING"}
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
                After payment completion
              </p>
            </div>
          </div>
        {/if}

        {#if booking.cleaner}
          <div class="flex">
            <div class="mr-3 flex flex-col items-center">
              <div class="bg-purple-500 h-4 w-4 rounded-full"></div>
              <div
                class="bg-gray-200 dark:bg-gray-700 flex-grow w-px mt-1"
              ></div>
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                Cleaner Assigned
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {booking.cleaner.firstName}
                {booking.cleaner.lastName}
              </p>
            </div>
          </div>
        {/if}

        {#if booking.status === "IN_PROGRESS" || booking.status === "COMPLETED"}
          <div class="flex">
            <div class="mr-3 flex flex-col items-center">
              <div class="bg-yellow-500 h-4 w-4 rounded-full"></div>
              <div
                class="bg-gray-200 dark:bg-gray-700 flex-grow w-px mt-1"
              ></div>
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                Cleaning In Progress
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Cleaner started work
              </p>
            </div>
          </div>
        {/if}

        {#if booking.status === "COMPLETED"}
          <div class="flex">
            <div class="mr-3 flex flex-col items-center">
              <div class="bg-green-500 h-4 w-4 rounded-full"></div>
              <div class="bg-transparent flex-grow w-px mt-1"></div>
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                Booking Completed
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Service successfully delivered
              </p>
            </div>
          </div>
        {:else if booking.status === "CANCELLED"}
          <div class="flex">
            <div class="mr-3 flex flex-col items-center">
              <div class="bg-red-500 h-4 w-4 rounded-full"></div>
              <div class="bg-transparent flex-grow w-px mt-1"></div>
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                Booking Cancelled
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Service was cancelled
              </p>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Related bookings -->
    {#if relatedBookings && relatedBookings.length > 0}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Related Bookings
        </h2>

        <div class="space-y-3">
          {#each relatedBookings as related}
            <a
              href={`/admin/bookings/${related.id}`}
              class="block p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div class="flex justify-between items-center">
                <div class="flex-1">
                  <div class="text-gray-900 dark:text-white font-medium">
                    General Clean
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {related.bedroomCount || 1} bed, {related.bathroomCount || 1} bath • {formatDate(related.scheduledDate)}
                  </div>
                </div>

                <span
                  class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(related.status)}`}
                >
                  {related.status}
                </span>
              </div>
            </a>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Status change modal -->
{#if showStatusChangeModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6"
    >
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Change Booking Status
      </h3>

      <form
        method="POST"
        action="?/changeStatus"
        use:enhance={() => {
          isUpdateLoading = true;

          return async ({ result, update }) => {
            isUpdateLoading = false;
            showStatusChangeModal = false;

            await update();

            // Then refresh the page data
            await invalidateAll();
          };
        }}
      >
        <div class="mb-4">
          <label
            for="status"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            bind:value={selectedStatus}
            class="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div class="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            on:click={() => (showStatusChangeModal = false)}
          >
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
              Updating...
            {:else}
              Update Status
            {/if}
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Cleaner assignment modal/dialog -->
{#if showAssignDialog}
  <CleanerAssignmentDialog
    bookingId={booking.id}
    onClose={closeAssignDialog}
    onAssign={handleCleanerAssigned}
  />
{/if}

<!-- Add Note Modal -->
{#if showAddNoteModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6"
    >
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Add Admin Note
      </h3>

      <form
        method="POST"
        action="?/addNote"
        use:enhance={() => {
          isUpdateLoading = true;

          return async ({ result, update }) => {
            isUpdateLoading = false;
            showAddNoteModal = false;
            newNote = "";

            await update();
            await invalidateAll();
          };
        }}
      >
        <div class="mb-4">
          <label
            for="noteContent"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Note Content
          </label>
          <textarea
            id="noteContent"
            name="content"
            bind:value={newNote}
            rows="4"
            required
            class="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter your note here..."
          ></textarea>
        </div>

        <div class="flex justify-end space-x-3 mt-4">
          <Button
            type="button"
            variant="outline"
            on:click={() => (showCleanerAssignModal = false)}
          >
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
              Updating...
            {:else}
              {booking.cleaner ? "Update Assignment" : "Assign Cleaner"}
            {/if}
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Add Communication Modal -->
{#if showAddCommentModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6"
    >
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Contact Customer
      </h3>

      <form
        method="POST"
        action="?/addCommunication"
        use:enhance={() => {
          isUpdateLoading = true;

          return async ({ result, update }) => {
            isUpdateLoading = false;
            showAddCommentModal = false;

            await update();
            await invalidateAll();
          };
        }}
      >
        <div class="mb-4">
          <label
            for="communicationMethod"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Communication Method
          </label>
          <select
            id="communicationMethod"
            name="method"
            class="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="email">Email</option>
            {#if booking.customer.phone}
              <option value="sms">SMS</option>
            {/if}
            <option value="note">Internal Note Only</option>
          </select>
        </div>

        {#if document.getElementById("communicationMethod")?.value === "email"}
          <div class="mb-4">
            <label
              for="subject"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              class="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter email subject..."
            />
          </div>
        {/if}

        <div class="mb-4">
          <label
            for="messageContent"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Message
          </label>
          <textarea
            id="messageContent"
            name="content"
            bind:value={newComment}
            rows="4"
            required
            class="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter your message here..."
          ></textarea>
        </div>

        <div class="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            on:click={() => (showAddCommentModal = false)}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={isUpdateLoading || !newComment.trim()}
          >
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
              Sending...
            {:else}
              Send Message
            {/if}
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Cleaner Change Notification Modal -->
{#if showCleanerChangeNotifyModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6"
    >
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Send Cleaner Change Notification
      </h3>

      <p class="text-gray-600 dark:text-gray-300 mb-4">
        This will send an email to the customer notifying them that a different cleaner
        ({booking.cleaner?.firstName} {booking.cleaner?.lastName}) has been assigned to their booking.
      </p>

      <form
        method="POST"
        action="?/sendCleanerChangeNotification"
        use:enhance={() => {
          isSendingNotification = true;

          return async ({ result, update }) => {
            isSendingNotification = false;
            showCleanerChangeNotifyModal = false;
            originalCleanerFirstName = "";
            originalCleanerLastName = "";

            await update();
            await invalidateAll();
          };
        }}
      >
        <div class="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <p class="text-sm text-amber-800 dark:text-amber-300">
            <strong>Optional:</strong> If the customer originally requested a specific cleaner,
            enter their name below to include it in the notification.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label
              for="originalCleanerFirstName"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Original Cleaner First Name
            </label>
            <input
              type="text"
              id="originalCleanerFirstName"
              name="originalCleanerFirstName"
              bind:value={originalCleanerFirstName}
              class="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="First name"
            />
          </div>
          <div>
            <label
              for="originalCleanerLastName"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Original Cleaner Last Name
            </label>
            <input
              type="text"
              id="originalCleanerLastName"
              name="originalCleanerLastName"
              bind:value={originalCleanerLastName}
              class="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Last name"
            />
          </div>
        </div>

        <div class="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            on:click={() => (showCleanerChangeNotifyModal = false)}
          >
            Cancel
          </Button>

          <Button type="submit" variant="primary" disabled={isSendingNotification}>
            {#if isSendingNotification}
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
              Sending...
            {:else}
              <Send size={16} class="mr-1" />
              Send Notification
            {/if}
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}
