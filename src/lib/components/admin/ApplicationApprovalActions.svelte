<!-- src/lib/components/admin/ApplicationApprovalActions.svelte -->

<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte";
  import { CheckCircle, Edit, XCircle } from "lucide-svelte";
  import { createEventDispatcher } from "svelte";

  // Props
  export let applicationId: string;
  export let status: string = "PENDING";
  export let disabled: boolean = false;

  // State
  let isProcessing = false;
  let showRejectDialog = false;
  let rejectionReason = "";
  let error: string | null = null;

  // Create event dispatcher
  const dispatch = createEventDispatcher<{
    approved: { userId: string };
    rejected: void;
    edit: void;
    error: { message: string };
  }>();

  // Handle application approval
  async function handleApprove() {
    if (isProcessing || disabled) return;

    try {
      isProcessing = true;
      error = null;

      const response = await fetch(
        `/api/admin/applications/${applicationId}/status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "approve",
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to approve application");
      }

      if (!result.success) {
        throw new Error(result.message || "Failed to approve application");
      }

      // Dispatch success event with the new user ID
      dispatch("approved", { userId: result.userId });
    } catch (err) {
      console.error("Error approving application:", err);
      error = err instanceof Error ? err.message : "An error occurred";
      dispatch("error", { message: error });
    } finally {
      isProcessing = false;
    }
  }

  // Handle application rejection
  async function handleReject() {
    if (isProcessing || disabled) return;

    try {
      isProcessing = true;
      error = null;

      const response = await fetch(
        `/api/admin/applications/${applicationId}/status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "reject",
            reason: rejectionReason,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to reject application");
      }

      if (!result.success) {
        throw new Error(result.message || "Failed to reject application");
      }

      // Close dialog and dispatch event
      showRejectDialog = false;
      rejectionReason = "";
      dispatch("rejected");
    } catch (err) {
      console.error("Error rejecting application:", err);
      error = err instanceof Error ? err.message : "An error occurred";
      dispatch("error", { message: error });
    } finally {
      isProcessing = false;
    }
  }

  // Handle edit button
  function handleEdit() {
    dispatch("edit");
  }

  // Handle clicking Reject button (show dialog)
  function openRejectDialog() {
    if (disabled) return;
    showRejectDialog = true;
  }

  // Handle dialog close
  function closeRejectDialog() {
    showRejectDialog = false;
    rejectionReason = "";
  }
</script>

{#if error}
  <div
    class="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800"
  >
    <p class="font-medium mb-1">Error:</p>
    <p>{error}</p>
  </div>
{/if}

<div class="flex flex-wrap gap-3">
  {#if status === "PENDING"}
    <Button
      variant="outline"
      class="border-primary bg-primary-50 text-primary hover:bg-primary-100 dark:bg-primary-900/20 dark:border-primary-700"
      on:click={handleEdit}
    >
      <Edit size={16} class="mr-1" />
      Edit Details
    </Button>

    <Button
      variant="primary"
      class="bg-green-600 hover:bg-green-700 border-green-600 dark:bg-green-600 dark:hover:bg-green-700"
      on:click={handleApprove}
      disabled={isProcessing || disabled}
    >
      <CheckCircle size={16} class="mr-1" />
      {#if isProcessing && !showRejectDialog}
        <div
          class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
        ></div>
        Processing...
      {:else}
        Approve Application
      {/if}
    </Button>

    <Button
      variant="outline"
      class="border-red-500 text-red-500 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-900/20"
      on:click={openRejectDialog}
      disabled={isProcessing || disabled}
    >
      <XCircle size={16} class="mr-1" />
      Reject
    </Button>
  {:else if status === "APPROVED"}
    <div
      class="flex items-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-md border border-green-200 dark:border-green-800"
    >
      <CheckCircle size={16} class="mr-2" />
      Application Approved
    </div>
  {:else if status === "REJECTED"}
    <div
      class="flex items-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md border border-red-200 dark:border-red-800"
    >
      <XCircle size={16} class="mr-2" />
      Application Rejected
    </div>
  {/if}
</div>

<!-- Rejection Dialog -->
{#if showRejectDialog}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
  >
    <div
      class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
    >
      <h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-white">
        Reject Application
      </h3>

      <div class="mb-4">
        <label
          for="rejectionReason"
          class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Reason (Optional)
        </label>
        <textarea
          id="rejectionReason"
          bind:value={rejectionReason}
          rows="3"
          class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          placeholder="Enter reason for rejection..."
        ></textarea>
      </div>

      <div class="flex justify-end space-x-3">
        <Button
          variant="outline"
          on:click={closeRejectDialog}
          disabled={isProcessing}
        >
          Cancel
        </Button>

        <Button
          variant="outline"
          class="border-red-500 text-red-500 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-900/20"
          on:click={handleReject}
          disabled={isProcessing}
        >
          {#if isProcessing}
            <div
              class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"
            ></div>
            Processing...
          {:else}
            <XCircle size={16} class="mr-1" />
            Confirm Rejection
          {/if}
        </Button>
      </div>
    </div>
  </div>
{/if}
