<!-- src/routes/admin/+error.svelte -->
<script lang="ts">
  import { page } from "$app/stores";
  import Button from "$lib/components/ui/Button.svelte";

  $: status = $page.status;
  $: message = $page.error?.message || "Something went wrong";
</script>

<div class="p-8 text-center">
  <h1 class="mb-4 text-3xl font-bold">Admin Error</h1>
  <p>There was an error in the admin section: {status} - {message}</p>
  <Button variant="primary" href="/admin/dashboard" class="mt-4">
    Back to Admin Dashboard
  </Button>
</div>
