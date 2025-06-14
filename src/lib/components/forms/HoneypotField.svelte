<!-- src/lib/components/forms/HoneypotField.svelte -->
<script lang="ts">
  /**
   * Honeypot Anti-Spam Component
   * 
   * This creates invisible form fields that only bots will fill out.
   * If any of these fields have values, we know it's a bot submission.
   * 
   * The fields use common names that bots often target like "email", "website", etc.
   * but are hidden from real users with CSS.
   */

  // Optional: Allow customization of field names for different forms
  export let fieldPrefix: string = "trap";
  
  // Generate unique field names for this form instance
  const fields = [
    `${fieldPrefix}_email`,      // Bots love email fields
    `${fieldPrefix}_website`,    // Common bot target
    `${fieldPrefix}_phone`,      // Another common target
    `${fieldPrefix}_company`     // Business forms often get this
  ];
</script>

<!-- 
  Honeypot fields - completely invisible to users but visible to bots
  
  CSS Strategy:
  1. position: absolute; left: -9999px; - Moves fields far off-screen
  2. opacity: 0; - Makes them transparent
  3. pointer-events: none; - Prevents accidental interaction
  4. tabindex="-1" - Removes from tab order for accessibility
  5. aria-hidden="true" - Hides from screen readers
-->

<div class="honeypot-container" style="position: absolute; left: -9999px; opacity: 0; pointer-events: none; height: 0; overflow: hidden;">
  <!-- Email honeypot - most common bot target -->
  <label for={fields[0]} style="display: none;">Email (leave blank)</label>
  <input
    type="email"
    id={fields[0]}
    name={fields[0]}
    value=""
    tabindex="-1"
    autocomplete="new-password"
    aria-hidden="true"
    style="position: absolute; left: -9999px; opacity: 0; height: 0; border: 0; padding: 0;"
  />

  <!-- Website honeypot -->
  <label for={fields[1]} style="display: none;">Website (leave blank)</label>
  <input
    type="url"
    id={fields[1]}
    name={fields[1]}
    value=""
    tabindex="-1"
    autocomplete="new-password"
    aria-hidden="true"
    style="position: absolute; left: -9999px; opacity: 0; height: 0; border: 0; padding: 0;"
  />

  <!-- Phone honeypot -->
  <label for={fields[2]} style="display: none;">Phone (leave blank)</label>
  <input
    type="tel"
    id={fields[2]}
    name={fields[2]}
    value=""
    tabindex="-1"
    autocomplete="new-password"
    aria-hidden="true"
    style="position: absolute; left: -9999px; opacity: 0; height: 0; border: 0; padding: 0;"
  />

  <!-- Company honeypot -->
  <label for={fields[3]} style="display: none;">Company (leave blank)</label>
  <input
    type="text"
    id={fields[3]}
    name={fields[3]}
    value=""
    tabindex="-1"
    autocomplete="new-password"
    aria-hidden="true"
    style="position: absolute; left: -9999px; opacity: 0; height: 0; border: 0; padding: 0;"
  />

  <!-- Time-based honeypot - tracks form fill time -->
  <input
    type="hidden"
    name="form_start_time"
    value={Date.now().toString()}
  />
</div>

<style>
  /* Additional CSS protection in case inline styles fail */
  .honeypot-container {
    position: absolute !important;
    left: -9999px !important;
    opacity: 0 !important;
    pointer-events: none !important;
    height: 0 !important;
    overflow: hidden !important;
    visibility: hidden !important;
  }

  .honeypot-container input {
    position: absolute !important;
    left: -9999px !important;
    opacity: 0 !important;
    height: 0 !important;
    border: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 0 !important;
  }

  /* Hide from print */
  @media print {
    .honeypot-container {
      display: none !important;
    }
  }
</style>
