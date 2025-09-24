<!-- src/routes/book/review/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import StepTracker from "$lib/components/booking/StepTracker.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import {
    Calendar,
    MapPin,
    Clock,
    CreditCard,
    FileText,
    ArrowLeft,
    RotateCw,
    DollarSign,
  } from "lucide-svelte";

  // Get data from the server load function
  export let data;
  const { user, addresses, services, isAuthenticated, guestBookingData } = data;

  // Handle form result
  export let form;

  // Track booking data
  let selectedService = "";
  let selectedAddress = "";
  let selectedDate = "";
  let selectedTime = "";
  let notes = "";
  let selectedCleanerId = "";
  let selectedCleanerData: any = null;

  // Recurring booking data
  let isRecurring = false;
  let recurringFrequency = "";
  let recurringDays: string[] = [];
  let recurringMonthlyDates: number[] = [];
  let recurringTimeSlot = "";
  let discountPercentage = 0;
  let finalPrice = 0;
  let startDate = "";
  
  // Guest user data
  let guestAddress = null;

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
    // Check if this is a recurring booking
    isRecurring = localStorage.getItem("booking_is_recurring") === "true";

    if (isRecurring) {
      // Get recurring booking data
      recurringFrequency = localStorage.getItem("booking_recurring_frequency") || "";

      const daysStr = localStorage.getItem("booking_recurring_days");
      if (daysStr) {
        try {
          recurringDays = JSON.parse(daysStr);
        } catch (e) {
          recurringDays = [];
        }
      }

      const datesStr = localStorage.getItem("booking_recurring_monthly_dates");
      if (datesStr) {
        try {
          recurringMonthlyDates = JSON.parse(datesStr);
        } catch (e) {
          recurringMonthlyDates = [];
        }
      }

      recurringTimeSlot = localStorage.getItem("booking_recurring_time_slot") || "";
      discountPercentage = parseFloat(localStorage.getItem("booking_discount_percentage") || "0");
      finalPrice = parseFloat(localStorage.getItem("booking_final_price") || "0");
      startDate = localStorage.getItem("booking_start_date") || "";
    } else {
      // Get one-time booking data
      selectedDate = localStorage.getItem("booking_date") || "";
      selectedTime = localStorage.getItem("booking_time") || "";
    }

    // Get common booking data
    selectedService = localStorage.getItem("booking_service") || "";
    notes = localStorage.getItem("booking_instructions") || "";
    selectedCleanerId = localStorage.getItem("booking_cleaner_id") || "";
    
    // Get cleaner data if available
    const cleanerDataStr = localStorage.getItem("booking_cleaner_data");
    if (cleanerDataStr) {
      try {
        selectedCleanerData = JSON.parse(cleanerDataStr);
      } catch (e) {
        console.error("Error parsing cleaner data:", e);
      }
    }
    
    if (isAuthenticated) {
      // Authenticated user - get address ID
      selectedAddress = localStorage.getItem("booking_address") || "";
    } else {
      // Guest user - get guest address data from localStorage
      const guestAddressData = localStorage.getItem("booking_guest_address");
      if (guestAddressData) {
        try {
          guestAddress = JSON.parse(guestAddressData);
        } catch (e) {
          console.error("Error parsing guest address:", e);
        }
      }
      
      // Also check server-side guest booking data
      if (guestBookingData) {
        if (guestBookingData.guestAddress) {
          guestAddress = guestBookingData.guestAddress;
        }
        // Guest contact info is no longer stored (obtained during authentication)
      }
    }

    
    // Validation based on user type
    const hasValidAddressData = isAuthenticated ? selectedAddress : guestAddress;

    // Check if we have valid scheduling data
    const hasValidSchedule = isRecurring
      ? (recurringFrequency && recurringTimeSlot)
      : (selectedDate && selectedTime);

    // If required information is missing, redirect back
    if (
      !selectedService ||
      !hasValidSchedule ||
      !hasValidAddressData
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
      await goto("/book/cleaner");
    } catch (error) {
      console.error("Navigation error:", error);
      isLoading = false;
    }
  }

  // Handle form submission
  function handleSubmit() {
    // For authenticated users, check selectedAddress
    // For guest users, check guestAddress only (contact info will be collected at payment)
    const hasValidAddress = isAuthenticated ? selectedAddress : guestAddress;

    // Check if we have valid scheduling data
    const hasValidSchedule = isRecurring
      ? (recurringFrequency && recurringTimeSlot)
      : (selectedDate && selectedTime);

    if (
      !selectedService ||
      !hasValidAddress ||
      !hasValidSchedule
    ) {
      return;
    }

    isLoading = true;
    // Form submission is handled by the enhance action
  }

  // After successful booking
  function handleBookingSuccess(result: any) {
    if (result.isSubscription) {
      // For recurring bookings, create a subscription via API
      createSubscription();
    } else if (result.requiresAuth) {
      // Guest user needs to authenticate for recurring booking
      goto('/book/payment');
    } else if (result.bookingId) {
      // Clear localStorage booking data
      clearBookingData();

      // Navigate to payment page
      if (result.isGuest) {
        // Guest users go to payment gate first
        goto(`/book/payment?bookingId=${result.bookingId}`);
      } else {
        // Authenticated users go directly to payment processing
        goto(`/payment/process?bookingId=${result.bookingId}`);
      }
    }
  }

  // Create subscription for recurring booking
  async function createSubscription() {
    isLoading = true;

    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          serviceId: selectedService,
          addressId: selectedAddress,
          cleanerId: selectedCleanerId,
          frequency: recurringFrequency,
          preferredDays: recurringDays,
          preferredTimeSlot: recurringTimeSlot,
          monthlyDates: recurringMonthlyDates,
          basePrice: serviceDetails?.basePrice || 0,
          discountPercentage,
          finalPrice,
          startDate: startDate || new Date().toISOString(),
          notes
        })
      });

      const data = await response.json();

      if (data.success && data.redirectUrl) {
        // Clear booking data
        clearBookingData();

        // Redirect to PayFast for subscription setup
        window.location.href = data.redirectUrl;
      } else {
        alert('Failed to create subscription. Please try again.');
        isLoading = false;
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('An error occurred. Please try again.');
      isLoading = false;
    }
  }

  // Clear all booking data from localStorage
  function clearBookingData() {
    localStorage.removeItem("booking_service");
    localStorage.removeItem("booking_service_data");
    localStorage.removeItem("booking_address");
    localStorage.removeItem("booking_date");
    localStorage.removeItem("booking_time");
    localStorage.removeItem("booking_instructions");
    localStorage.removeItem("booking_cleaner_id");
    localStorage.removeItem("booking_cleaner_data");
    localStorage.removeItem("booking_guest_address");
    localStorage.removeItem("booking_is_recurring");
    localStorage.removeItem("booking_recurring_frequency");
    localStorage.removeItem("booking_recurring_days");
    localStorage.removeItem("booking_recurring_monthly_dates");
    localStorage.removeItem("booking_recurring_time_slot");
    localStorage.removeItem("booking_discount_percentage");
    localStorage.removeItem("booking_final_price");
    localStorage.removeItem("booking_start_date");
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
      <StepTracker currentStep={5} />
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
          {#if isRecurring}
            <!-- Recurring Schedule -->
            <div class="flex items-start">
              <RotateCw
                size={20}
                class="mr-3 mt-0.5 flex-shrink-0 text-primary"
              />
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Recurring Schedule</p>
                <p class="text-gray-600 dark:text-gray-300">
                  {recurringFrequency === 'WEEKLY' ? 'Weekly' :
                   recurringFrequency === 'BIWEEKLY' ? 'Bi-weekly' :
                   recurringFrequency === 'TWICE_WEEKLY' ? 'Twice weekly' :
                   recurringFrequency === 'TWICE_MONTHLY' ? 'Twice monthly' : ''}
                </p>
              </div>
            </div>

            {#if recurringDays.length > 0}
              <div class="flex items-start">
                <Calendar
                  size={20}
                  class="mr-3 mt-0.5 flex-shrink-0 text-primary"
                />
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">Preferred Days</p>
                  <p class="text-gray-600 dark:text-gray-300">
                    {recurringDays.join(', ')}
                  </p>
                </div>
              </div>
            {/if}

            {#if recurringMonthlyDates.length > 0}
              <div class="flex items-start">
                <Calendar
                  size={20}
                  class="mr-3 mt-0.5 flex-shrink-0 text-primary"
                />
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">Monthly Dates</p>
                  <p class="text-gray-600 dark:text-gray-300">
                    {recurringMonthlyDates.map(d => `${d}${d === 1 ? 'st' : d === 15 ? 'th' : 'th'}`).join(' and ')}
                  </p>
                </div>
              </div>
            {/if}

            <div class="flex items-start">
              <Clock size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Time Slot</p>
                <p class="text-gray-600 dark:text-gray-300">
                  {recurringTimeSlot}
                </p>
              </div>
            </div>

            {#if finalPrice > 0}
              <div class="flex items-start">
                <DollarSign size={20} class="mr-3 mt-0.5 flex-shrink-0 text-green-600" />
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">Price per Clean</p>
                  <p class="text-green-600 dark:text-green-400 font-semibold">
                    R{finalPrice.toFixed(2)} ({discountPercentage}% discount)
                  </p>
                </div>
              </div>
            {/if}
          {:else}
            <!-- One-time Schedule -->
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
          {/if}

          {#if addressDetails}
            <!-- Authenticated user address -->
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
          {:else if guestAddress}
            <!-- Guest user address -->
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
                  {guestAddress.street}
                  {#if guestAddress.streetNumber}, {guestAddress.streetNumber}{/if}
                  {#if guestAddress.aptUnit}, {guestAddress.aptUnit}{/if}<br
                  />
                  {guestAddress.city}, {guestAddress.state}
                  {guestAddress.zipCode}
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

    <!-- Selected Cleaner -->
    {#if selectedCleanerData}
      <div class="mb-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Your Cleaner
        </h2>
        
        <div class="flex items-center space-x-4">
          <img 
            src={selectedCleanerData.profileImageUrl || '/images/default-avatar.svg'} 
            alt={selectedCleanerData.name}
            class="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            on:error={(e) => {
              e.currentTarget.src = '/images/default-avatar.svg';
            }}
          />
          <div class="flex-1">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              {selectedCleanerData.name}
            </h3>
            {#if selectedCleanerData.rating}
              <div class="flex items-center gap-1 mt-1">
                <span class="text-yellow-500">{'★'.repeat(Math.floor(selectedCleanerData.rating))}{'☆'.repeat(5 - Math.floor(selectedCleanerData.rating))}</span>
                <span class="text-sm text-gray-600">({selectedCleanerData.rating})</span>
              </div>
            {/if}
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {selectedCleanerData.bio || 'Professional cleaner'}
            </p>
          </div>
        </div>
      </div>
    {/if}

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
          {isRecurring ? 'Recurring Payment' : 'Total'}
        </h2>

        {#if isRecurring && finalPrice > 0}
          <div class="text-right">
            <span class="text-2xl font-bold text-primary">
              R{finalPrice.toFixed(2)}
            </span>
            <p class="text-sm text-gray-600">per clean</p>
            {#if discountPercentage > 0}
              <p class="text-sm text-green-600 font-semibold">
                {discountPercentage}% discount applied
              </p>
            {/if}
          </div>
        {:else if serviceDetails}
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
        {#if isRecurring}
          Recurring subscription will be processed securely via PayFast.
          You can cancel or pause anytime with 48 hours notice.
        {:else}
          Prices include VAT. Payment will be processed securely via PayFast.
        {/if}
      </p>
    </div>

    <!-- Form submission -->
    <form
      method="POST"
      action="?/createBooking"
      use:enhance={({ formData }) => {
        isLoading = true;

        // Add recurring booking data if applicable
        if (isRecurring) {
          formData.set('isRecurring', 'true');
          formData.set('recurringFrequency', recurringFrequency);
          formData.set('recurringDays', JSON.stringify(recurringDays));
          formData.set('recurringMonthlyDates', JSON.stringify(recurringMonthlyDates));
          formData.set('recurringTimeSlot', recurringTimeSlot);
          formData.set('discountPercentage', discountPercentage.toString());
          formData.set('finalPrice', finalPrice.toString());
          formData.set('startDate', startDate);
        }

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
      {#if !isRecurring}
        <input type="hidden" name="scheduledDate" value={scheduledDateTime} />
      {/if}
      <input type="hidden" name="notes" value={notes} />
      <input type="hidden" name="cleanerId" value={selectedCleanerId} />

      {#if isAuthenticated}
        <!-- Authenticated user fields -->
        <input type="hidden" name="addressId" value={selectedAddress} />
      {:else}
        <!-- Guest user fields - only address data needed -->
        <input type="hidden" name="guestAddress" value={JSON.stringify(guestAddress || {})} />
      {/if}

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
            (isAuthenticated ? !selectedAddress : !guestAddress) ||
            (!isRecurring && (!selectedDate || !selectedTime)) ||
            (isRecurring && (!recurringFrequency || !recurringTimeSlot))}
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
