<script>
  import Button from "$lib/components/ui/Button.svelte";
</script>

<h1>Welcome to SvelteKit</h1>
<p>
  Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the
  documentation
</p>

<div class="flex min-h-screen flex-col items-center justify-center p-4">
  <div
    class="w-full max-w-md space-y-8 rounded-lg border p-8 shadow-lg dark:border-gray-700"
  >
    <div class="text-center">
      <h1 class="text-3xl font-bold text-primary">BrightBroom</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-300">
        On-demand cleaning services
      </p>
    </div>

    <div class="mt-6 grid grid-cols-2 gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  </div>
</div>
