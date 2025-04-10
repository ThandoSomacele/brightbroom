<!-- src/routes/admin/applications/[id]/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import { VITE_GOOGLE_MAPS_API_KEY } from "$env/static/public";
  import ServiceAreaMap from "$lib/components/maps/ServiceAreaMap.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import LoadingButton from "$lib/components/ui/LoadingButton.svelte";
  import { isWithinServiceArea } from "$lib/utils/serviceAreaValidator";
  import {
    ArrowLeft,
    Briefcase,
    Check,
    Clipboard,
    FileText,
    Mail,
    MapPin,
    Phone,
    X,
  } from "lucide-svelte";

  export let data;
  const { application } = data;

  let isProcessing = false;
  let noteText = ""; // For admin notes

  // Format date function
  function formatDate(dateString: string): string {
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

  // Add handlers for profile image upload events
  function handleProfileImageSuccess({ detail }: CustomEvent<{ url: string }>) {
    // Profile image was updated successfully
    // You might want to show a success message or update the UI
  }

  function handleProfileImageError({
    detail,
  }: CustomEvent<{ message: string }>) {
    // There was an error with the profile image upload
    console.error("Profile image error:", detail.message);
    // You could set an error state here to display to the user
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

  {#if application.status === "PENDING"}
    <div class="flex gap-2">
      <form
        method="POST"
        action="?/approve"
        use:enhance={() => {
          isProcessing = true;

          return async ({ result }) => {
            isProcessing = false;

            if (result.type === "success") {
              await invalidateAll();
            }
          };
        }}
      >
        <LoadingButton
          type="submit"
          variant="primary"
          loading={isProcessing}
          class="!bg-green-600 hover:!bg-green-700 dark:!bg-green-700 dark:hover:!bg-green-800"
        >
          <Check size={16} class="mr-2" />
          Approve Application
        </LoadingButton>
      </form>

      <form
        method="POST"
        action="?/reject"
        use:enhance={() => {
          isProcessing = true;

          return async ({ result }) => {
            isProcessing = false;

            if (result.type === "success") {
              await invalidateAll();
            }
          };
        }}
      >
        <LoadingButton
          type="submit"
          variant="outline"
          loading={isProcessing}
          class="!border-red-500 !text-red-500 hover:!bg-red-50 dark:hover:!bg-red-900/20"
        >
          <X size={16} class="mr-2" />
          Reject Application
        </LoadingButton>
      </form>
    </div>
  {/if}
</div>

<!-- Main content -->
<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
  <!-- Left column: Applicant details -->
  <div class="lg:col-span-2 space-y-6">
    <!-- Personal information card -->
    <div>
      <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
        Location
      </p>
      <div class="flex items-center">
        <MapPin class="mr-1 text-gray-400" size={16} />
        <p class="text-gray-900 dark:text-white">{application.city}</p>
      </div>

      <!-- Add location coordinates if available -->
      {#if application.latitude && application.longitude}
        <div class="mt-3 rounded-md bg-gray-50 p-4 dark:bg-gray-700">
          <div class="flex items-start">
            <!-- Service area status -->
            <div class="mr-4">
              <div
                class={`px-2 py-1 rounded-md text-xs font-medium ${
                  isWithinServiceArea(
                    application.latitude,
                    application.longitude,
                  )
                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                }`}
              >
                {isWithinServiceArea(
                  application.latitude,
                  application.longitude,
                )
                  ? "Within Service Area"
                  : "Outside Service Area"}
              </div>
            </div>

            <!-- Coordinates -->
            <div class="text-sm">
              <p class="text-gray-600 dark:text-gray-300">
                Coordinates: {application.latitude.toFixed(5)}, {application.longitude.toFixed(
                  5,
                )}
              </p>
            </div>
          </div>

          <!-- Small service area map -->
          <div class="mt-3 h-40 w-full">
            <ServiceAreaMap
              apiKey={VITE_GOOGLE_MAPS_API_KEY}
              height="100%"
              width="100%"
              showLabels={true}
              selectedAreaName={null}
            />
          </div>
        </div>
      {/if}
    </div>

    <!-- Experience & Availability -->
    <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <h2
        class="mb-4 text-xl font-semibold text-gray-900 dark:text-white flex items-center"
      >
        <Briefcase class="mr-2 text-primary" size={20} />
        Work Experience & Availability
      </h2>

      <div class="space-y-4">
        <div>
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Experience Types
          </p>
          <div class="mt-1 flex flex-wrap gap-2">
            {#if application.experienceTypes && application.experienceTypes.length > 0}
              {#each application.experienceTypes as expType}
                <span
                  class="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary dark:bg-primary-900/20"
                >
                  {expType === "GUEST_HOUSE"
                    ? "Cleaning Guest house/Hotel/BnB"
                    : expType === "OFFICE"
                      ? "Cleaning Offices"
                      : expType === "CARE_GIVING"
                        ? "Care Giving"
                        : expType}
                </span>
              {/each}
            {:else}
              <span class="text-gray-600 dark:text-gray-400"
                >No experience types specified</span
              >
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- Additional Information -->
    {#if application.referralSource || application.documents}
      <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <h2
          class="mb-4 text-xl font-semibold text-gray-900 dark:text-white flex items-center"
        >
          <FileText class="mr-2 text-primary" size={20} />
          Additional Information
        </h2>

        <div class="space-y-4">
          {#if application.referralSource}
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Referral Source
              </p>
              <p class="text-gray-900 dark:text-white">
                {application.referralSource}
              </p>
            </div>
          {/if}

          {#if application.documents && application.documents.length > 0}
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Documents
              </p>
              <div class="mt-2 space-y-2">
                {#each application.documents as document}
                  <div
                    class="flex items-center gap-2 rounded-md border border-gray-200 p-2 dark:border-gray-700"
                  >
                    <FileText size={16} class="text-gray-500" />
                    <span class="text-sm text-gray-900 dark:text-white"
                      >{document}</span
                    >
                    <a
                      href={document}
                      target="_blank"
                      class="ml-auto text-primary hover:underline">View</a
                    >
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- Right column: Admin actions -->
  <div class="space-y-6">
    <!-- Admin Actions Card -->
    <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
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
              <Mail size={16} class="mr-2" />
              Email Applicant
            </Button>

            {#if application.phone}
              <Button
                href={`tel:${application.phone}`}
                variant="outline"
                class="w-full"
              >
                <Phone size={16} class="mr-2" />
                Call Applicant
              </Button>
            {/if}
          </div>

          <hr class="border-t border-gray-200 dark:border-gray-700" />

          <!-- Decision Buttons (Highlighted) -->
          <div class="rounded-md bg-gray-50 p-4 dark:bg-gray-700">
            <h3
              class="text-lg font-semibold mb-3 text-gray-900 dark:text-white"
            >
              Application Decision
            </h3>
            <div class="space-y-3">
              <form
                method="POST"
                action="?/approve"
                use:enhance={() => {
                  isProcessing = true;

                  return async ({ result }) => {
                    isProcessing = false;

                    if (result.type === "success") {
                      await invalidateAll();
                    }
                  };
                }}
              >
                <LoadingButton
                  type="submit"
                  variant="primary"
                  loading={isProcessing}
                  class="w-full !bg-green-600 hover:!bg-green-700 dark:!bg-green-700 dark:hover:!bg-green-800"
                >
                  <Check size={16} class="mr-2" />
                  Approve Application
                </LoadingButton>
              </form>

              <form
                method="POST"
                action="?/reject"
                use:enhance={() => {
                  isProcessing = true;

                  return async ({ result }) => {
                    isProcessing = false;

                    if (result.type === "success") {
                      await invalidateAll();
                    }
                  };
                }}
              >
                <LoadingButton
                  type="submit"
                  variant="outline"
                  loading={isProcessing}
                  class="w-full !border-red-500 !text-red-500 hover:!bg-red-50 dark:hover:!bg-red-900/20"
                >
                  <X size={16} class="mr-2" />
                  Reject Application
                </LoadingButton>
              </form>
            </div>
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
                    This application has been approved and a cleaner account has
                    been created.
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
                <h3 class="text-sm font-medium text-red-800 dark:text-red-300">
                  Application Rejected
                </h3>
                <div class="mt-2 text-sm text-red-700 dark:text-red-200">
                  <p>This application has been rejected.</p>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Notes History Card -->
    {#if application.notes && application.notes.length > 0}
      <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Notes History
        </h2>

        <div class="space-y-4">
          {#each application.notes as note}
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
