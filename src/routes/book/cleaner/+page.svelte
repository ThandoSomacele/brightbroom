<script lang="ts">
  import { goto } from "$app/navigation";
  import CleanerSelection from "$lib/components/booking/CleanerSelection.svelte";
  import StepTracker from "$lib/components/booking/StepTracker.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import { ArrowLeft, ArrowRight } from "lucide-svelte";
  import { onMount } from "svelte";

  let selectedCleanerId: string | null = null;
  let selectedCleaner: any = null;
  let serviceId: string | null = null;
  let address: { lat?: number; lng?: number } | null = null;
  let scheduledDate: string | null = null;

  onMount(() => {
    // Get booking data from localStorage
    serviceId = localStorage.getItem("booking_service");
    scheduledDate = localStorage.getItem("booking_date");

    // Get address coordinates if available
    const addressId = localStorage.getItem("booking_address");
    const guestAddressStr = localStorage.getItem("booking_guest_address");

    if (guestAddressStr) {
      try {
        const guestAddress = JSON.parse(guestAddressStr);
        address = {
          lat: guestAddress.lat,
          lng: guestAddress.lng,
        };
      } catch (e) {
        console.error("Error parsing guest address:", e);
      }
    }

    // Load previously selected cleaner if any
    const savedCleanerId = localStorage.getItem("booking_cleaner_id");
    const savedCleanerData = localStorage.getItem("booking_cleaner_data");
    if (savedCleanerId) {
      selectedCleanerId = savedCleanerId;
      if (savedCleanerData) {
        try {
          selectedCleaner = JSON.parse(savedCleanerData);
        } catch (e) {
          console.error("Error parsing cleaner data:", e);
        }
      }
    }
  });

  function handleCleanerSelect(event: CustomEvent) {
    selectedCleanerId = event.detail.cleanerId;
    selectedCleaner = event.detail.cleaner;

    // Save to localStorage
    localStorage.setItem("booking_cleaner_id", selectedCleanerId);
    localStorage.setItem(
      "booking_cleaner_data",
      JSON.stringify(selectedCleaner),
    );
  }

  function goBack() {
    goto("/book/schedule");
  }

  function goNext() {
    if (!selectedCleanerId) {
      alert("Please select a cleaner to continue");
      return;
    }
    goto("/book/review");
  }

  function skipCleanerSelection() {
    // Clear any previously selected cleaner
    localStorage.removeItem("booking_cleaner_id");
    localStorage.removeItem("booking_cleaner_data");
    goto("/book/review");
  }
</script>

<svelte:head>
  <title>Select Your Cleaner | BrightBroom</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-6xl">
  <!-- Progress Steps -->
  <div class="mb-8">
    <StepTracker currentStep={4} />
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

    <!-- Preference Notice -->
    <div class="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
      <p class="text-sm text-amber-800">
        <strong>Please note:</strong> Your cleaner selection is a <strong>preference</strong>, not a guarantee.
        Due to scheduling and transport logistics, a different cleaner may be assigned to your booking.
        If this happens, we'll notify you via email before your appointment.
      </p>
    </div>

    <!-- Navigation Buttons -->
    <div
      class="mt-8 flex flex-col md:flex-row gap-3 justify-between items-center"
    >
      <Button
        variant="outline"
        wide="full"
        on:click={goBack}
        class="flex items-center gap-2"
      >
        <ArrowLeft class="w-4 h-4" />
        Back to Schedule
      </Button>

      <div class="flex flex-col md:flex-row gap-3 w-full">
        <Button variant="outline" wide="full" on:click={skipCleanerSelection}>
          Skip Selection
        </Button>

        <Button
          variant="primary"
          wide="full"
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
