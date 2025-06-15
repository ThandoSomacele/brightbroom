<!-- src/routes/book/schedule/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { format, parse, isSameDay, isToday, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, endOfWeek, startOfWeek, isSameMonth } from "date-fns";
  
  import Button from "$lib/components/ui/Button.svelte";
  import { Calendar, Clock, ArrowRight, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-svelte";
  import { GuestBookingService } from "$lib/stores/guest-booking";
  
  // Get data from the server load function
  export let data;
  const { availableDates, timeSlots, selectedService, isGuest, user } = data;
  
  // Track selected date and time
  let selectedDate = "";
  let selectedTime = "";
  
  // Calendar state
  let currentMonth = new Date();
  let calendarDays: Array<{ date: Date; isAvailable: boolean; isSelected: boolean; isCurrentMonth: boolean }> = [];
  
  // Available dates as Date objects for easier comparison
  let availableDateObjects: Date[] = [];
  
  // Add loading state
  let isLoading = false;
  
  // Previous selections
  let selectedServiceId = "";
  let selectedAddress = "";
  let addressData: any = null;
  let accessInstructions = "";
  
  // Initialize data from localStorage and guest booking store on mount
  onMount(() => {
    // Try to load from guest booking store first (preferred method)
    const guestBookingData = GuestBookingService.load();
    
    if (guestBookingData) {
      selectedServiceId = guestBookingData.serviceId || "";
      addressData = guestBookingData.addressData;
      
      // Check if we have existing schedule selection
      if (guestBookingData.scheduledDate) {
        const [date, time] = guestBookingData.scheduledDate.split('T');
        selectedDate = date;
        selectedTime = time;
      }
    } else {
      // Fallback to legacy localStorage for backward compatibility
      selectedServiceId = localStorage.getItem("booking_service") || "";
      selectedAddress = localStorage.getItem("booking_address") || "";
      accessInstructions = localStorage.getItem("booking_instructions") || "";
      
      // Try to get schedule from localStorage
      selectedDate = localStorage.getItem("booking_date") || "";
      selectedTime = localStorage.getItem("booking_time") || "";
    }
    
    // If required information is missing, redirect back to appropriate step
    if (!selectedServiceId) {
      goto("/book");
      return;
    }
    
    // For guests, we need address data
    if (isGuest && !addressData?.formatted) {
      goto("/book/address");
      return;
    }
    
    // For authenticated users, we need address ID
    if (!isGuest && !selectedAddress) {
      goto("/book/address");
      return;
    }
    
    // Parse available dates into Date objects
    availableDateObjects = availableDates.map(d => parse(d.date, 'yyyy-MM-dd', new Date()));
    
    // Default to first available date if we don't have a selection and we have available dates
    if (availableDates.length > 0 && !selectedDate) {
      selectedDate = availableDates[0].date;
    }
    
    // Generate calendar days for the current month
    generateCalendarDays();
  });
  
  // Generate calendar days for the current month view
  function generateCalendarDays() {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    calendarDays = days.map(date => {
      const isAvailable = availableDateObjects.some(d => isSameDay(d, date));
      const isSelected = selectedDate ? isSameDay(parse(selectedDate, 'yyyy-MM-dd', new Date()), date) : false;
      const isCurrentMonth = isSameMonth(date, currentMonth);
      
      return {
        date,
        isAvailable,
        isSelected,
        isCurrentMonth
      };
    });
  }
  
  // Handle date selection
  function selectDate(date: Date) {
    const dateString = format(date, 'yyyy-MM-dd');
    
    // Check if this date is available
    if (availableDateObjects.some(d => isSameDay(d, date))) {
      selectedDate = dateString;
      
      // Clear time selection when date changes
      selectedTime = "";
      
      // Save to guest booking store
      updateGuestBookingData();
    }
  }
  
  // Handle time selection
  function selectTime(time: string) {
    selectedTime = time;
    updateGuestBookingData();
  }
  
  // Update guest booking data
  function updateGuestBookingData() {
    if (selectedDate && selectedTime) {
      const scheduledDateTime = `${selectedDate}T${selectedTime}`;
      
      // Update guest booking store
      GuestBookingService.save({
        scheduledDate: scheduledDateTime
      });
      
      // Also update legacy localStorage for backward compatibility
      localStorage.setItem("booking_date", selectedDate);
      localStorage.setItem("booking_time", selectedTime);
      localStorage.setItem("booking_schedule", scheduledDateTime);
    }
  }
  
  // Navigate to previous month
  function previousMonth() {
    currentMonth = subMonths(currentMonth, 1);
    generateCalendarDays();
  }
  
  // Navigate to next month
  function nextMonth() {
    currentMonth = addMonths(currentMonth, 1);
    generateCalendarDays();
  }
  
  // Continue to next step
  async function continueToNext() {
    if (!selectedDate || !selectedTime) {
      return;
    }
    
    isLoading = true;
    
    try {
      // Update guest booking store with final schedule
      updateGuestBookingData();
      
      // Navigate to review page
      await goto(`/book/review`);
    } catch (error) {
      console.error("Navigation error:", error);
      isLoading = false;
    }
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
  
  // Format date for display
  function formatDateForDisplay(dateString: string): string {
    try {
      const date = parse(dateString, "yyyy-MM-dd", new Date());
      return format(date, "EEEE, MMMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  }
  
  // Format time for display
  function formatTimeForDisplay(timeString: string): string {
    try {
      const time = parse(timeString, "HH:mm", new Date());
      return format(time, "h:mm a");
    } catch (e) {
      return timeString;
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
            Schedule Your Cleaning
          </h1>
          <p class="text-gray-600 dark:text-gray-300 mt-1">
            Select a convenient date and time
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
        <span class="text-gray-500">4. Review</span>
      </div>
    </div>

    <!-- Booking summary -->
    <div class="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Booking Summary
      </h3>
      <div class="space-y-2">
        <p class="text-gray-600 dark:text-gray-300">
          <span class="font-medium">Service:</span> {selectedService?.name || 'Loading...'}
        </p>
        <p class="text-gray-600 dark:text-gray-300">
          <span class="font-medium">Address:</span> 
          {#if isGuest}
            {addressData?.formatted || 'Loading...'}
          {:else}
            {selectedAddress ? 'Selected address' : 'Loading...'}
          {/if}
        </p>
        {#if selectedDate && selectedTime}
          <p class="text-gray-600 dark:text-gray-300">
            <span class="font-medium">Schedule:</span> 
            {formatDateForDisplay(selectedDate)} at {formatTimeForDisplay(selectedTime)}
          </p>
        {/if}
      </div>
    </div>

    <div class="grid gap-8 lg:grid-cols-2">
      <!-- Calendar -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Select Date
          </h2>
          <div class="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              on:click={previousMonth}
              class="p-2"
            >
              <ChevronLeft size={16} />
            </Button>
            <span class="px-4 py-2 text-lg font-medium text-gray-900 dark:text-white">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button
              variant="ghost"
              size="sm"
              on:click={nextMonth}
              class="p-2"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        <!-- Calendar grid -->
        <div class="grid grid-cols-7 gap-1 mb-2">
          {#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
            <div class="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          {/each}
        </div>

        <div class="grid grid-cols-7 gap-1">
          {#each calendarDays as day}
            <button
              class={`
                p-2 text-sm rounded-md transition-colors relative
                ${!day.isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : ''}
                ${day.isAvailable ? 'hover:bg-primary-100 dark:hover:bg-primary-900/20 cursor-pointer' : 'cursor-not-allowed text-gray-300 dark:text-gray-600'}
                ${day.isSelected ? 'bg-primary text-white hover:bg-primary-600' : ''}
                ${isToday(day.date) && !day.isSelected ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}
              `}
              disabled={!day.isAvailable}
              on:click={() => selectDate(day.date)}
            >
              {format(day.date, 'd')}
              {#if day.isAvailable && !day.isSelected}
                <div class="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
              {/if}
            </button>
          {/each}
        </div>

        <div class="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full bg-primary mr-2"></div>
                <span>Available</span>
              </div>
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span>Today</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Time slots -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Select Time
        </h2>

        {#if selectedDate}
          <div class="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
            <p class="text-sm text-gray-600 dark:text-gray-300">
              <Calendar size={16} class="inline mr-2" />
              {formatDateForDisplay(selectedDate)}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            {#each timeSlots as slot}
              <button
                class={`
                  p-3 rounded-md border-2 transition-all text-left
                  ${selectedTime === slot.time
                    ? 'border-primary bg-primary-50 dark:bg-primary-900/20 text-primary'
                    : 'border-gray-200 dark:border-gray-600 hover:border-primary hover:bg-primary-50 dark:hover:bg-primary-900/10'
                  }
                `}
                on:click={() => selectTime(slot.time)}
              >
                <div class="flex items-center">
                  <Clock size={16} class="mr-2" />
                  <span class="font-medium">{slot.displayTime}</span>
                </div>
              </button>
            {/each}
          </div>
        {:else}
          <div class="text-center py-8">
            <Calendar size={48} class="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p class="text-gray-500 dark:text-gray-400">
              Please select a date to see available times
            </p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Continue button -->
    <div class="mt-8 flex justify-end">
      <Button
        on:click={continueToNext}
        disabled={isLoading || !selectedDate || !selectedTime}
        class="px-8"
      >
        {#if isLoading}
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        {/if}
        Continue to Review
        <ArrowRight size={16} class="ml-2" />
      </Button>
    </div>
  </div>
</div>
