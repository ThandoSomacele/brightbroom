<!-- src/routes/book/schedule/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/Button.svelte";
  import { Calendar, Clock, ArrowRight, ArrowLeft, Info } from "lucide-svelte";
  
  // Get data from the server load function
  export let data;
  const { availableDates, timeSlots, selectedService } = data;
  
  // Track selected date and time
  let selectedDate = "";
  let selectedTime = "";
  
  // Add loading state
  let isLoading = false;
  
  // Get previous selections from localStorage
  let selectedServiceId = "";
  let selectedAddress = "";
  let accessInstructions = "";
  
  // Initialize data from localStorage on mount
  import { onMount } from 'svelte';
  
  onMount(() => {
    // Get previous selections
    selectedServiceId = localStorage.getItem('booking_service') || '';
    selectedAddress = localStorage.getItem('booking_address') || '';
    accessInstructions = localStorage.getItem('booking_instructions') || '';
    
    // If required information is missing, redirect back
    if (!selectedServiceId || !selectedAddress) {
      goto('/book');
    }
    
    // Default to first available date
    if (availableDates.length > 0 && !selectedDate) {
      selectedDate = availableDates[0].date;
    }
  });
  
  // Continue to next step
  async function continueToNext() {
    if (selectedDate && selectedTime) {
      // Show loading state
      isLoading = true;
      
      try {
        // Store selections in localStorage to persist through navigation
        localStorage.setItem('booking_date', selectedDate);
        localStorage.setItem('booking_time', selectedTime);
        
        // Navigate to review
        await goto('/book/review');
      } catch (error) {
        console.error('Navigation error:', error);
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
      await goto('/book/address');
    } catch (error) {
      console.error('Navigation error:', error);
      isLoading = false;
    }
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
      <!-- Date selection -->
      <div>
        <h2
          class="mb-4 flex items-center text-xl font-semibold text-gray-900 dark:text-white"
        >
          <Calendar size={20} class="mr-2 text-primary" />
          Select a Date
        </h2>

        <div
          class="max-h-96 overflow-y-auto rounded-lg bg-white p-4 shadow-md dark:bg-gray-800"
        >
          {#if availableDates.length > 0}
            <div class="space-y-2">
              {#each availableDates as dateOption}
                <div
                  class={`cursor-pointer rounded-md border p-3 transition-colors
                      ${
                        selectedDate === dateOption.date
                          ? "border-primary bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20"
                          : "border-gray-200 hover:border-primary-200 dark:border-gray-700 dark:hover:border-primary-700"
                      }`}
                  on:click={() => (selectedDate = dateOption.date)}
                  on:keydown={(e) =>
                    e.key === "Enter" && (selectedDate = dateOption.date)}
                  role="button"
                  tabindex="0"
                >
                  <div class="flex justify-between">
                    <span class="font-medium text-gray-900 dark:text-white"
                      >{dateOption.displayDate}</span
                    >
                    {#if selectedDate === dateOption.date}
                      <span class="text-primary">✓</span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-center text-gray-500 dark:text-gray-400">
              No available dates
            </p>
          {/if}
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
            <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {#each timeSlots as slot}
                <div
                  class={`cursor-pointer rounded-md border p-3 text-center transition-colors
                      ${
                        selectedTime === slot.time
                          ? "border-primary bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20"
                          : "border-gray-200 hover:border-primary-200 dark:border-gray-700 dark:hover:border-primary-700"
                      }`}
                  on:click={() => (selectedTime = slot.time)}
                  on:keydown={(e) =>
                    e.key === "Enter" && (selectedTime = slot.time)}
                  role="button"
                  tabindex="0"
                >
                  <span
                    class="text-sm font-medium text-gray-900 dark:text-white"
                    >{slot.displayTime}</span
                  >
                </div>
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

    {#if selectedService}
  <div class="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center">
    <Info size={18} class="text-primary mr-2 flex-shrink-0" />
    <p class="text-sm text-gray-700 dark:text-gray-300">
      Service duration: {selectedService.durationHours} {selectedService.durationHours === 1 ? 'hour' : 'hours'}. 
      Only showing time slots that allow cleaners to finish by 6:00 PM.
    </p>
  </div>
{/if}

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
