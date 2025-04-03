<!-- src/lib/components/admin/EmailTriggerButton.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Mail } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';

  // Props
  export let bookingId: string;
  export let userEmail: string;
  export let emailType: 'confirmation' | 'receipt' = 'confirmation';
  export let disabled = false;
  export let variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'outline';
  
  // State
  let loading = false;
  let success = false;
  let error: string | null = null;
  
  const dispatch = createEventDispatcher();
  
  // Action to send the email
  async function sendEmail() {
    if (loading || disabled) return;
    
    loading = true;
    success = false;
    error = null;
    
    try {
      // Determine endpoint based on email type
      const endpoint = emailType === 'confirmation' 
        ? `/api/admin/bookings/${bookingId}/send-confirmation`
        : `/api/admin/bookings/${bookingId}/send-receipt`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: userEmail })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }
      
      success = true;
      dispatch('success', { type: emailType });
      
      // Reset success after 3 seconds
      setTimeout(() => {
        success = false;
      }, 3000);
    } catch (err) {
      console.error('Error sending email:', err);
      error = err instanceof Error ? err.message : 'Unknown error occurred';
      
      dispatch('error', { message: error, type: emailType });
    } finally {
      loading = false;
    }
  }
</script>

<div class="inline-block">
  <Button 
    {variant}
    size="sm"
    on:click={sendEmail}
    disabled={disabled || loading}
    title={emailType === 'confirmation' ? 'Send booking confirmation email' : 'Send payment receipt email'}
  >
    {#if loading}
      <svg class="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Sending...
    {:else if success}
      <svg class="mr-2 h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>
      Sent!
    {:else}
      <Mail size={16} class="mr-2" />
      {emailType === 'confirmation' ? 'Send Confirmation' : 'Send Receipt'}
    {/if}
  </Button>
  
  {#if error}
    <p class="mt-1 text-xs text-red-500">{error}</p>
  {/if}
</div>
