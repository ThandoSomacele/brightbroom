<!-- src/routes/book/schedule/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import StepTracker from "$lib/components/booking/StepTracker.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import RecurringOptions from "$lib/components/booking/RecurringOptions.svelte";
  import { Calendar, Clock, ArrowRight, ArrowLeft, ChevronLeft, ChevronRight, RotateCw } from "lucide-svelte";
  import { format, parse, isEqual, isSameDay, isToday, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, endOfWeek, startOfWeek, isSameMonth } from "date-fns";
  
  // Get data from the server load function
  export let data;
  const { availableDates, timeSlots } = data;
  
  // Track selected date and time
  let selectedDate = "";
  let selectedTime = "";

  // Recurring booking state
  let isRecurring = false;
  let recurringFrequency = "";
  let recurringDays: string[] = [];
  let recurringMonthlyDates: number[] = [];
  let recurringTimeSlot = "";
  let basePrice = 0;
  let finalPrice = 0;
  let discountPercentage = 0;
  
  // Calendar state
  let currentMonth = new Date();
  let calendarDays: Array<{ date: Date; isAvailable: boolean; isSelected: boolean; isCurrentMonth: boolean }> = [];
  
  // Available dates as Date objects for easier comparison
  let availableDateObjects: Date[] = [];
  
  // Add loading state
  let isLoading = false;
  
  // Get previous selections from localStorage
  let selectedService = "";
  let selectedAddress = "";
  let accessInstructions = "";
  
  // Initialize data from localStorage on mount
  import { onMount } from "svelte";
  
  onMount(() => {
    // Get previous selections
    selectedService = localStorage.getItem("booking_service") || "";
    selectedAddress = localStorage.getItem("booking_address") || "";
    accessInstructions = localStorage.getItem("booking_instructions") || "";

    // Get service price for recurring calculations
    const serviceData = localStorage.getItem("booking_service_data");
    if (serviceData) {
      try {
        const parsed = JSON.parse(serviceData);
        basePrice = parseFloat(parsed.price) || 0;
      } catch (e) {
        console.error("Error parsing service data:", e);
      }
    }

    // Check for guest address if no regular address is found
    const guestAddress = localStorage.getItem("booking_guest_address");

    // If required information is missing, redirect back
    if (!selectedService || (!selectedAddress && !guestAddress)) {
      goto("/book");
    }

    // Parse available dates into Date objects
    availableDateObjects = availableDates.map(d => parse(d.date, 'yyyy-MM-dd', new Date()));

    // Default to first available date if we have any
    if (availableDates.length > 0 && !selectedDate) {
      selectedDate = availableDates[0].date;
    }

    // Generate calendar days for the current month
    generateCalendarDays();
  });
  
  // Generate calendar days for the current month view
  function generateCalendarDays() {
    // Start of the month
    const monthStart = startOfMonth(currentMonth);
    // End of the month
    const monthEnd = endOfMonth(monthStart);
    // Start of the first week of the month
    const startDate = startOfWeek(monthStart);
    // End of the last week of the month
    const endDate = endOfWeek(monthEnd);
    
    // Get all days in this calendar view (including days from prev/next months)
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Map each date to calendar day objects with additional info
    calendarDays = days.map(date => {
      // Check if this date is available
      const isAvailable = availableDateObjects.some(d => isSameDay(d, date));
      
      // Is this date selected?
      const isSelected = selectedDate ? isSameDay(date, parse(selectedDate, 'yyyy-MM-dd', new Date())) : false;
      
      // Is this date in the current month?
      const isCurrentMonth = isSameMonth(date, currentMonth);
      
      return {
        date,
        isAvailable,
        isSelected,
        isCurrentMonth
      };
    });
  }
  
  // Previous month handler
  function previousMonth() {
    currentMonth = subMonths(currentMonth, 1);
    generateCalendarDays();
  }
  
  // Next month handler
  function nextMonth() {
    currentMonth = addMonths(currentMonth, 1);
    generateCalendarDays();
  }
  
  // Date selection handler
  function selectCalendarDate(day: { date: Date; isAvailable: boolean; isSelected: boolean }) {
    if (!day.isAvailable) return;
    
    // Format the date to match expected format
    selectedDate = format(day.date, 'yyyy-MM-dd');
    
    // Update calendar days to reflect selection
    generateCalendarDays();
  }
  
  // Continue to next step
  async function continueToNext() {
    // Validate based on booking type
    if (isRecurring) {
      const isValidRecurring = recurringFrequency && recurringTimeSlot &&
        ((recurringFrequency === 'TWICE_MONTHLY' && recurringMonthlyDates.length === 2) ||
         (recurringFrequency === 'WEEKLY' && recurringDays.length === 1) ||
         (recurringFrequency === 'BIWEEKLY' && recurringDays.length === 1) ||
         (recurringFrequency === 'TWICE_WEEKLY' && recurringDays.length === 2));

      if (!isValidRecurring) {
        alert("Please complete all recurring booking options");
        return;
      }

      // Show loading state
      isLoading = true;

      try {
        // Store recurring booking data
        localStorage.setItem("booking_is_recurring", "true");
        localStorage.setItem("booking_recurring_frequency", recurringFrequency);
        localStorage.setItem("booking_recurring_days", JSON.stringify(recurringDays));
        localStorage.setItem("booking_recurring_monthly_dates", JSON.stringify(recurringMonthlyDates));
        localStorage.setItem("booking_recurring_time_slot", recurringTimeSlot);
        localStorage.setItem("booking_discount_percentage", discountPercentage.toString());
        localStorage.setItem("booking_final_price", finalPrice.toString());

        // For recurring bookings, we'll use the start date as the first occurrence
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 7); // Start next week
        localStorage.setItem("booking_start_date", startDate.toISOString());

        // Navigate to cleaner selection
        await goto("/book/cleaner");
      } catch (error) {
        console.error("Navigation error:", error);
      } finally {
        isLoading = false;
      }
    } else {
      // One-time booking
      if (selectedDate && selectedTime) {
        // Show loading state
        isLoading = true;

        try {
          // Store selections in localStorage to persist through navigation
          localStorage.setItem("booking_date", selectedDate);
          localStorage.setItem("booking_time", selectedTime);
          localStorage.setItem("booking_is_recurring", "false");

          // Navigate to cleaner selection
          await goto("/book/cleaner");
        } catch (error) {
          console.error("Navigation error:", error);
        } finally {
          isLoading = false;
        }
      }
    }
  }

  // Handle recurring booking events
  function handleFrequencyChange(event: CustomEvent) {
    recurringFrequency = event.detail.frequency;
    discountPercentage = event.detail.discountPercentage;
    finalPrice = event.detail.finalPrice;
  }

  function handleDaysChange(event: CustomEvent) {
    recurringDays = event.detail.days;
  }

  function handleMonthlyDatesChange(event: CustomEvent) {
    recurringMonthlyDates = event.detail.dates;
  }

  function handleTimeSlotChange(event: CustomEvent) {
    recurringTimeSlot = event.detail.timeSlot;
  }
  
  // Go back to previous step
  async function goToPrevious() {
    isLoading = true;
    try {
      await goto("/book/address");
    } catch (error) {
      console.error("Navigation error:", error);
      isLoading = false;
    }
  }
  
  // Track changes to selectedDate and update the calendar
  $: if (selectedDate) {
    generateCalendarDays();
  }
</script>

<svelte:head>
  <title>Schedule Cleaning | BrightBroom</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
  <div class="mx-auto max-w-5xl">
    <!-- Page header -->
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Schedule Your Cleaning
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-300">
        Select a convenient date and time
      </p>
    </div>

    <!-- Progress steps -->
    <div class="mb-8">
      <StepTracker currentStep={3} />
    </div>

    <!-- Booking Type Toggle -->
    <div class="mb-8">
      <div class="bg-white rounded-lg p-6 shadow-md dark:bg-gray-800">
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <RotateCw class="h-5 w-5 text-teal-600" />
          Booking Type
        </h2>

        <div class="flex gap-4">
          <button
            type="button"
            on:click={() => isRecurring = false}
            class="flex-1 p-4 border-2 rounded-lg transition-all {!isRecurring ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}"
          >
            <p class="font-semibold">One-Time Cleaning</p>
            <p class="text-sm text-gray-600">Book a single cleaning session</p>
          </button>

          <button
            type="button"
            on:click={() => isRecurring = true}
            class="flex-1 p-4 border-2 rounded-lg transition-all {isRecurring ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}"
          >
            <div class="flex justify-between items-start">
              <div class="text-left">
                <p class="font-semibold">Recurring Cleaning</p>
                <p class="text-sm text-gray-600">Regular scheduled cleaning with discounts</p>
              </div>
              <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                Save up to 15%
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Recurring Options (if selected) -->
    {#if isRecurring}
      <div class="mb-8">
        <div class="bg-white rounded-lg p-6 shadow-md dark:bg-gray-800">
          <RecurringOptions
            {basePrice}
            bind:selectedFrequency={recurringFrequency}
            bind:selectedDays={recurringDays}
            bind:selectedMonthlyDates={recurringMonthlyDates}
            bind:preferredTimeSlot={recurringTimeSlot}
            on:frequencyChange={handleFrequencyChange}
            on:daysChange={handleDaysChange}
            on:monthlyDatesChange={handleMonthlyDatesChange}
            on:timeSlotChange={handleTimeSlotChange}
          />
        </div>
      </div>
    {/if}

    <!-- Date and time selection (for one-time bookings) -->
    {#if !isRecurring}
    <div class="grid gap-8 md:grid-cols-2">
      <!-- Calendar Date Picker -->
      <div>
        <h2
          class="mb-4 flex items-center text-xl font-semibold text-gray-900 dark:text-white"
        >
          <Calendar size={20} class="mr-2 text-primary" />
          Select a Date
        </h2>

        <div class="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
          <!-- Calendar Header - Month Navigation -->
          <div class="mb-4 flex items-center justify-between">
            <button
              type="button"
              class="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              on:click={previousMonth}
            >
              <ChevronLeft size={18} />
            </button>
            
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            
            <button
              type="button"
              class="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              on:click={nextMonth}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          
          <!-- Calendar Days of Week Headers -->
          <div class="mb-2 grid grid-cols-7 text-center">
            {#each ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as day}
              <div class="text-xs font-medium text-gray-500 dark:text-gray-400">
                {day}
              </div>
            {/each}
          </div>
          
          <!-- Calendar Days Grid -->
          <div class="grid grid-cols-7 gap-1">
            {#each calendarDays as day}
              <button
                type="button"
                class={`
                  flex h-10 w-full items-center justify-center rounded-lg p-1
                  text-sm
                  ${day.isCurrentMonth ? 'font-medium' : 'text-gray-400 dark:text-gray-600'}
                  ${day.isSelected ? 'bg-primary text-white hover:bg-primary-600' : ''}
                  ${day.isAvailable && !day.isSelected 
                      ? 'bg-primary-50 text-primary hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/30' 
                      : !day.isAvailable 
                          ? 'cursor-not-allowed opacity-50' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                  ${isToday(day.date) && !day.isSelected ? 'border border-primary' : ''}
                `}
                disabled={!day.isAvailable}
                on:click={() => selectCalendarDate(day)}
              >
                {format(day.date, 'd')}
              </button>
            {/each}
          </div>
          
          <!-- Legend -->
          <div class="mt-4 flex justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <div class="flex items-center">
              <div class="mr-1.5 h-3 w-3 rounded bg-primary-50 dark:bg-primary-900/20"></div>
              <span>Available</span>
            </div>
            <div class="flex items-center">
              <div class="mr-1.5 h-3 w-3 rounded bg-primary"></div>
              <span>Selected</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Time selection -->
      <div>
        <h2
          class="mb-4 flex items-center text-xl font-semibold text-gray-900 dark:text-white"
        >
          <Clock size={20} class="mr-2 text-primary" />
          Select a Time
        </h2>

        <div class="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
          {#if timeSlots.length > 0}
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
              {#each timeSlots as slot}
                <button
                  type="button"
                  class={`
                    py-3 px-3 text-center rounded-md border transition-colors cursor-pointer
                    ${
                      selectedTime === slot.time
                        ? "border-primary bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20"
                        : "border-gray-200 hover:border-primary-200 dark:border-gray-700 dark:hover:border-primary-700"
                    }
                  `}
                  on:click={() => (selectedTime = slot.time)}
                >
                  <span
                    class="text-sm font-medium text-gray-900 dark:text-white"
                    >{slot.displayTime}</span
                  >
                </button>
              {/each}
            </div>
          {:else}
            <p class="text-center text-gray-500 dark:text-gray-400">
              No available time slots
            </p>
          {/if}
        </div>
      </div>
    </div>

    <!-- Selected date and time summary (for one-time booking) -->
    {#if selectedDate && selectedTime}
      <div class="mt-8 rounded-lg bg-primary-50 p-4 dark:bg-primary-900/20">
        <h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-white">
          Your Selected Time
        </h3>

        <p class="flex items-center text-gray-700 dark:text-gray-300">
          <Calendar size={18} class="mr-2 text-primary" />
          {availableDates.find((d) => d.date === selectedDate)?.fullDisplayDate}
        </p>

        <p class="mt-2 flex items-center text-gray-700 dark:text-gray-300">
          <Clock size={18} class="mr-2 text-primary" />
          {timeSlots.find((t) => t.time === selectedTime)?.displayTime}
        </p>
      </div>
    {/if}
    {/if}

    <!-- Summary for recurring booking -->
    {#if isRecurring && recurringFrequency}
      <div class="mt-8 rounded-lg bg-primary-50 p-4 dark:bg-primary-900/20">
        <h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-white">
          Your Recurring Schedule
        </h3>

        <p class="text-gray-700 dark:text-gray-300">
          <strong>Frequency:</strong>
          {recurringFrequency === 'WEEKLY' ? 'Weekly' :
           recurringFrequency === 'BIWEEKLY' ? 'Bi-weekly' :
           recurringFrequency === 'TWICE_WEEKLY' ? 'Twice weekly' :
           recurringFrequency === 'TWICE_MONTHLY' ? 'Twice monthly' : ''}
        </p>

        {#if recurringDays.length > 0}
          <p class="mt-2 text-gray-700 dark:text-gray-300">
            <strong>Days:</strong> {recurringDays.join(', ')}
          </p>
        {/if}

        {#if recurringMonthlyDates.length > 0}
          <p class="mt-2 text-gray-700 dark:text-gray-300">
            <strong>Monthly dates:</strong> {recurringMonthlyDates.map(d => `${d}${d === 1 ? 'st' : 'th'}`).join(' and ')}
          </p>
        {/if}

        {#if recurringTimeSlot}
          <p class="mt-2 text-gray-700 dark:text-gray-300">
            <strong>Time slot:</strong> {recurringTimeSlot}
          </p>
        {/if}

        {#if finalPrice > 0}
          <p class="mt-2 text-green-600 dark:text-green-400 font-semibold">
            Price per clean: R{finalPrice.toFixed(2)} ({discountPercentage}% discount)
          </p>
        {/if}
      </div>
    {/if}

    <!-- Navigation buttons -->
    <div class="mt-8 flex justify-between">
      <Button variant="outline" on:click={goToPrevious} disabled={isLoading}>
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
          Loading...
        {:else}
          <ArrowLeft size={18} class="mr-2" />
          Back
        {/if}
      </Button>

      <Button
        variant="primary"
        on:click={continueToNext}
        disabled={isLoading || (!isRecurring && (!selectedDate || !selectedTime)) ||
                  (isRecurring && (!recurringFrequency || !recurringTimeSlot ||
                    ((recurringFrequency === 'TWICE_MONTHLY' && recurringMonthlyDates.length !== 2) ||
                     ((recurringFrequency === 'WEEKLY' || recurringFrequency === 'BIWEEKLY') && recurringDays.length !== 1) ||
                     (recurringFrequency === 'TWICE_WEEKLY' && recurringDays.length !== 2))))}
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
          Loading...
        {:else}
          Continue
          <ArrowRight size={18} class="ml-2" />
        {/if}
      </Button>
    </div>
  </div>
</div>
