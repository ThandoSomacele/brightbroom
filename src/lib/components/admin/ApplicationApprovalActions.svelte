<!-- src/lib/components/admin/ApplicationApprovalActions.svelte -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import { CheckCircle, XCircle } from "lucide-svelte";

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
    error: { message: string };
  }>();

  // Handle application approval
  async function handleApprove() {
    if (isProcessing || disabled) return;
    
    try {
      isProcessing = true;
      error = null;
      
      const response = await fetch(`/api/admin/applications/${applicationId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "approve"
        })
      });
      
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
      
      const response = await fetch(`/api/admin/applications/${applicationId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "reject",
          reason: rejectionReason
        })
      });
      
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
  <div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-300">
    {error}
  </div>
{/if}

<div class="flex space-x-3">
  {#if status === "PENDING"}
    <Button 
      variant="primary"
      on:click={handleApprove}
      disabled={isProcessing || disabled}
    >
      <CheckCircle size={16} class="mr-1" />
      {#if isProcessing && !showRejectDialog}
        Processing...
      {:else}
        Approve
      {/if}
    </Button>
    
    <Button 
      variant="danger"
      on:click={openRejectDialog}
      disabled={isProcessing || disabled}
    >
      <XCircle size={16} class="mr-1" />
      Reject
    </Button>
  {:else if status === "APPROVED"}
    <Button variant="success" disabled>
      <CheckCircle size={16} class="mr-1" />
      Approved
    </Button>
  {:else if status === "REJECTED"}
    <Button variant="danger" disabled>
      <XCircle size={16} class="mr-1" />
      Rejected
    </Button>
  {/if}
</div>

<!-- Rejection Dialog -->
{#if showRejectDialog}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
    <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
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
          variant="danger"
          on:click={handleReject}
          disabled={isProcessing}
        >
          {#if isProcessing}
            Processing...
          {:else}
            Confirm Rejection
          {/if}
        </Button>
      </div>
    </div>
  </div>
{/if}
