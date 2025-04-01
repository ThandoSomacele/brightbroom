<!-- src/routes/book/review/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/Button.svelte";
  import {
    Calendar,
    MapPin,
    Clock,
    CreditCard,
    FileText,
    ArrowLeft,
  } from "lucide-svelte";

  // Get data from the server load function
  export let data;
  const { user, addresses, services } = data;

  // Handle form result
  export let form;

  // Track booking data
  let selectedService = "";
  let selectedAddress = "";
  let selectedDate = "";
  let selectedTime = "";
  let notes = "";

  // Track loading state
  let isLoading = false;

  // Computed values
  $: serviceDetails = services.find((s) => s.id === selectedService);
  $: addressDetails = addresses.find((a) => a.id === selectedAddress);
  $: scheduledDateTime =
    selectedDate && selectedTime ? `${selectedDate}T${selectedTime}` : "";

  // Initialize data from localStorage on mount
  import { onMount } from "svelte";
  import { parse, format } from "date-fns";

  onMount(() => {
    // Get selections from localStorage
    selectedService = localStorage.getItem("booking_service") || "";
    selectedAddress = localStorage.getItem("booking_address") || "";
    selectedDate = localStorage.getItem("booking_date") || "";
    selectedTime = localStorage.getItem("booking_time") || "";
    notes = localStorage.getItem("booking_instructions") || "";

    // If required information is missing, redirect back
    if (
      !selectedService ||
      !selectedAddress ||
      !selectedDate ||
      !selectedTime
    ) {
      goto("/book");
    }
  });

  // Format date for display
  function formatDate(dateString: string): string {
    try {
      const date = parse(dateString, "yyyy-MM-dd", new Date());
      return format(date, "EEEE, MMMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  }

  // Format time for display
  function formatTime(timeString: string): string {
    try {
      const time = parse(timeString, "HH:mm", new Date());
      return format(time, "h:mm a");
    } catch (e) {
      return timeString;
    }
  }

  // Go back to previous step
  async function goToPrevious() {
    isLoading = true;
    try {
      await goto("/book/schedule");
    } catch (error) {
      console.error("Navigation error:", error);
      isLoading = false;
    }
  }

  // Handle form submission
  function handleSubmit() {
    if (
      !selectedService ||
      !selectedAddress ||
      !selectedDate ||
      !selectedTime
    ) {
      return;
    }

    isLoading = true;
    // Form submission is handled by the enhance action
  }

  // After successful booking
  function handleBookingSuccess(result: any) {
    if (result.bookingId) {
      // Clear localStorage booking data
      localStorage.removeItem("booking_service");
      localStorage.removeItem("booking_address");
      localStorage.removeItem("booking_date");
      localStorage.removeItem("booking_time");
      localStorage.removeItem("booking_instructions");

      // Navigate to payment page
      goto(`/payment/process?bookingId=${result.bookingId}`);
    }
  }
</script>

<svelte:head>
  <title>Review Booking | BrightBroom</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
  <div class="mx-auto max-w-5xl">
    <!-- Page header -->
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Review Your Booking
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-300">
        Please confirm your booking details before proceeding to payment
      </p>
    </div>

    <!-- Progress steps -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div class="flex flex-1 items-center">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white"
          >
            <span>✓</span>
          </div>
          <div class="ml-2">
            <p class="text-sm font-medium text-green-500">Service</p>
          </div>
        </div>

        <div class="hidden flex-1 md:flex">
          <div class="h-1 w-full bg-primary"></div>
        </div>

        <div class="flex flex-1 items-center">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white"
          >
            <span>✓</span>
          </div>
          <div class="ml-2">
            <p class="text-sm font-medium text-green-500">Address</p>
          </div>
        </div>

        <div class="hidden flex-1 md:flex">
          <div class="h-1 w-full bg-primary"></div>
        </div>

        <div class="flex flex-1 items-center">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white"
          >
            <span>✓</span>
          </div>
          <div class="ml-2">
            <p class="text-sm font-medium text-green-500">Schedule</p>
          </div>
        </div>

        <div class="hidden flex-1 md:flex">
          <div class="h-1 w-full bg-primary"></div>
        </div>

        <div class="flex flex-1 items-center">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white"
          >
            <span>4</span>
          </div>
          <div class="ml-2">
            <p class="text-sm font-medium text-primary">Review</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Form error message -->
    {#if form?.error}
      <div
        class="mb-6 rounded-md bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-200"
      >
        <p>{form.error}</p>
      </div>
    {/if}

    <!-- Booking details -->
    <div class="mb-8 grid gap-6 md:grid-cols-2">
      <!-- Service details -->
      <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Service Details
        </h2>

        {#if serviceDetails}
          <div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              {serviceDetails.name}
            </h3>
            <p class="mt-1 text-gray-600 dark:text-gray-300">
              {serviceDetails.description}
            </p>
            <div
              class="mt-4 flex justify-between border-t border-gray-200 pt-3 dark:border-gray-700"
            >
              <span class="text-gray-600 dark:text-gray-300">Duration:</span>
              <span class="font-medium text-gray-900 dark:text-white">
                {serviceDetails.durationHours}
                {serviceDetails.durationHours === 1 ? "hour" : "hours"}
              </span>
            </div>
            <div class="mt-2 flex justify-between">
              <span class="text-gray-600 dark:text-gray-300">Price:</span>
              <span class="font-bold text-primary">
                R{typeof serviceDetails.basePrice === "number"
                  ? serviceDetails.basePrice.toFixed(2)
                  : parseFloat(serviceDetails.basePrice).toFixed(2)}
              </span>
            </div>
          </div>
        {:else}
          <p class="text-gray-500 dark:text-gray-400">
            Service information not available
          </p>
        {/if}
      </div>

      <!-- Schedule and location -->
      <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Schedule & Location
        </h2>

        <div class="space-y-4">
          <div class="flex items-start">
            <Calendar
              size={20}
              class="mr-3 mt-0.5 flex-shrink-0 text-primary"
            />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Date</p>
              <p class="text-gray-600 dark:text-gray-300">
                {formatDate(selectedDate)}
              </p>
            </div>
          </div>

          <div class="flex items-start">
            <Clock size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Time</p>
              <p class="text-gray-600 dark:text-gray-300">
                {formatTime(selectedTime)}
              </p>
            </div>
          </div>

          {#if addressDetails}
            <div class="flex items-start">
              <MapPin
                size={20}
                class="mr-3 mt-0.5 flex-shrink-0 text-primary"
              />
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  Location
                </p>
                <p class="text-gray-600 dark:text-gray-300">
                  {addressDetails.street}
                  {#if addressDetails.aptUnit}, {addressDetails.aptUnit}{/if}<br
                  />
                  {addressDetails.city}, {addressDetails.state}
                  {addressDetails.zipCode}
                </p>
              </div>
            </div>
          {:else}
            <p class="text-gray-500 dark:text-gray-400">
              Address information not available
            </p>
          {/if}
        </div>
      </div>
    </div>

    <!-- Special instructions -->
    {#if notes}
      <div class="mb-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <h2
          class="mb-3 flex items-center text-xl font-semibold text-gray-900 dark:text-white"
        >
          <FileText size={20} class="mr-2 text-primary" />
          Special Instructions
        </h2>

        <p class="text-gray-700 dark:text-gray-300">{notes}</p>
      </div>
    {/if}

    <!-- Total and payment -->
    <div class="mb-8 rounded-lg bg-primary-50 p-6 dark:bg-primary-900/20">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          Total
        </h2>

        {#if serviceDetails}
          <span class="text-2xl font-bold text-primary">
            R{typeof serviceDetails.basePrice === "number"
              ? serviceDetails.basePrice.toFixed(2)
              : parseFloat(serviceDetails.basePrice).toFixed(2)}
          </span>
        {:else}
          <span class="text-2xl font-bold text-primary">R0.00</span>
        {/if}
      </div>

      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Prices include VAT. Payment will be processed
        securely via PayFast.
      </p>
    </div>

    <!-- Form submission -->
    <form
      method="POST"
      action="?/createBooking"
      use:enhance={({ formData }) => {
        isLoading = true;

        return async ({ result, update }) => {
          isLoading = false;

          if (result.type === "success" && result.data.success) {
            handleBookingSuccess(result.data);
          } else {
            await update();
          }
        };
      }}
    >
      <!-- Hidden fields to carry booking data -->
      <input type="hidden" name="serviceId" value={selectedService} />
      <input type="hidden" name="addressId" value={selectedAddress} />
      <input type="hidden" name="scheduledDate" value={scheduledDateTime} />
      <input type="hidden" name="notes" value={notes} />

      <!-- Navigation buttons -->
      <div class="flex justify-between">
        <Button type="button" variant="outline" on:click={goToPrevious}>
          <ArrowLeft size={18} class="mr-2" />
          Back
        </Button>

        <Button
          type="submit"
          variant="primary"
          disabled={isLoading ||
            !selectedService ||
            !selectedAddress ||
            !selectedDate ||
            !selectedTime}
        >
          {#if isLoading}
            <svg
              class="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing...
          {:else}
            Confirm & Pay <CreditCard size={18} class="ml-2" />
          {/if}
        </Button>
      </div>
    </form>
  </div>
</div>
