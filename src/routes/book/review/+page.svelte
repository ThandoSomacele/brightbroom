<!-- src/routes/book/review/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { parse, format } from "date-fns";
  
  import Button from "$lib/components/ui/Button.svelte";
  import {
    Calendar,
    MapPin,
    Clock,
    CreditCard,
    FileText,
    ArrowLeft,
    User,
    Mail,
    Phone
  } from "lucide-svelte";
  
  import { GuestBookingService } from "$lib/stores/guest-booking";

  // Get data from the server load function
  export let data;
  const { user, isGuest, addresses, services } = data;

  // Handle form result
  export let form;

  // Track booking data
  let selectedService = "";
  let selectedAddress = "";
  let selectedDate = "";
  let selectedTime = "";
  let notes = "";
  let addressData: any = null;

  // Guest information
  let guestInfo = {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  };

  // Track loading state
  let isLoading = false;

  // Computed values
  $: serviceDetails = services.find((s) => s.id === selectedService);
  $: addressDetails = addresses.find((a) => a.id === selectedAddress);
  $: scheduledDateTime = selectedDate && selectedTime ? `${selectedDate}T${selectedTime}` : "";

  // Form validation
  let formErrors: { [key: string]: string } = {};

  onMount(() => {
    // Try to load from guest booking store first
    const guestBookingData = GuestBookingService.load();
    
    if (guestBookingData && GuestBookingService.isReadyForReview()) {
      selectedService = guestBookingData.serviceId;
      addressData = guestBookingData.addressData;
      
      if (guestBookingData.scheduledDate) {
        const [date, time] = guestBookingData.scheduledDate.split('T');
        selectedDate = date;
        selectedTime = time;
      }
      
      notes = guestBookingData.notes || '';
      
      // Load guest info if available
      if (guestBookingData.guestInfo) {
        guestInfo = { ...guestBookingData.guestInfo };
      }
    } else {
      // Fallback to legacy localStorage
      selectedService = localStorage.getItem("booking_service") || "";
      selectedAddress = localStorage.getItem("booking_address") || "";
      selectedDate = localStorage.getItem("booking_date") || "";
      selectedTime = localStorage.getItem("booking_time") || "";
      notes = localStorage.getItem("booking_instructions") || "";
    }

    // Validate we have required information
    if (!selectedService) {
      goto("/book");
      return;
    }

    if (isGuest && !addressData?.formatted) {
      goto("/book/address");
      return;
    }

    if (!isGuest && !selectedAddress) {
      goto("/book/address");
      return;
    }

    if (!selectedDate || !selectedTime) {
      goto("/book/schedule");
      return;
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

  // Validate guest information
  function validateGuestInfo(): boolean {
    formErrors = {};
    let isValid = true;

    if (!guestInfo.firstName.trim()) {
      formErrors.firstName = 'First name is required';
      isValid = false;
    }

    if (!guestInfo.lastName.trim()) {
      formErrors.lastName = 'Last name is required';
      isValid = false;
    }

    if (!guestInfo.email.trim()) {
      formErrors.email = 'Email is required';
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guestInfo.email)) {
        formErrors.email = 'Please enter a valid email address';
        isValid = false;
      }
    }

    return isValid;
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

  // After successful booking
  function handleBookingSuccess(result: any) {
    if (result.bookingId) {
      // Clear localStorage booking data
      localStorage.removeItem("booking_service");
      localStorage.removeItem("booking_address");
      localStorage.removeItem("booking_date");
      localStorage.removeItem("booking_time");
      localStorage.removeItem("booking_instructions");
      localStorage.removeItem("booking_schedule");

      // Clear guest booking data
      GuestBookingService.clear();

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
    <div class="mb-8">
      <div class="flex items-center mb-4">
        <Button
          variant="ghost"
          size="sm"
          on:click={goToPrevious}
          class="mr-4"
          disabled={isLoading}
        >
          <ArrowLeft size={16} class="mr-2" />
          Back
        </Button>
        
        <div class="flex-1">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            Review Your Booking
          </h1>
          <p class="text-gray-600 dark:text-gray-300 mt-1">
            {isGuest 
              ? 'Please confirm your details and booking information' 
              : 'Please confirm your booking details before proceeding to payment'
            }
          </p>
        </div>
      </div>

      <!-- Progress indicator -->
      <div class="flex items-center space-x-4 text-sm">
        <span class="text-primary font-medium">1. Service</span>
        <span class="text-gray-400">→</span>
        <span class="text-primary font-medium">2. Address</span>
        <span class="text-gray-400">→</span>
        <span class="text-primary font-medium">3. Schedule</span>
        <span class="text-gray-400">→</span>
        <span class="text-primary font-medium">4. Review</span>
      </div>
    </div>

    <!-- Form error message -->
    {#if form?.error}
      <div class="mb-6 rounded-md bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-200">
        <p>{form.error}</p>
      </div>
    {/if}

    <!-- Guest Information Section (only for guests) -->
    {#if isGuest}
      <div class="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <User size={20} class="mr-2" />
          Your Information
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
          We'll create your account and send booking confirmations to this email.
        </p>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label for="guest-first-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First Name *
            </label>
            <input
              id="guest-first-name"
              type="text"
              bind:value={guestInfo.firstName}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white {formErrors.firstName ? 'border-red-500' : ''}"
              placeholder="Enter your first name"
              required
            />
            {#if formErrors.firstName}
              <p class="text-red-500 text-sm mt-1">{formErrors.firstName}</p>
            {/if}
          </div>

          <div>
            <label for="guest-last-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Last Name *
            </label>
            <input
              id="guest-last-name"
              type="text"
              bind:value={guestInfo.lastName}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white {formErrors.lastName ? 'border-red-500' : ''}"
              placeholder="Enter your last name"
              required
            />
            {#if formErrors.lastName}
              <p class="text-red-500 text-sm mt-1">{formErrors.lastName}</p>
            {/if}
          </div>

          <div>
            <label for="guest-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address *
            </label>
            <input
              id="guest-email"
              type="email"
              bind:value={guestInfo.email}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white {formErrors.email ? 'border-red-500' : ''}"
              placeholder="Enter your email address"
              required
            />
            {#if formErrors.email}
              <p class="text-red-500 text-sm mt-1">{formErrors.email}</p>
            {/if}
          </div>

          <div>
            <label for="guest-phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number (Optional)
            </label>
            <input
              id="guest-phone"
              type="tel"
              bind:value={guestInfo.phone}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
              placeholder="Enter your phone number"
            />
          </div>
        </div>
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
            <div class="mt-4 flex justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
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
          <div class="animate-pulse">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        {/if}
      </div>

      <!-- Address and schedule details -->
      <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Location & Schedule
        </h2>

        <div class="space-y-4">
          <!-- Address -->
          <div class="flex items-start">
            <MapPin size={20} class="mr-3 mt-0.5 text-primary" />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Address</p>
              <p class="text-gray-600 dark:text-gray-300">
                {#if isGuest && addressData}
                  {addressData.formatted}
                {:else if addressDetails}
                  {addressDetails.street}, {addressDetails.city}, {addressDetails.state} {addressDetails.zipCode}
                {:else}
                  Loading address...
                {/if}
              </p>
              {#if (isGuest && addressData?.instructions) || (!isGuest && notes)}
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <FileText size={14} class="inline mr-1" />
                  {isGuest ? addressData.instructions : notes}
                </p>
              {/if}
            </div>
          </div>

          <!-- Schedule -->
          <div class="flex items-start">
            <Calendar size={20} class="mr-3 mt-0.5 text-primary" />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Date & Time</p>
              <p class="text-gray-600 dark:text-gray-300">
                {selectedDate ? formatDate(selectedDate) : 'Loading...'}
              </p>
              <p class="text-gray-600 dark:text-gray-300">
                <Clock size={14} class="inline mr-1" />
                {selectedTime ? formatTime(selectedTime) : 'Loading...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Total price -->
    <div class="mb-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          Total Amount
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
        Prices include VAT. Payment will be processed securely via PayFast.
        {#if isGuest}
          <br />After payment, you'll receive an email to set up your password.
        {/if}
      </p>
    </div>

    <!-- Form submission -->
    <form
      method="POST"
      action="?/createBooking"
      use:enhance={({ formData }) => {
        // Validate guest information before submission
        if (isGuest && !validateGuestInfo()) {
          console.log('❌ Guest validation failed:', formErrors);
          return { update: false };
        }

        // Check required booking data
        if (!selectedService || (!selectedAddress && !addressData) || !selectedDate || !selectedTime) {
          console.log('❌ Missing booking data');
          return { update: false };
        }

        // Save guest info to guest booking store
        if (isGuest) {
          GuestBookingService.save({
            guestInfo: guestInfo
          });
        }

        console.log('✅ Form validation passed, submitting...');
        isLoading = true;

        return async ({ result, update }) => {
          console.log('📝 Form submission result:', result);
          isLoading = false;

          if (result.type === "success" && result.data?.success) {
            handleBookingSuccess(result.data);
          } else if (result.data?.shouldRedirectToLogin) {
            // If user exists, redirect to login
            goto(`/auth/login?redirectTo=/book/review&email=${encodeURIComponent(guestInfo.email)}`);
          } else {
            // Update the page to show any errors
            await update();
          }
        };
      }}
    >
      <!-- Hidden fields to carry booking data -->
      <input type="hidden" name="serviceId" value={selectedService} />
      <input type="hidden" name="scheduledDate" value={scheduledDateTime} />
      <input type="hidden" name="notes" value={notes} />

      <!-- For authenticated users -->
      {#if !isGuest}
        <input type="hidden" name="addressId" value={selectedAddress} />
      {/if}

      <!-- For guest users -->
      {#if isGuest}
        <input type="hidden" name="guestEmail" value={guestInfo.email} />
        <input type="hidden" name="guestFirstName" value={guestInfo.firstName} />
        <input type="hidden" name="guestLastName" value={guestInfo.lastName} />
        <input type="hidden" name="guestPhone" value={guestInfo.phone} />
        
        {#if addressData}
          <input type="hidden" name="addressStreet" value={addressData.street} />
          <input type="hidden" name="addressCity" value={addressData.city} />
          <input type="hidden" name="addressState" value={addressData.state} />
          <input type="hidden" name="addressZipCode" value={addressData.zipCode} />
          <input type="hidden" name="addressCountry" value={addressData.country} />
          <input type="hidden" name="addressFormatted" value={addressData.formatted} />
          <input type="hidden" name="addressInstructions" value={addressData.instructions || ''} />
        {/if}
      {/if}

      <!-- Navigation buttons -->
      <div class="flex justify-between">
        <Button type="button" variant="outline" on:click={goToPrevious} disabled={isLoading}>
          <ArrowLeft size={18} class="mr-2" />
          Back
        </Button>

        <Button
          type="submit"
          variant="primary"
          disabled={isLoading || !selectedService || (!selectedAddress && !addressData) || !selectedDate || !selectedTime}
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
            {isGuest ? 'Creating Account & Booking...' : 'Processing...'}
          {:else}
            {isGuest ? 'Create Account & Pay' : 'Confirm & Pay'}
            <CreditCard size={18} class="ml-2" />
          {/if}
        </Button>
      </div>
    </form>
  </div>
</div>
