<!-- src/routes/admin/applications/[id]/+page.svelte -->

<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import ApplicationApprovalActions from "$lib/components/admin/ApplicationApprovalActions.svelte";
  import ApplicationEditForm from "$lib/components/admin/ApplicationEditForm.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import { isWithinServiceArea } from "$lib/utils/serviceAreaValidator";
  import {
    ArrowLeft,
    Briefcase,
    Calendar,
    Check,
    Clipboard,
    FileText,
    Mail,
    MapPin,
    Phone,
    User,
    X,
  } from "lucide-svelte";

  export let data;
  const { application, notes } = data;

  let isProcessing = false;
  let isEditing = false;
  let noteText = ""; // For admin notes
  let errorMessage: string | null = null;
  let successMessage: string | null = null;

  // Format date function
  function formatDate(dateValue: string | Date): string {
    const dateString = dateValue instanceof Date ? dateValue.toISOString() : dateValue;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // Status badge class
  function getStatusBadgeClass(status: string) {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300";
      case "APPROVED":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  }

  // Safely parse availability JSON
  function formatAvailability(availabilityString: string): string {
    try {
      const days = JSON.parse(availabilityString);
      if (Array.isArray(days)) {
        return days.join(", ");
      }
      return availabilityString;
    } catch (error) {
      return availabilityString;
    }
  }


  // Handle edit mode
  function startEditing() {
    isEditing = true;
  }

  // Handle save changes
  async function saveChanges(event) {
    const { updatedApplication } = event.detail;

    isProcessing = true;
    errorMessage = null;
    successMessage = null;

    try {
      // Send update to server
      const response = await fetch(
        `/api/admin/applications/${application.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedApplication),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update application");
      }

      // Update succeeded
      successMessage = "Application updated successfully";

      // Refresh the data
      await invalidateAll();

      // Exit edit mode
      isEditing = false;
    } catch (error) {
      console.error("Error updating application:", error);
      errorMessage =
        error instanceof Error ? error.message : "An error occurred";
    } finally {
      isProcessing = false;
    }
  }

  // Handle cancel edit
  function cancelEdit() {
    isEditing = false;
  }

  // Handle approval success
  function handleApproved(event) {
    successMessage =
      "Application approved successfully! Cleaner account created.";
    invalidateAll();
  }

  // Handle rejection success
  function handleRejected() {
    successMessage = "Application rejected successfully.";
    invalidateAll();
  }

  // Handle error
  function handleError(event) {
    errorMessage = event.detail.message;
  }

  // Close alerts
  function closeAlert() {
    errorMessage = null;
    successMessage = null;
  }
</script>

<svelte:head>
  <title>Application Details | BrightBroom Admin</title>
</svelte:head>

<!-- Page header with back button -->
<div class="mb-6 flex items-center">
  <a
    href="/admin/applications"
    class="mr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
  >
    <ArrowLeft size={20} />
  </a>
  <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
    Application Details
  </h1>
</div>

<!-- Alert messages -->
{#if errorMessage}
  <div
    class="mb-6 rounded-md bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-200 border border-red-200 dark:border-red-800"
  >
    <div class="flex">
      <div class="flex-shrink-0">
        <X class="h-5 w-5 text-red-400" />
      </div>
      <div class="ml-3">
        <p class="text-sm font-medium">{errorMessage}</p>
      </div>
      <div class="ml-auto pl-3">
        <button on:click={closeAlert} class="text-red-400 hover:text-red-500">
          <X size={16} />
        </button>
      </div>
    </div>
  </div>
{/if}

{#if successMessage}
  <div
    class="mb-6 rounded-md bg-green-50 p-4 text-green-600 dark:bg-green-900/20 dark:text-green-200 border border-green-200 dark:border-green-800"
  >
    <div class="flex">
      <div class="flex-shrink-0">
        <Check class="h-5 w-5 text-green-400" />
      </div>
      <div class="ml-3">
        <p class="text-sm font-medium">{successMessage}</p>
      </div>
      <div class="ml-auto pl-3">
        <button
          on:click={closeAlert}
          class="text-green-400 hover:text-green-500"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Application status indicator -->
<div class="mb-6 flex items-center justify-between">
  <div class="flex items-center gap-2">
    <span
      class={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeClass(application.status)}`}
    >
      {application.status}
    </span>
    <span class="text-gray-500 dark:text-gray-400">
      Submitted on {formatDate(application.createdAt)}
    </span>
  </div>
</div>

<!-- Application approval actions -->
<div class="mb-6">
  <ApplicationApprovalActions
    applicationId={application.id}
    status={application.status}
    disabled={isProcessing || isEditing}
    on:edit={startEditing}
    on:approved={handleApproved}
    on:rejected={handleRejected}
    on:error={handleError}
  />
</div>

<!-- Application edit form (shown when editing) -->
{#if isEditing}
  <div class="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800 mb-6">
    <ApplicationEditForm
      {application}
      isEditing={true}
      {isProcessing}
      on:save={saveChanges}
      on:cancel={cancelEdit}
    />
  </div>
{:else}
  <!-- Main content (view mode) -->
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <!-- Left column: Applicant details -->
    <div class="lg:col-span-2 space-y-6">
      <!-- Personal information card -->
      <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <div class="flex items-center mb-4">
          <div
            class="h-20 w-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mr-4"
          >
            {#if application.profileImageUrl}
              <img
                src={application.profileImageUrl}
                alt="Profile"
                class="h-full w-full object-cover"
              />
            {:else}
              <div class="flex items-center justify-center h-full w-full">
                <User size={24} class="text-gray-400" />
              </div>
            {/if}
          </div>

          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {application.firstName}
              {application.lastName}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {application.email}
            </p>
          </div>
        </div>

        <h2
          class="mb-4 text-xl font-semibold text-gray-900 dark:text-white flex items-center"
        >
          <User class="mr-2 text-primary" size={20} />
          Personal Information
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Full Name
            </p>
            <p class="text-gray-900 dark:text-white">
              {application.firstName}
              {application.lastName}
            </p>
          </div>

          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Email
            </p>
            <p class="text-gray-900 dark:text-white">
              {application.email}
            </p>
          </div>

          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Phone
            </p>
            <p class="text-gray-900 dark:text-white">
              {application.phone || "Not provided"}
            </p>
          </div>

          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              ID Type/Number
            </p>
            <p class="text-gray-900 dark:text-white">
              {application.idType === "SOUTH_AFRICAN_ID"
                ? "South African ID"
                : application.idType}: {application.idNumber || "Not provided"}
            </p>
          </div>
        </div>
      </div>

      <!-- Location information card -->
      <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <h2
          class="mb-4 text-xl font-semibold text-gray-900 dark:text-white flex items-center"
        >
          <MapPin class="mr-2 text-primary" size={20} />
          Location Information
        </h2>

        <div class="space-y-3">
          <!-- Address display -->
          <div class="flex items-start">
            <div
              class="w-32 flex-shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              Address:
            </div>
            <div class="text-gray-900 dark:text-white">
              {application.formattedAddress || application.city}
            </div>
          </div>

          <!-- Work radius -->
          <div class="flex items-start">
            <div
              class="w-32 flex-shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              Work Radius:
            </div>
            <div class="text-gray-900 dark:text-white">
              {application.workRadius || "20"} km
            </div>
          </div>

          <!-- Coordinates if available -->
          {#if application.latitude && application.longitude}
            <div class="flex items-start">
              <div
                class="w-32 flex-shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                Coordinates:
              </div>
              <div class="text-gray-900 dark:text-white">
                {parseFloat(application.latitude).toFixed(5)}, {parseFloat(
                  application.longitude,
                ).toFixed(5)}
              </div>
            </div>

            <!-- Service area status indicator -->
            <div class="mt-3">
              {#if isWithinServiceArea(application.latitude, application.longitude)}
                <div
                  class="inline-flex items-center rounded-md bg-green-50 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300"
                >
                  <Check class="mr-1 h-4 w-4" />
                  Within Service Area
                </div>
              {:else}
                <div
                  class="inline-flex items-center rounded-md bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                >
                  <X class="mr-1 h-4 w-4" />
                  Outside Service Area
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      <!-- Documents & Availability -->
      <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <h2
          class="mb-4 text-xl font-semibold text-gray-900 dark:text-white flex items-center"
        >
          <Briefcase class="mr-2 text-primary" size={20} />
          Documents & Availability
        </h2>

        <div class="space-y-4">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Documents Status
            </p>
            <div class="mt-1">
              {#if application.documentsPending}
                <span
                  class="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                >
                  <X class="mr-1 h-3 w-3" />
                  Documents Pending
                </span>
              {:else}
                <span
                  class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-300"
                >
                  <Check class="mr-1 h-3 w-3" />
                  Documents Complete
                </span>
              {/if}
            </div>
          </div>

          <!-- Availability -->
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Availability
            </p>
            <div class="mt-1">
              {#if application.availability}
                <p class="text-gray-900 dark:text-white">
                  {formatAvailability(application.availability)}
                </p>
              {:else}
                <p class="text-gray-600 dark:text-gray-400">
                  No availability specified
                </p>
              {/if}
            </div>
          </div>

          <!-- Additional work info -->
          <div
            class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
          >
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Own Transport
              </p>
              <p class="text-gray-900 dark:text-white">
                {application.ownTransport ? "Yes" : "No"}
              </p>
            </div>

            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                WhatsApp
              </p>
              <p class="text-gray-900 dark:text-white">
                {application.whatsApp ? "Yes" : "No"}
              </p>
            </div>

            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Pet Compatibility
              </p>
              <p class="text-gray-900 dark:text-white">
                {application.petCompatibility || "Not specified"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Information -->
      {#if application.referralSource || application.documents || application.notes}
        <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h2
            class="mb-4 text-xl font-semibold text-gray-900 dark:text-white flex items-center"
          >
            <FileText class="mr-2 text-primary" size={20} />
            Additional Information
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <!-- Tax & Banking Details -->
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Tax Number
              </p>
              <p class="text-gray-900 dark:text-white">
                {application.taxNumber || "Not provided"}
              </p>
            </div>

          </div>

          <!-- Bank Account Details Section -->
          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4
              class="text-md font-medium text-gray-900 dark:text-white mb-3"
            >
              Bank Account Details
            </h4>
            {#if application.bankName || application.bankAccountNumber}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Bank Name
                  </p>
                  <p class="text-gray-900 dark:text-white">
                    {application.bankName || "Not provided"}
                  </p>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Account Type
                  </p>
                  <p class="text-gray-900 dark:text-white">
                    {application.bankAccountType || "Not provided"}
                  </p>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Account Number
                  </p>
                  <p class="text-gray-900 dark:text-white font-mono">
                    {application.bankAccountNumber || "Not provided"}
                  </p>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Branch Code
                  </p>
                  <p class="text-gray-900 dark:text-white font-mono">
                    {application.bankBranchCode || "Not provided"}
                  </p>
                </div>
                <div class="md:col-span-2">
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Account Holder
                  </p>
                  <p class="text-gray-900 dark:text-white">
                    {application.bankAccountHolder || "Not provided"}
                  </p>
                </div>
              </div>
            {:else}
              <p class="text-gray-500 dark:text-gray-400 italic">
                No bank details provided
              </p>
            {/if}
          </div>

          <!-- Other existing fields like referralSource and bio -->
          {#if application.referralSource}
            <div class="mb-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Referral Source
              </p>
              <p class="text-gray-900 dark:text-white">
                {application.referralSource}
              </p>
            </div>
          {/if}

          {#if application.bio}
            <div class="mb-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Bio
              </p>
              <p class="text-gray-900 dark:text-white">
                {application.bio}
              </p>
            </div>
          {/if}

          <!-- Documents with better formatting -->
          {#if application.documents && application.documents.length > 0}
            <div class="mb-4">
              <p
                class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2"
              >
                Documents ({application.documents.length})
              </p>
              <div class="grid grid-cols-1 gap-2">
                {#each application.documents as document}
                  <div
                    class="flex items-center gap-2 rounded-md border border-gray-200 p-2 dark:border-gray-700 bg-gray-50 dark:bg-gray-700"
                  >
                    <FileText size={16} class="text-primary flex-shrink-0" />
                    <span
                      class="text-sm text-gray-900 dark:text-white truncate flex-grow"
                    >
                      {document.split("/").pop()}
                    </span>
                    <a
                      href={document}
                      target="_blank"
                      class="flex-shrink-0 text-primary hover:text-primary-600 hover:underline px-2 py-1"
                    >
                      View
                    </a>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          {#if application.notes}
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Notes
              </p>
              <div class="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <p class="text-gray-900 dark:text-white">
                  {application.notes}
                </p>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Right column: Admin actions -->
    <div class="space-y-6">
      <!-- Admin Actions Card -->
      <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Admin Actions
        </h2>

        <div class="space-y-4">
          {#if application.status === "PENDING"}
            <form method="POST" action="?/addNote" use:enhance>
              <div class="mb-3">
                <label
                  for="note"
                  class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Add Note
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows="3"
                  bind:value={noteText}
                  class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Add notes about this application..."
                ></textarea>
              </div>
              <Button type="submit" variant="outline" class="w-full">
                <Clipboard size={16} class="mr-2" />
                Save Note
              </Button>
            </form>

            <hr class="border-t border-gray-200 dark:border-gray-700" />

            <div class="grid grid-cols-2 gap-3">
              <Button
                href={`mailto:${application.email}`}
                variant="outline"
                class="w-full"
              >
                <Mail size={14} class="mr-2" />
                Email Applicant
              </Button>

              {#if application.phone}
                <Button
                  href={`tel:${application.phone}`}
                  variant="outline"
                  class="w-full"
                >
                  <Phone size={14} class="mr-2" />
                  Call Applicant
                </Button>
              {/if}
            </div>
          {:else if application.status === "APPROVED"}
            <div class="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
              <div class="flex">
                <div class="flex-shrink-0">
                  <Check class="h-5 w-5 text-green-400" />
                </div>
                <div class="ml-3">
                  <h3
                    class="text-sm font-medium text-green-800 dark:text-green-300"
                  >
                    Application Approved
                  </h3>
                  <div class="mt-2 text-sm text-green-700 dark:text-green-200">
                    <p>
                      This application has been approved and a cleaner account
                      has been created.
                    </p>
                  </div>
                  <div class="mt-4">
                    <Button href="/admin/cleaners" variant="outline" size="sm">
                      View Cleaner Profile
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          {:else if application.status === "REJECTED"}
            <div class="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
              <div class="flex">
                <div class="flex-shrink-0">
                  <X class="h-5 w-5 text-red-400" />
                </div>
                <div class="ml-3">
                  <h3
                    class="text-sm font-medium text-red-800 dark:text-red-300"
                  >
                    Application Rejected
                  </h3>
                  <div class="mt-2 text-sm text-red-700 dark:text-red-200">
                    <p>This application has been rejected.</p>
                    {#if application.notes}
                      <p class="mt-2">Reason: {application.notes}</p>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Notes History Card -->
      {#if notes && notes.length > 0}
        <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h2
            class="mb-4 text-lg font-semibold text-gray-900 dark:text-white flex items-center"
          >
            <Calendar class="mr-2 text-primary" size={18} />
            Notes History
          </h2>

          <div class="space-y-4">
            {#each notes as note}
              <div class="rounded-md bg-gray-50 p-3 dark:bg-gray-700">
                <p class="text-sm text-gray-900 dark:text-white">
                  {note.content}
                </p>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(note.createdAt)} by {note.addedBy}
                </p>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
