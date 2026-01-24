<!-- src/routes/book/review/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import StepTracker from "$lib/components/booking/StepTracker.svelte";
  import PriceSummary from "$lib/components/booking/PriceSummary.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import { getAPIHeaders } from "$lib/utils/api-helpers";
  import {
    Calendar,
    MapPin,
    Clock,
    CreditCard,
    FileText,
    ArrowLeft,
    RotateCw,
    WalletIcon,
    Tag,
    X,
    Check,
  } from "lucide-svelte";
  import {
    calculateCleaningPrice,
    type PriceBreakdown,
  } from "$lib/utils/pricing";
  import type { PageData, ActionData } from "./$types";

  // Get data from the server load function using Svelte 5 props
  let { data, form }: { data: PageData; form: ActionData } = $props();
  const {
    user,
    addresses,
    pricingConfig,
    addons,
    isAuthenticated,
    guestBookingData,
  } = data;

  // Track booking data using $state for reactivity
  let selectedService = $state("");
  let selectedAddress = $state("");
  let selectedDate = $state("");
  let selectedTime = $state("");
  let notes = $state("");
  let selectedCleanerId = $state("");
  let selectedCleanerData: any = $state(null);

  // Room-based pricing data
  let bedroomCount = $state(1);
  let bathroomCount = $state(1);
  let selectedAddonIds: string[] = $state([]);
  let priceBreakdown: PriceBreakdown | null = $state(null);

  // Recurring booking data
  let isRecurring = $state(false);
  let recurringFrequency = $state("");
  let recurringDays: string[] = $state([]);
  let recurringMonthlyDates: number[] = $state([]);
  let recurringTimeSlot = $state("");
  let discountPercentage = $state(0);
  let finalPrice = $state(0);
  let startDate = $state("");

  // Guest user data
  let guestAddress: any = $state(null);

  // Coupon state
  let couponCode = $state("");
  let couponLoading = $state(false);
  let couponError = $state("");
  let appliedCoupon: {
    id: string;
    code: string;
    name: string;
    discountType: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue: number;
    discountAmount: number;
  } | null = $state(null);

  // Track loading state
  let isLoading = $state(false);

  // Computed values using $derived
  let addressDetails = $derived(
    addresses.find((a) => a.id === selectedAddress),
  );
  let scheduledDateTime = $derived(
    selectedDate && selectedTime ? `${selectedDate}T${selectedTime}` : "",
  );
  let selectedAddonsComputed = $derived(
    addons.filter((a) => selectedAddonIds.includes(a.id)),
  );

  // Recalculate final price for recurring bookings using $effect
  $effect(() => {
    if (isRecurring && priceBreakdown && discountPercentage > 0) {
      const discountAmount =
        (priceBreakdown.totalPrice * discountPercentage) / 100;
      finalPrice = priceBreakdown.totalPrice - discountAmount;
    }
  });

  // Initialise data from localStorage on mount
  import { onMount } from "svelte";
  import { parse, format } from "date-fns";

  onMount(() => {
    // Check if this is a recurring booking
    isRecurring = localStorage.getItem("booking_is_recurring") === "true";

    if (isRecurring) {
      // Get recurring booking data
      recurringFrequency =
        localStorage.getItem("booking_recurring_frequency") || "";

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

      recurringTimeSlot =
        localStorage.getItem("booking_recurring_time_slot") || "";
      discountPercentage = parseFloat(
        localStorage.getItem("booking_discount_percentage") || "0",
      );

      // Get the stored final price first
      finalPrice = parseFloat(
        localStorage.getItem("booking_final_price") || "0",
      );

      startDate = localStorage.getItem("booking_start_date") || "";
    } else {
      // Get one-time booking data
      selectedDate = localStorage.getItem("booking_date") || "";
      selectedTime = localStorage.getItem("booking_time") || "";
    }

    // Get common booking data
    selectedService = localStorage.getItem("booking_service") || "";

    // Get room-based pricing data
    bedroomCount = parseInt(
      localStorage.getItem("booking_bedroom_count") || "1",
      10,
    );
    bathroomCount = parseInt(
      localStorage.getItem("booking_bathroom_count") || "1",
      10,
    );

    const addonIdsStr = localStorage.getItem("booking_addon_ids");
    if (addonIdsStr) {
      try {
        selectedAddonIds = JSON.parse(addonIdsStr);
      } catch (e) {
        console.error("Error parsing addon IDs:", e);
        selectedAddonIds = [];
      }
    }

    // Calculate price breakdown using server-provided config
    const selectedAddonsForCalc = addons.filter((a) =>
      selectedAddonIds.includes(a.id),
    );
    priceBreakdown = calculateCleaningPrice(
      pricingConfig,
      { bedroomCount, bathroomCount },
      selectedAddonsForCalc,
    );

    // Recalculate final price for recurring if needed
    if (isRecurring && discountPercentage > 0) {
      const discountAmount =
        (priceBreakdown.totalPrice * discountPercentage) / 100;
      finalPrice = priceBreakdown.totalPrice - discountAmount;
    }

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
      // Authenticated user - first check for saved address selection
      const storedAddressId = localStorage.getItem("booking_address") || "";

      // Only use the stored address ID if it actually exists in user's saved addresses
      // (A new user who just signed up won't have any saved addresses yet)
      if (storedAddressId && addresses.some((a) => a.id === storedAddressId)) {
        selectedAddress = storedAddressId;
      } else {
        // No valid saved address - check if user has guest address data from booking flow
        // This happens when a guest user logs in/signs up during the booking flow
        selectedAddress = "";
        const guestAddressData = localStorage.getItem("booking_guest_address");
        if (guestAddressData) {
          try {
            guestAddress = JSON.parse(guestAddressData);
          } catch (e) {
            console.error("Error parsing guest address:", e);
          }
        }

        // Also check server-side guest booking data
        if (guestBookingData?.guestAddress) {
          guestAddress = guestBookingData.guestAddress;
        }
      }
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
      }
    }

    // Validation based on user type - for authenticated users, accept either saved address OR guest address
    // Guest address is valid if user just logged in during booking flow
    const hasValidAddressData = isAuthenticated
      ? (selectedAddress || guestAddress)
      : guestAddress;

    // Check if we have valid scheduling data
    const hasValidSchedule = isRecurring
      ? recurringFrequency && recurringTimeSlot
      : selectedDate && selectedTime;

    // If required information is missing, redirect back
    if (!selectedService || !hasValidSchedule || !hasValidAddressData) {
      goto("/book");
    }

    // Check for pending coupon code (from guest user who just logged in)
    if (isAuthenticated && !isRecurring) {
      const pendingCoupon = localStorage.getItem("pending_coupon_code");
      if (pendingCoupon) {
        // Clear the pending coupon immediately to prevent re-applying
        localStorage.removeItem("pending_coupon_code");
        // Set the coupon code and auto-apply after a brief delay (to ensure price is calculated)
        couponCode = pendingCoupon;
        setTimeout(() => {
          if (priceBreakdown) {
            applyCoupon();
          }
        }, 100);
      }
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
    // For authenticated users, check selectedAddress OR guestAddress (if they just logged in during booking)
    // For guest users, check guestAddress only (contact info will be collected at payment)
    const hasValidAddress = isAuthenticated ? (selectedAddress || guestAddress) : guestAddress;

    // Check if we have valid scheduling data
    const hasValidSchedule = isRecurring
      ? recurringFrequency && recurringTimeSlot
      : selectedDate && selectedTime;

    if (!selectedService || !hasValidAddress || !hasValidSchedule) {
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
      goto("/book/payment");
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
      const response = await fetch("/api/subscription/create", {
        method: "POST",
        headers: getAPIHeaders(),
        body: JSON.stringify({
          serviceId: selectedService,
          addressId: selectedAddress,
          cleanerId: selectedCleanerId,
          frequency: recurringFrequency,
          preferredDays: recurringDays,
          preferredTimeSlot: recurringTimeSlot,
          monthlyDates: recurringMonthlyDates,
          basePrice: priceBreakdown?.totalPrice || 0,
          discountPercentage,
          finalPrice,
          startDate: startDate || new Date().toISOString(),
          notes,
          // Room-based pricing data
          bedroomCount,
          bathroomCount,
          addonIds: selectedAddonIds,
        }),
      });

      const data = await response.json();

      if (data.success && data.redirectUrl) {
        // Clear booking data
        clearBookingData();

        // Redirect to PayFast for subscription setup
        window.location.href = data.redirectUrl;
      } else {
        alert("Failed to create subscription. Please try again.");
        isLoading = false;
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
      alert("An error occurred. Please try again.");
      isLoading = false;
    }
  }

  // Apply coupon code
  async function applyCoupon() {
    if (!couponCode.trim()) {
      couponError = "Please enter a coupon code";
      return;
    }

    if (!isAuthenticated) {
      couponError = "Please log in to use coupon codes";
      return;
    }

    if (!priceBreakdown) {
      couponError = "Price not available";
      return;
    }

    couponLoading = true;
    couponError = "";

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          ...getAPIHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: couponCode.trim(),
          bookingAmount: priceBreakdown.totalPrice,
        }),
      });

      const result = await response.json();

      if (result.valid) {
        appliedCoupon = {
          id: result.coupon.id,
          code: result.coupon.code,
          name: result.coupon.name,
          discountType: result.coupon.discountType,
          discountValue: result.coupon.discountValue,
          discountAmount: result.discountAmount,
        };
        couponCode = "";
        couponError = "";
      } else {
        couponError = result.error || "Invalid coupon code";
      }
    } catch (error) {
      console.error("Error validating coupon:", error);
      couponError = "Failed to validate coupon. Please try again.";
    } finally {
      couponLoading = false;
    }
  }

  // Remove applied coupon
  function removeCoupon() {
    appliedCoupon = null;
    couponCode = "";
    couponError = "";
  }

  // Handle guest user trying to apply coupon - redirect to login
  function handleGuestCoupon() {
    if (!couponCode.trim()) {
      return;
    }

    // Save coupon code to localStorage so we can apply it after login
    localStorage.setItem("pending_coupon_code", couponCode.trim().toUpperCase());

    // Redirect to login with return URL back to review page
    const returnUrl = encodeURIComponent("/book/review");
    goto(`/auth/login?redirectTo=${returnUrl}&coupon=pending`);
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
    // Room-based pricing data
    localStorage.removeItem("booking_bedroom_count");
    localStorage.removeItem("booking_bathroom_count");
    localStorage.removeItem("booking_addon_ids");
    localStorage.removeItem("booking_total_price");
    localStorage.removeItem("booking_total_duration");
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
      <!-- Service details with room breakdown -->
      <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Cleaning Details
        </h2>

        {#if priceBreakdown}
          <PriceSummary
            breakdown={priceBreakdown}
            discountPercentage={isRecurring ? discountPercentage : 0}
            couponDiscount={appliedCoupon ? {
              code: appliedCoupon.code,
              name: appliedCoupon.name,
              discountType: appliedCoupon.discountType,
              discountAmount: appliedCoupon.discountAmount,
            } : null}
          />

          <!-- Coupon Input Section (only for one-time bookings) -->
          {#if !isRecurring && isAuthenticated}
            <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Tag size={16} class="text-primary" />
                Have a coupon code?
              </h4>

              {#if appliedCoupon}
                <!-- Show applied coupon -->
                <div class="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                  <div class="flex items-center gap-2">
                    <Check size={16} class="text-green-600 dark:text-green-400" />
                    <div>
                      <span class="font-mono font-semibold text-green-700 dark:text-green-300">{appliedCoupon.code}</span>
                      <span class="text-sm text-green-600 dark:text-green-400 ml-2">
                        -{appliedCoupon.discountType === "PERCENTAGE" ? `${appliedCoupon.discountValue}%` : `R${appliedCoupon.discountAmount.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onclick={removeCoupon}
                    class="p-1 text-gray-500 hover:text-red-500 transition-colors"
                    title="Remove coupon"
                  >
                    <X size={16} />
                  </button>
                </div>
              {:else}
                <!-- Coupon input form -->
                <div class="flex gap-2">
                  <input
                    type="text"
                    bind:value={couponCode}
                    placeholder="Enter coupon code"
                    class="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    onkeydown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon())}
                  />
                  <button
                    type="button"
                    onclick={applyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {#if couponLoading}
                      <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    {:else}
                      Apply
                    {/if}
                  </button>
                </div>
                {#if couponError}
                  <p class="mt-2 text-sm text-red-600 dark:text-red-400">{couponError}</p>
                {/if}
              {/if}
            </div>
          {/if}

          {#if !isAuthenticated && !isRecurring}
            <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Tag size={16} class="text-primary" />
                Have a coupon code?
              </h4>

              <!-- Coupon input for guests -->
              <div class="flex gap-2">
                <input
                  type="text"
                  bind:value={couponCode}
                  placeholder="Enter coupon code"
                  class="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  onkeydown={(e) => e.key === "Enter" && (e.preventDefault(), handleGuestCoupon())}
                />
                <button
                  type="button"
                  onclick={handleGuestCoupon}
                  disabled={!couponCode.trim()}
                  class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Apply
                </button>
              </div>
              <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                You'll need to log in or create an account to use a coupon code.
              </p>
            </div>
          {/if}
        {:else}
          <p class="text-gray-500 dark:text-gray-400">
            Loading pricing information...
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
                <p class="font-medium text-gray-900 dark:text-white">
                  Recurring Schedule
                </p>
                <p class="text-gray-600 dark:text-gray-300">
                  {recurringFrequency === "WEEKLY"
                    ? "Weekly (52 times/year)"
                    : recurringFrequency === "BIWEEKLY"
                      ? "Every 2 Weeks (26 times/year)"
                      : recurringFrequency === "TWICE_WEEKLY"
                        ? "Twice Weekly (~104 times/year)"
                        : recurringFrequency === "TWICE_MONTHLY"
                          ? "Twice Monthly (24 times/year)"
                          : ""}
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
                  <p class="font-medium text-gray-900 dark:text-white">
                    Preferred Days
                  </p>
                  <p class="text-gray-600 dark:text-gray-300">
                    {recurringDays.join(", ")}
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
                  <p class="font-medium text-gray-900 dark:text-white">
                    Monthly Dates
                  </p>
                  <p class="text-gray-600 dark:text-gray-300">
                    {recurringMonthlyDates
                      .map(
                        (d) => `${d}${d === 1 ? "st" : d === 15 ? "th" : "th"}`,
                      )
                      .join(" and ")}
                  </p>
                </div>
              </div>
            {/if}

            <div class="flex items-start">
              <Clock size={20} class="mr-3 mt-0.5 flex-shrink-0 text-primary" />
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  Time Slot
                </p>
                <p class="text-gray-600 dark:text-gray-300">
                  {recurringTimeSlot}
                </p>
              </div>
            </div>

            {#if priceBreakdown}
              <div class="flex items-start">
                <WalletIcon
                  size={20}
                  class="mr-3 mt-0.5 flex-shrink-0 text-green-600"
                />
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">
                    Price per Clean
                  </p>
                  {#if discountPercentage > 0}
                    <p class="text-green-600 dark:text-green-400 font-semibold">
                      R{finalPrice.toFixed(2)} ({discountPercentage}% discount)
                    </p>
                  {:else}
                    <p class="text-green-600 dark:text-green-400 font-semibold">
                      R{priceBreakdown.totalPrice.toFixed(2)}
                    </p>
                  {/if}
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
                  {#if guestAddress.aptUnit}, {guestAddress.aptUnit}{/if}<br />
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
            src={selectedCleanerData.profileImageUrl ||
              "/images/default-avatar.svg"}
            alt={selectedCleanerData.name}
            class="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            onerror={(e: Event) => {
              (e.currentTarget as HTMLImageElement).src =
                "/images/default-avatar.svg";
            }}
          />
          <div class="flex-1">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              {selectedCleanerData.name}
            </h3>
            {#if selectedCleanerData.rating}
              <div class="flex items-center gap-1 mt-1">
                <span class="text-yellow-500"
                  >{"★".repeat(
                    Math.floor(selectedCleanerData.rating),
                  )}{"☆".repeat(
                    5 - Math.floor(selectedCleanerData.rating),
                  )}</span
                >
                <span class="text-sm text-gray-600"
                  >({selectedCleanerData.rating})</span
                >
              </div>
            {/if}
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {selectedCleanerData.bio || "Professional cleaner"}
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
      {#if isRecurring && priceBreakdown}
        <!-- Recurring Payment Display -->
        <div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recurring Payment Summary
          </h2>

          {#if discountPercentage > 0}
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>Regular price:</span>
                <span class="line-through text-gray-500">
                  R{priceBreakdown.totalPrice.toFixed(2)}
                </span>
              </div>
              <div class="flex justify-between text-green-600 font-medium">
                <span>Recurring discount ({discountPercentage}%):</span>
                <span>
                  - R{(
                    (priceBreakdown.totalPrice * discountPercentage) /
                    100
                  ).toFixed(2)}
                </span>
              </div>
              <div
                class="flex justify-between font-bold text-lg pt-3 border-t border-primary-100"
              >
                <span>Total per clean:</span>
                <span class="text-primary">R{finalPrice.toFixed(2)}</span>
              </div>
            </div>
          {:else}
            <div class="flex justify-between font-bold text-lg">
              <span>Total per clean:</span>
              <span class="text-primary"
                >R{priceBreakdown.totalPrice.toFixed(2)}</span
              >
            </div>
          {/if}
        </div>
      {:else}
        <!-- One-time Payment Display -->
        <div>
          {#if appliedCoupon && priceBreakdown}
            <!-- Show original price and discount -->
            <div class="flex items-center justify-between mb-2">
              <span class="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span class="text-gray-500 line-through">R{priceBreakdown.totalPrice.toFixed(2)}</span>
            </div>
            <div class="flex items-center justify-between mb-2 text-green-600 dark:text-green-400">
              <span class="flex items-center gap-2">
                <Tag size={16} />
                Coupon ({appliedCoupon.code})
              </span>
              <span>-R{appliedCoupon.discountAmount.toFixed(2)}</span>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-primary-100 dark:border-primary-800">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                Total
              </h2>
              <span class="text-2xl font-bold text-primary">
                R{(priceBreakdown.totalPrice - appliedCoupon.discountAmount).toFixed(2)}
              </span>
            </div>
          {:else}
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                Total
              </h2>
              {#if priceBreakdown}
                <span class="text-2xl font-bold text-primary">
                  R{priceBreakdown.totalPrice.toFixed(2)}
                </span>
              {:else}
                <span class="text-2xl font-bold text-primary">R0.00</span>
              {/if}
            </div>
          {/if}
        </div>
      {/if}

      <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
        {#if isRecurring}
          Recurring subscription will be processed securely via PayFast. You can
          cancel or pause anytime with 48 hours notice.
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
          formData.set("isRecurring", "true");
          formData.set("recurringFrequency", recurringFrequency);
          formData.set("recurringDays", JSON.stringify(recurringDays));
          formData.set(
            "recurringMonthlyDates",
            JSON.stringify(recurringMonthlyDates),
          );
          formData.set("recurringTimeSlot", recurringTimeSlot);
          formData.set("discountPercentage", discountPercentage.toString());
          formData.set("finalPrice", finalPrice.toString());
          formData.set("startDate", startDate);
        }

        return async ({ result, update }) => {
          isLoading = false;

          if (result.type === "success" && result.data?.success) {
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

      <!-- Room-based pricing fields -->
      <input type="hidden" name="bedroomCount" value={bedroomCount} />
      <input type="hidden" name="bathroomCount" value={bathroomCount} />
      <input
        type="hidden"
        name="addonIds"
        value={JSON.stringify(selectedAddonIds)}
      />

      <!-- Coupon fields -->
      {#if appliedCoupon}
        <input type="hidden" name="couponId" value={appliedCoupon.id} />
        <input type="hidden" name="couponCode" value={appliedCoupon.code} />
        <input type="hidden" name="couponDiscountAmount" value={appliedCoupon.discountAmount.toFixed(2)} />
      {/if}

      {#if isAuthenticated && selectedAddress}
        <!-- Authenticated user with saved address -->
        <input type="hidden" name="addressId" value={selectedAddress} />
      {:else}
        <!-- Guest user OR authenticated user who logged in during booking (has guest address) -->
        <input
          type="hidden"
          name="guestAddress"
          value={JSON.stringify(guestAddress || {})}
        />
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
            (isAuthenticated ? !(selectedAddress || guestAddress) : !guestAddress) ||
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
