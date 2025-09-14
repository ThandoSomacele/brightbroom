<!-- CSRFToken.svelte - Hidden input field for CSRF protection -->
<script lang="ts">
  import { page } from '$app/stores';

  // Get CSRF token from page data
  $: csrfToken = $page.data.csrf;
</script>

{#if csrfToken}
  <input type="hidden" name="csrf_token" value={csrfToken} />
{/if}