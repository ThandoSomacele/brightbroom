<!-- src/routes/book/schedule/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/Button.svelte";
  import { Calendar, Clock, ArrowRight, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-svelte";
  import { format, parse, isEqual, isSameDay, isToday, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, endOfWeek, startOfWeek, isSameMonth } from "date-fns";
  
  // Get data from the server load function
  export let data;
  const { availableDates, timeSlots } = data;
  
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
    if (selectedDate && selectedTime) {
      // Show loading state
      isLoading = true;
      
      try {
        // Store selections in localStorage to persist through navigation
        localStorage.setItem("booking_date", selectedDate);
        localStorage.setItem("booking_time", selectedTime);
        
        // Navigate to cleaner selection
        await goto("/book/cleaner");
      } catch (error) {
        console.error("Navigation error:", error);
      } finally {
        // Reset loading state (though this won't be seen due to navigation)
        isLoading = false;
      }
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
            class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white"
          >
            <span>3</span>
          </div>
          <div class="ml-2">
            <p class="text-sm font-medium text-primary">Schedule</p>
          </div>
        </div>

        <div class="hidden flex-1 md:flex">
          <div class="h-1 w-full bg-gray-200 dark:bg-gray-700"></div>
        </div>

        <div class="flex flex-1 items-center">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
          >
            <span>4</span>
          </div>
          <div class="ml-2">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Review
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Date and time selection -->
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

    <!-- Selected date and time summary -->
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
        disabled={!selectedDate || !selectedTime || isLoading}
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
