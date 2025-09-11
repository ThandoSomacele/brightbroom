<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import CleanerSelection from '$lib/components/booking/CleanerSelection.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { ArrowLeft, ArrowRight } from 'lucide-svelte';
  
  export let data;
  
  let selectedCleanerId: string | null = null;
  let selectedCleaner: any = null;
  let serviceId: string | null = null;
  let address: { lat?: number; lng?: number } | null = null;
  let scheduledDate: string | null = null;
  
  onMount(() => {
    // Get booking data from localStorage
    serviceId = localStorage.getItem('booking_service');
    scheduledDate = localStorage.getItem('booking_date');
    
    // Get address coordinates if available
    const addressId = localStorage.getItem('booking_address');
    const guestAddressStr = localStorage.getItem('booking_guest_address');
    
    if (guestAddressStr) {
      try {
        const guestAddress = JSON.parse(guestAddressStr);
        address = {
          lat: guestAddress.lat,
          lng: guestAddress.lng,
        };
      } catch (e) {
        console.error('Error parsing guest address:', e);
      }
    }
    
    // Load previously selected cleaner if any
    const savedCleanerId = localStorage.getItem('booking_cleaner_id');
    const savedCleanerData = localStorage.getItem('booking_cleaner_data');
    if (savedCleanerId) {
      selectedCleanerId = savedCleanerId;
      if (savedCleanerData) {
        try {
          selectedCleaner = JSON.parse(savedCleanerData);
        } catch (e) {
          console.error('Error parsing cleaner data:', e);
        }
      }
    }
  });
  
  function handleCleanerSelect(event: CustomEvent) {
    selectedCleanerId = event.detail.cleanerId;
    selectedCleaner = event.detail.cleaner;
    
    // Save to localStorage
    localStorage.setItem('booking_cleaner_id', selectedCleanerId);
    localStorage.setItem('booking_cleaner_data', JSON.stringify(selectedCleaner));
  }
  
  function goBack() {
    goto('/book/schedule');
  }
  
  function goNext() {
    if (!selectedCleanerId) {
      alert('Please select a cleaner to continue');
      return;
    }
    goto('/book/review');
  }
  
  function skipCleanerSelection() {
    // Clear any previously selected cleaner
    localStorage.removeItem('booking_cleaner_id');
    localStorage.removeItem('booking_cleaner_data');
    goto('/book/review');
  }
</script>

<svelte:head>
  <title>Select Your Cleaner | BrightBroom</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-6xl">
  <!-- Progress Steps -->
  <div class="mb-8">
    <div class="flex items-center justify-center space-x-4">
      <div class="flex items-center">
        <div class="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
          ✓
        </div>
        <span class="ml-2 text-sm text-gray-600">Service</span>
      </div>
      <div class="w-12 h-px bg-gray-300"></div>
      <div class="flex items-center">
        <div class="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
          ✓
        </div>
        <span class="ml-2 text-sm text-gray-600">Address</span>
      </div>
      <div class="w-12 h-px bg-gray-300"></div>
      <div class="flex items-center">
        <div class="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
          ✓
        </div>
        <span class="ml-2 text-sm text-gray-600">Schedule</span>
      </div>
      <div class="w-12 h-px bg-gray-300"></div>
      <div class="flex items-center">
        <div class="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
          4
        </div>
        <span class="ml-2 text-sm font-semibold text-gray-900">Cleaner</span>
      </div>
      <div class="w-12 h-px bg-gray-300"></div>
      <div class="flex items-center">
        <div class="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-semibold">
          5
        </div>
        <span class="ml-2 text-sm text-gray-600">Review</span>
      </div>
    </div>
  </div>
  
  <!-- Main Content -->
  <div class="bg-white rounded-lg shadow-lg p-6">
    <CleanerSelection
      bind:selectedCleanerId
      {serviceId}
      {address}
      {scheduledDate}
      on:select={handleCleanerSelect}
    />
    
    <!-- Optional Selection -->
    <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <p class="text-sm text-blue-800">
        <strong>Note:</strong> Selecting a cleaner is optional. If you skip this step, we'll automatically assign the best available cleaner for your booking.
      </p>
    </div>
    
    <!-- Navigation Buttons -->
    <div class="mt-8 flex justify-between items-center">
      <Button
        variant="outline"
        on:click={goBack}
        class="flex items-center gap-2"
      >
        <ArrowLeft class="w-4 h-4" />
        Back to Schedule
      </Button>
      
      <div class="flex gap-3">
        <Button
          variant="outline"
          on:click={skipCleanerSelection}
        >
          Skip Selection
        </Button>
        
        <Button
          variant="primary"
          on:click={goNext}
          disabled={!selectedCleanerId}
          class="flex items-center gap-2"
        >
          Continue to Review
          <ArrowRight class="w-4 h-4" />
        </Button>
      </div>
    </div>
  </div>
</div>