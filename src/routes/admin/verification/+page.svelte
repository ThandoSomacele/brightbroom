<!-- src/routes/admin/verification/+page.svelte -->
<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import Button from "$lib/components/ui/Button.svelte";
  import { CheckCircle2, Clock, FileText, Trash2, Upload, XCircle } from "lucide-svelte";

  export let data;

  let uploading: string | null = null;
  let errorMessage: string | null = null;

  $: status = data.tenant.verificationStatus;
  $: outstanding = data.outstandingRequired;

  async function upload(type: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    uploading = type;
    errorMessage = null;
    try {
      const body = new FormData();
      body.append("type", type);
      body.append("document", file);

      const response = await fetch("/api/tenant/documents", { method: "POST", body });
      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.message ?? "Upload failed. Please try again.");
      }
      await invalidateAll();
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : "Upload failed.";
    } finally {
      uploading = null;
      input.value = ""; // let the same file be re-picked after a failure
    }
  }

  async function remove(type: string) {
    uploading = type;
    errorMessage = null;
    try {
      const response = await fetch("/api/tenant/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!response.ok) throw new Error("Could not remove that document.");
      await invalidateAll();
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : "Could not remove that document.";
    } finally {
      uploading = null;
    }
  }
</script>

<svelte:head>
  <title>Verification | {data.tenant.name}</title>
</svelte:head>

<div class="max-w-3xl space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Verification</h1>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      We check these documents before {data.tenant.name} can take bookings and receive
      payouts.
    </p>
  </div>

  <!-- Status -->
  {#if status === "APPROVED"}
    <div class="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
      <CheckCircle2 class="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
      <div>
        <p class="font-medium text-green-800 dark:text-green-400">Verified</p>
        <p class="text-sm text-green-700 dark:text-green-500">
          Your company is active and can take bookings.
        </p>
      </div>
    </div>
  {:else if status === "SUBMITTED"}
    <div class="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
      <Clock class="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
      <div>
        <p class="font-medium text-blue-800 dark:text-blue-400">With us for review</p>
        <p class="text-sm text-blue-700 dark:text-blue-500">
          Everything is in. We'll email you once it has been checked. You can keep
          setting up in the meantime.
        </p>
      </div>
    </div>
  {:else if status === "REJECTED"}
    <div class="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
      <XCircle class="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
      <div>
        <p class="font-medium text-red-800 dark:text-red-400">Needs attention</p>
        <p class="text-sm text-red-700 dark:text-red-500">
          {data.tenant.verificationNotes ??
            "Something was not right with the documents. Please replace them and we'll take another look."}
        </p>
      </div>
    </div>
  {:else}
    <div class="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
      <Clock class="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div>
        <p class="font-medium text-amber-800 dark:text-amber-400">
          {outstanding}
          {outstanding === 1 ? "document" : "documents"} still needed
        </p>
        <p class="text-sm text-amber-700 dark:text-amber-500">
          Upload what's required and we'll review it. You can add your team and
          cleaners while you wait.
        </p>
      </div>
    </div>
  {/if}

  {#if errorMessage}
    <div class="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
      <p class="text-sm text-red-800 dark:text-red-400">{errorMessage}</p>
    </div>
  {/if}

  <!-- Requirements -->
  <div class="divide-y divide-gray-200 rounded-lg bg-white shadow dark:divide-gray-700 dark:bg-gray-800">
    {#each data.requirements as requirement}
      <div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-start gap-3">
          <div class="mt-0.5">
            {#if requirement.document}
              <CheckCircle2 class="h-5 w-5 text-green-600 dark:text-green-400" />
            {:else if requirement.required}
              <FileText class="h-5 w-5 text-amber-500" />
            {:else}
              <FileText class="h-5 w-5 text-gray-300 dark:text-gray-600" />
            {/if}
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {requirement.label}
              {#if !requirement.required}
                <span class="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                  (optional)
                </span>
              {/if}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{requirement.hint}</p>
            {#if requirement.document}
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {requirement.document.fileName ?? "Uploaded"}
              </p>
            {/if}
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          {#if requirement.document}
            <Button
              variant="ghost"
              size="sm"
              href={requirement.document.fileUrl}
              target="_blank"
            >
              View
            </Button>
            <button
              type="button"
              class="text-red-400 hover:text-red-600 disabled:opacity-50"
              title="Remove document"
              disabled={uploading === requirement.type}
              on:click={() => remove(requirement.type)}
            >
              <Trash2 class="h-4 w-4" />
            </button>
          {:else}
            <label
              class="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <Upload class="h-4 w-4" />
              {uploading === requirement.type ? "Uploading..." : "Upload"}
              <input
                type="file"
                class="hidden"
                accept=".pdf,image/*"
                disabled={uploading !== null}
                on:change={(e) => upload(requirement.type, e)}
              />
            </label>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <p class="text-xs text-gray-500 dark:text-gray-400">
    PDFs or photos, up to 10MB each. Documents are stored securely and used only to
    verify your company. The optional ones aren't needed to get started, but sending
    them can save a follow-up.
  </p>
</div>
