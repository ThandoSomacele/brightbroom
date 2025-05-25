<!-- src/routes/auth/logout/+page.svelte -->
<script lang="ts">
    import Button from "$lib/components/ui/Button.svelte";
  import { onMount } from "svelte";

  let formElement: HTMLFormElement;

  onMount(() => {
    // Auto-submit the form
    if (formElement) {
      formElement.submit();
    }
  });
</script>

<div
  class="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900"
>
  <div
    class="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800"
  >
    <h1 class="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
      Signing out...
    </h1>
    <p class="text-gray-600 dark:text-gray-300">
      Please wait while we sign you out.
    </p>

    <form method="POST" bind:this={formElement} class="mt-4">
      <Button variant="primary" type="submit" class="w-full">
        Click here if you're not redirected
      </Button>
    </form>
  </div>
</div>
