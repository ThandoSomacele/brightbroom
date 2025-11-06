<!-- src/lib/components/booking/RecurringOptions.svelte -->
<script lang="ts">
  import {
    Calendar,
    CalendarDays,
    Clock,
    Info,
    Percent,
    WalletIcon,
  } from "lucide-svelte";
  import { createEventDispatcher } from "svelte";

  export let basePrice: number = 0;
  export let serviceDuration: number = 2; // Duration in hours
  export let selectedFrequency: string = "";
  export let selectedDays: string[] = [];
  export let selectedMonthlyDates: number[] = [];
  export let preferredTimeSlot: string = "";

  const dispatch = createEventDispatcher();

  // Discount structure based on frequency
  const discounts = {
    WEEKLY: 10, // 10% discount for weekly
    BIWEEKLY: 8, // 8% discount for bi-weekly
    TWICE_WEEKLY: 15, // 15% discount for twice weekly
  };

  // Calculate discounted price
  $: discountPercentage = selectedFrequency
    ? discounts[selectedFrequency as keyof typeof discounts]
    : 0;
  $: discountAmount = (basePrice * discountPercentage) / 100;
  $: finalPrice = basePrice - discountAmount;

  // Days of week for selection
  const daysOfWeek = [
    { value: "MONDAY", label: "Monday", short: "Mon" },
    { value: "TUESDAY", label: "Tuesday", short: "Tue" },
    { value: "WEDNESDAY", label: "Wednesday", short: "Wed" },
    { value: "THURSDAY", label: "Thursday", short: "Thu" },
    { value: "FRIDAY", label: "Friday", short: "Fri" },
    { value: "SATURDAY", label: "Saturday", short: "Sat" },
    { value: "SUNDAY", label: "Sunday", short: "Sun" },
  ];

  // Generate time slots dynamically based on service duration
  // Same logic as one-time cleaning: slots from 8 AM to 12 PM, filtered by end time
  $: timeSlots = (() => {
    const slots = [];

    // Generate all possible time slots from 8 AM to 12 PM
    for (let hour = 8; hour <= 12; hour++) {
      // Calculate end time by adding duration
      const endHour = hour + serviceDuration;

      // Include this slot only if it ends at or before 6 PM (18:00)
      if (endHour <= 18) {
        // Format start time
        const startHour12 = hour > 12 ? hour - 12 : hour;
        const startPeriod = hour >= 12 ? 'PM' : 'AM';
        const startTimeDisplay = `${startHour12}:00 ${startPeriod}`;

        // Format the value as HH:mm
        const startTimeValue = `${hour.toString().padStart(2, '0')}:00`;

        slots.push({
          value: startTimeValue,
          display: startTimeDisplay,
        });
      }
    }

    return slots;
  })();

  function handleFrequencyChange(frequency: string) {
    selectedFrequency = frequency;
    // Reset selections when frequency changes
    selectedDays = [];

    // Calculate the final price immediately with the new frequency
    const newDiscountPercentage = discounts[frequency as keyof typeof discounts];
    const newDiscountAmount = (basePrice * newDiscountPercentage) / 100;
    const newFinalPrice = basePrice - newDiscountAmount;

    dispatch("frequencyChange", {
      frequency,
      discountPercentage: newDiscountPercentage,
      finalPrice: newFinalPrice,
    });
  }

  function toggleDay(day: string) {
    if (selectedDays.includes(day)) {
      selectedDays = selectedDays.filter((d) => d !== day);
    } else {
      // Limit selection based on frequency
      if (selectedFrequency === "WEEKLY" && selectedDays.length >= 1) {
        selectedDays = [day]; // Replace selection for weekly
      } else if (
        selectedFrequency === "TWICE_WEEKLY" &&
        selectedDays.length >= 2
      ) {
        selectedDays = [...selectedDays.slice(1), day]; // Keep last 2 for twice weekly
      } else {
        selectedDays = [...selectedDays, day];
      }
    }

    dispatch("daysChange", { days: selectedDays });
  }

  function handleTimeSlotChange(slot: string) {
    preferredTimeSlot = slot;
    dispatch("timeSlotChange", { timeSlot: slot });
  }

  // Validation helper
  $: isValid =
    selectedFrequency &&
    preferredTimeSlot &&
    ((selectedFrequency === "WEEKLY" && selectedDays.length === 1) ||
      (selectedFrequency === "BIWEEKLY" && selectedDays.length === 1) ||
      (selectedFrequency === "TWICE_WEEKLY" && selectedDays.length === 2));
</script>

<div class="space-y-6">
  <!-- Frequency Selection -->
  <div>
    <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
      <CalendarDays class="h-5 w-5 text-teal-600" />
      Select Cleaning Frequency
    </h3>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <button
        type="button"
        on:click={() => handleFrequencyChange("WEEKLY")}
        class="p-4 border-2 rounded-lg transition-all {selectedFrequency ===
        'WEEKLY'
          ? 'border-teal-500 bg-teal-50'
          : 'border-gray-200 hover:border-gray-300'}"
      >
        <div class="flex justify-between items-start">
          <div class="text-left">
            <p class="font-semibold">Weekly</p>
            <p class="text-sm text-gray-600">Once every week</p>
          </div>
          <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
            {discounts.WEEKLY}% OFF
          </span>
        </div>
      </button>

      <button
        type="button"
        on:click={() => handleFrequencyChange("BIWEEKLY")}
        class="p-4 border-2 rounded-lg transition-all {selectedFrequency ===
        'BIWEEKLY'
          ? 'border-teal-500 bg-teal-50'
          : 'border-gray-200 hover:border-gray-300'}"
      >
        <div class="flex justify-between items-start">
          <div class="text-left">
            <p class="font-semibold">Bi-Weekly</p>
            <p class="text-sm text-gray-600">Every two weeks (every 14 days)</p>
          </div>
          <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
            {discounts.BIWEEKLY}% OFF
          </span>
        </div>
      </button>

      <button
        type="button"
        on:click={() => handleFrequencyChange("TWICE_WEEKLY")}
        class="p-4 border-2 rounded-lg transition-all {selectedFrequency ===
        'TWICE_WEEKLY'
          ? 'border-teal-500 bg-teal-50'
          : 'border-gray-200 hover:border-gray-300'}"
      >
        <div class="flex justify-between items-start">
          <div class="text-left">
            <p class="font-semibold">Twice Weekly</p>
            <p class="text-sm text-gray-600">Two days per week</p>
          </div>
          <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
            {discounts.TWICE_WEEKLY}% OFF
          </span>
        </div>
      </button>
    </div>
  </div>

  <!-- Day Selection based on frequency -->
  {#if selectedFrequency}
    <div>
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <Calendar class="h-5 w-5 text-teal-600" />
        Select Preferred Day{selectedFrequency === "TWICE_WEEKLY" ? "s" : ""}
      </h3>
      <p class="text-sm text-gray-600 mb-3">
        {#if selectedFrequency === "WEEKLY" || selectedFrequency === "BIWEEKLY"}
          Choose your preferred cleaning day
        {:else if selectedFrequency === "TWICE_WEEKLY"}
          Choose 2 days for your cleaning
        {/if}
      </p>

      <div class="grid grid-cols-7 gap-2">
        {#each daysOfWeek as day}
          <button
            type="button"
            on:click={() => toggleDay(day.value)}
            class="p-2 text-center border rounded-lg transition-all {selectedDays.includes(
              day.value,
            )
              ? 'border-teal-500 bg-teal-500 text-white'
              : 'border-gray-200 hover:border-gray-300'}"
            title={day.label}
          >
            <span class="text-sm font-medium">{day.short}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Time Slot Selection -->
  {#if selectedFrequency}
    <div>
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock class="h-5 w-5 text-teal-600" />
        Select a Time
      </h3>

      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {#each timeSlots as slot}
          <button
            type="button"
            class="py-3 px-3 text-center rounded-md border transition-colors cursor-pointer {preferredTimeSlot === slot.value
              ? 'border-teal-500 bg-teal-50 dark:border-teal-600 dark:bg-teal-900/20'
              : 'border-gray-200 hover:border-teal-200 dark:border-gray-700 dark:hover:border-teal-700'}"
            on:click={() => handleTimeSlotChange(slot.value)}
          >
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {slot.display}
            </span>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Pricing Summary -->
  {#if selectedFrequency && basePrice > 0}
    <div class="bg-gray-50 rounded-lg p-4 space-y-3">
      <h3 class="font-semibold flex items-center gap-2">
        <WalletIcon class="h-5 w-5 text-teal-600" />
        Recurring Pricing
      </h3>

      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span>Regular Price (per clean):</span>
          <span class="line-through text-gray-500">R {basePrice.toFixed(2)}</span>
        </div>

        {#if discountPercentage > 0}
          <div class="flex justify-between text-green-600 font-medium">
            <span class="flex items-center gap-1">
              <Percent class="h-4 w-4" />
              Recurring Discount ({discountPercentage}%):
            </span>
            <span>- R {discountAmount.toFixed(2)}</span>
          </div>
        {/if}

        <div class="pt-2 border-t">
          <div class="flex justify-between text-lg font-bold">
            <span>Total Amount (per clean):</span>
            <span class="text-teal-600">R {finalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
        <p class="flex items-start gap-2">
          <Info class="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <span>
            You'll be charged automatically {selectedFrequency === "WEEKLY"
              ? "weekly"
              : selectedFrequency === "BIWEEKLY"
                ? "every two weeks"
                : selectedFrequency === "TWICE_WEEKLY"
                  ? "on your selected days each week"
                  : "on your selected schedule"}. Cancel anytime with 48 hours
            notice.
          </span>
        </p>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Add any additional styles here */
</style>
