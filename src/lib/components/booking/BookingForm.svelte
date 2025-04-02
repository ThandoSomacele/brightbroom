<!-- src/lib/components/booking/BookingForm.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import ServiceDetailsModal from "$lib/components/booking/ServiceDetailsModal.svelte";
  import {
    fetchServices,
    services,
    servicesError,
    servicesLoading,
  } from "$lib/stores/services";
  import type { Service } from "@prisma/client";
  import { format } from "date-fns";
  import {
    Calendar,
    Clock,
    CreditCard,
    Home,
    Info,
    MapPin,
  } from "lucide-svelte";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";

  // Props
  export let addresses: {
    id: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
  }[] = [];

  // Form state
  let selectedService: string = "";
  let selectedAddress: string = "";
  let selectedDate: string = "";
  let selectedTime: string = "";
  let additionalNotes: string = "";
  let currentStep = 1;
  let isLoading = false;
  let showServiceDetails = false;
  let selectedServiceForDetails: Service | null = null;

  // Derived values
  $: selectedServiceDetails = $services.find((s) => s.id === selectedService);
  $: estimatedPrice = selectedServiceDetails?.basePrice ?? 0;
  $: formattedPrice = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(Number(estimatedPrice));

  // Available time slots (would come from API in real app)
  let timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00"];

  // Initialize form with today's date
  onMount(async () => {
    const today = new Date();
    selectedDate = format(today, "yyyy-MM-dd");

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const serviceId = urlParams.get("service");

    // Load services if needed
    await loadServices();

    // Pre-select service if provided in URL
    if (serviceId && $services.some((s) => s.id === serviceId)) {
      selectedService = serviceId;
    }
  });

  // Load services
  async function loadServices() {
    if ($services.length === 0) {
      try {
        await fetchServices();
      } catch (error) {
        console.error("Error loading services:", error);
      }
    }
  }

  // Form submission
  async function handleSubmit() {
    if (!isValidStep(currentStep)) return;

    if (currentStep < 4) {
      currentStep++;
      return;
    }

    isLoading = true;

    try {
      // In a real app, this would be an API call
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: selectedService,
          addressId: selectedAddress,
          scheduledDate: `${selectedDate}T${selectedTime}:00`,
          notes: additionalNotes,
        }),
      });

      if (!response.ok) throw new Error("Failed to create booking");

      const data = await response.json();
      goto(`/payment?bookingId=${data.id}`);
    } catch (error) {
      console.error("Error creating booking:", error);
      // Show error toast here
    } finally {
      isLoading = false;
    }
  }

  // Validation
  function isValidStep(step: number): boolean {
    switch (step) {
      case 1:
        return !!selectedService;
      case 2:
        return !!selectedAddress;
      case 3:
        return !!selectedDate && !!selectedTime;
      case 4:
        return true; // Review step, nothing to validate
      default:
        return false;
    }
  }

  // Navigation between steps
  function goToPreviousStep() {
    if (currentStep > 1) currentStep--;
  }

  // Show service details modal
  function showDetails(service: Service) {
    selectedServiceForDetails = service;
    showServiceDetails = true;
  }
</script>

<div
  class="w-full max-w-4xl mx-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md"
>
  <!-- Booking progress indicator -->
  <div class="mb-8">
    <div class="flex justify-between items-center mb-2">
      {#each ["Service", "Location", "Schedule", "Review"] as step, i}
        <div class="flex flex-col items-center">
          <div
            class={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${
              i + 1 < currentStep
                ? "bg-primary text-white"
                : i + 1 === currentStep
                  ? "bg-primary-100 text-primary-600 border-2 border-primary"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            }`}
          >
            {i + 1}
          </div>
          <span class="text-xs mt-1 text-gray-600 dark:text-gray-300"
            >{step}</span
          >
        </div>

        {#if i < 3}
          <div
            class={`flex-1 h-1 mx-2 ${i + 1 < currentStep ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"}`}
          ></div>
        {/if}
      {/each}
    </div>
  </div>

  <form
    on:submit|preventDefault={handleSubmit}
    class="space-y-6"
    transition:fade={{ duration: 200 }}
  >
    <!-- Step 1: Service Selection -->
    {#if currentStep === 1}
      <div class="space-y-4">
        <h2
          class="text-xl font-semibold text-gray-800 dark:text-white flex items-center"
        >
          <Home class="mr-2 text-primary" size={20} />
          Select Cleaning Service
        </h2>

        {#if $servicesLoading}
          <div class="py-8 flex justify-center">
            <div
              class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"
            ></div>
          </div>
        {:else if $servicesError}
          <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
            <p class="text-red-700 dark:text-red-300">
              {$servicesError}
            </p>
            <button
              type="button"
              class="mt-2 text-primary hover:underline"
              on:click={loadServices}
            >
              Try Again
            </button>
          </div>
        {:else if $services.length === 0}
          <div class="p-8 text-center">
            <p class="text-gray-500 dark:text-gray-400">
              No services available. Please try again later.
            </p>
          </div>
        {:else}
          {#each $services as service}
            <label
              class="block p-4 border rounded-lg cursor-pointer hover:border-primary-200 transition-colors
              {selectedService === service.id
                ? 'border-primary bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700'}"
            >
              <div class="flex items-start justify-between">
                <div class="flex items-start">
                  <input
                    type="radio"
                    name="service"
                    value={service.id}
                    bind:group={selectedService}
                    class="mt-1 text-primary focus:ring-primary"
                  />
                  <div class="ml-3">
                    <h3 class="font-medium text-gray-900 dark:text-white">
                      {service.name}
                    </h3>
                    <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">
                      {service.description}
                    </p>
                    <p class="text-primary font-medium mt-2">
                      R{service.basePrice} · {service.durationHours}
                      {service.durationHours === 1 ? "hour" : "hours"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  class="text-primary hover:text-primary-600 flex items-center text-sm"
                  on:click|preventDefault|stopPropagation={() =>
                    showDetails(service)}
                >
                  <Info size={16} class="mr-1" />
                  Details
                </button>
              </div>
            </label>
          {/each}
        {/if}
      </div>
    {/if}

    <!-- Step 2: Address Selection -->
    {#if currentStep === 2}
      <div class="space-y-4">
        <h2
          class="text-xl font-semibold text-gray-800 dark:text-white flex items-center"
        >
          <MapPin class="mr-2 text-primary" size={20} />
          Select Cleaning Location
        </h2>

        {#if addresses.length === 0}
          <div
            class="p-8 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-lg"
          >
            <p class="text-gray-500 dark:text-gray-400 mb-4">
              You don't have any saved addresses yet.
            </p>
            <button
              type="button"
              class="inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 bg-primary hover:bg-primary-600 text-white focus-visible:ring-primary-500"
              on:click={() => goto("/profile/addresses/new?redirect=booking")}
            >
              Add New Address
            </button>
          </div>
        {:else}
          {#each addresses as address}
            <label
              class="block p-4 border rounded-lg cursor-pointer hover:border-primary-200 transition-colors
              {selectedAddress === address.id
                ? 'border-primary bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700'}"
            >
              <div class="flex items-start">
                <input
                  type="radio"
                  name="address"
                  value={address.id}
                  bind:group={selectedAddress}
                  class="mt-1 text-primary focus:ring-primary"
                />
                <div class="ml-3">
                  <h3 class="font-medium text-gray-900 dark:text-white">
                    {address.street}
                  </h3>
                  <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    {address.city}, {address.state}
                    {address.zipCode}
                  </p>
                </div>
              </div>
            </label>
          {/each}

          <button
            type="button"
            class="w-full py-2 px-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg
              text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors"
            on:click={() => goto("/profile/addresses/new?redirect=booking")}
          >
            + Add New Address
          </button>
        {/if}
      </div>
    {/if}

    <!-- Step 3: Date & Time Selection -->
    {#if currentStep === 3}
      <div class="space-y-6">
        <h2
          class="text-xl font-semibold text-gray-800 dark:text-white flex items-center"
        >
          <Calendar class="mr-2 text-primary" size={20} />
          Select Date & Time
        </h2>

        <div class="space-y-4">
          <label class="block">
            <span class="text-gray-700 dark:text-gray-300 mb-1 block"
              >Select Date</span
            >
            <input
              type="date"
              bind:value={selectedDate}
              min={format(new Date(), "yyyy-MM-dd")}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </label>

          <div>
            <span class="text-gray-700 dark:text-gray-300 mb-1 block"
              >Select Time</span
            >
            <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {#each timeSlots as time}
                <label class="cursor-pointer">
                  <input
                    type="radio"
                    name="time"
                    value={time}
                    bind:group={selectedTime}
                    class="sr-only"
                  />
                  <div
                    class={`text-center py-2 px-2 rounded-md border transition-colors
                    ${
                      selectedTime === time
                        ? "bg-primary text-white border-primary"
                        : "border-gray-300 dark:border-gray-600 hover:border-primary-200"
                    }`}
                  >
                    <Clock size={16} class="mx-auto mb-1" />
                    <span class="text-sm">{time}</span>
                  </div>
                </label>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Step 4: Review & Confirm -->
    {#if currentStep === 4}
      <div class="space-y-6">
        <h2
          class="text-xl font-semibold text-gray-800 dark:text-white flex items-center"
        >
          <CreditCard class="mr-2 text-primary" size={20} />
          Review & Confirm
        </h2>

        <div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-4">
          {#if selectedServiceDetails}
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-300">Service:</span>
              <span class="font-medium text-gray-900 dark:text-white"
                >{selectedServiceDetails.name}</span
              >
            </div>
          {/if}

          {#if selectedAddress}
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-300">Location:</span>
              <span
                class="font-medium text-gray-900 dark:text-white truncate ml-4 text-right"
              >
                {addresses.find((a) => a.id === selectedAddress)?.street},
                {addresses.find((a) => a.id === selectedAddress)?.city}
              </span>
            </div>
          {/if}

          {#if selectedDate && selectedTime}
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-300">Date & Time:</span>
              <span class="font-medium text-gray-900 dark:text-white">
                {format(new Date(selectedDate), "MMM d, yyyy")} at {selectedTime}
              </span>
            </div>
          {/if}

          <div class="pt-2 border-t border-gray-200 dark:border-gray-600">
            <div class="flex justify-between text-lg">
              <span class="font-medium text-gray-900 dark:text-white"
                >Total:</span
              >
              <span class="font-bold text-primary">{formattedPrice}</span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Prices include VAT.
            </p>
          </div>
        </div>

        <div>
          <label class="block">
            <span class="text-gray-700 dark:text-gray-300 mb-1 block"
              >Additional Notes</span
            >
            <textarea
              bind:value={additionalNotes}
              placeholder="Any special instructions for the cleaner..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[100px]"
            ></textarea>
          </label>
        </div>
      </div>
    {/if}

    <!-- Navigation buttons -->
    <div
      class="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700"
    >
      {#if currentStep > 1}
        <button
          type="button"
          on:click={goToPreviousStep}
          class="px-4 py-2 text-gray-600 dark:text-gray-300 hover:underline focus:outline-none"
        >
          Back
        </button>
      {:else}
        <div></div>
        <!-- Empty div for spacing -->
      {/if}

      <button
        type="submit"
        disabled={!isValidStep(currentStep) || isLoading}
        class="px-6 py-2 bg-primary hover:bg-primary-600 text-white rounded-md
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
          disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {#if isLoading}
          <span class="inline-block animate-pulse">Loading...</span>
        {:else if currentStep < 4}
          Continue
        {:else}
          Confirm & Pay
        {/if}
      </button>
    </div>
  </form>
</div>

<!-- Service Details Modal -->
{#if showServiceDetails && selectedServiceForDetails}
  <ServiceDetailsModal
    service={selectedServiceForDetails}
    on:close={() => (showServiceDetails = false)}
  />
{/if}
