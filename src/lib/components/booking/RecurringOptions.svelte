<!-- src/lib/components/booking/RecurringOptions.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Calendar, CalendarDays, Clock, DollarSign, Percent, Info } from 'lucide-svelte';

  export let basePrice: number = 0;
  export let selectedFrequency: string = '';
  export let selectedDays: string[] = [];
  export let selectedMonthlyDates: number[] = [];
  export let preferredTimeSlot: string = '';

  const dispatch = createEventDispatcher();

  // Discount structure based on frequency
  const discounts = {
    WEEKLY: 10, // 10% discount for weekly
    BIWEEKLY: 8, // 8% discount for bi-weekly
    TWICE_WEEKLY: 15, // 15% discount for twice weekly
    TWICE_MONTHLY: 5, // 5% discount for twice monthly
  };

  // Calculate discounted price
  $: discountPercentage = selectedFrequency ? discounts[selectedFrequency as keyof typeof discounts] : 0;
  $: discountAmount = (basePrice * discountPercentage) / 100;
  $: finalPrice = basePrice - discountAmount;

  // Days of week for selection
  const daysOfWeek = [
    { value: 'MONDAY', label: 'Monday', short: 'Mon' },
    { value: 'TUESDAY', label: 'Tuesday', short: 'Tue' },
    { value: 'WEDNESDAY', label: 'Wednesday', short: 'Wed' },
    { value: 'THURSDAY', label: 'Thursday', short: 'Thu' },
    { value: 'FRIDAY', label: 'Friday', short: 'Fri' },
    { value: 'SATURDAY', label: 'Saturday', short: 'Sat' },
    { value: 'SUNDAY', label: 'Sunday', short: 'Sun' },
  ];

  // Time slots
  const timeSlots = [
    { value: '08:00-11:00', label: 'Morning (8:00 AM - 11:00 AM)' },
    { value: '11:00-14:00', label: 'Midday (11:00 AM - 2:00 PM)' },
    { value: '14:00-17:00', label: 'Afternoon (2:00 PM - 5:00 PM)' },
  ];

  // Monthly date options (1st, 15th, etc.)
  const monthlyDateOptions = [
    { value: 1, label: '1st of each month' },
    { value: 15, label: '15th of each month' },
  ];

  function handleFrequencyChange(frequency: string) {
    selectedFrequency = frequency;
    // Reset selections when frequency changes
    selectedDays = [];
    selectedMonthlyDates = [];

    dispatch('frequencyChange', {
      frequency,
      discountPercentage: discounts[frequency as keyof typeof discounts],
      finalPrice
    });
  }

  function toggleDay(day: string) {
    if (selectedDays.includes(day)) {
      selectedDays = selectedDays.filter(d => d !== day);
    } else {
      // Limit selection based on frequency
      if (selectedFrequency === 'WEEKLY' && selectedDays.length >= 1) {
        selectedDays = [day]; // Replace selection for weekly
      } else if (selectedFrequency === 'TWICE_WEEKLY' && selectedDays.length >= 2) {
        selectedDays = [...selectedDays.slice(1), day]; // Keep last 2 for twice weekly
      } else {
        selectedDays = [...selectedDays, day];
      }
    }

    dispatch('daysChange', { days: selectedDays });
  }

  function toggleMonthlyDate(date: number) {
    if (selectedMonthlyDates.includes(date)) {
      selectedMonthlyDates = selectedMonthlyDates.filter(d => d !== date);
    } else {
      if (selectedMonthlyDates.length >= 2) {
        selectedMonthlyDates = [...selectedMonthlyDates.slice(1), date];
      } else {
        selectedMonthlyDates = [...selectedMonthlyDates, date];
      }
    }

    dispatch('monthlyDatesChange', { dates: selectedMonthlyDates });
  }

  function handleTimeSlotChange(slot: string) {
    preferredTimeSlot = slot;
    dispatch('timeSlotChange', { timeSlot: slot });
  }

  // Validation helper
  $: isValid = selectedFrequency && preferredTimeSlot &&
    ((selectedFrequency === 'TWICE_MONTHLY' && selectedMonthlyDates.length === 2) ||
     (selectedFrequency === 'WEEKLY' && selectedDays.length === 1) ||
     (selectedFrequency === 'BIWEEKLY' && selectedDays.length === 1) ||
     (selectedFrequency === 'TWICE_WEEKLY' && selectedDays.length === 2));
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
        on:click={() => handleFrequencyChange('WEEKLY')}
        class="p-4 border-2 rounded-lg transition-all {selectedFrequency === 'WEEKLY' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}"
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
        on:click={() => handleFrequencyChange('BIWEEKLY')}
        class="p-4 border-2 rounded-lg transition-all {selectedFrequency === 'BIWEEKLY' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}"
      >
        <div class="flex justify-between items-start">
          <div class="text-left">
            <p class="font-semibold">Bi-Weekly</p>
            <p class="text-sm text-gray-600">Once every two weeks</p>
          </div>
          <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
            {discounts.BIWEEKLY}% OFF
          </span>
        </div>
      </button>

      <button
        type="button"
        on:click={() => handleFrequencyChange('TWICE_WEEKLY')}
        class="p-4 border-2 rounded-lg transition-all {selectedFrequency === 'TWICE_WEEKLY' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}"
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

      <button
        type="button"
        on:click={() => handleFrequencyChange('TWICE_MONTHLY')}
        class="p-4 border-2 rounded-lg transition-all {selectedFrequency === 'TWICE_MONTHLY' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}"
      >
        <div class="flex justify-between items-start">
          <div class="text-left">
            <p class="font-semibold">Twice Monthly</p>
            <p class="text-sm text-gray-600">Two specific dates per month</p>
          </div>
          <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
            {discounts.TWICE_MONTHLY}% OFF
          </span>
        </div>
      </button>
    </div>
  </div>

  <!-- Day/Date Selection based on frequency -->
  {#if selectedFrequency}
    <div>
      {#if selectedFrequency === 'TWICE_MONTHLY'}
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar class="h-5 w-5 text-teal-600" />
          Select Cleaning Dates
        </h3>
        <p class="text-sm text-gray-600 mb-3">Choose 2 dates each month for your cleaning</p>

        <div class="space-y-2">
          {#each monthlyDateOptions as option}
            <label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 {selectedMonthlyDates.includes(option.value) ? 'border-teal-500 bg-teal-50' : 'border-gray-200'}">
              <input
                type="checkbox"
                checked={selectedMonthlyDates.includes(option.value)}
                on:change={() => toggleMonthlyDate(option.value)}
                class="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
              />
              <span>{option.label}</span>
            </label>
          {/each}
        </div>
      {:else}
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar class="h-5 w-5 text-teal-600" />
          Select Preferred Day{selectedFrequency === 'TWICE_WEEKLY' ? 's' : ''}
        </h3>
        <p class="text-sm text-gray-600 mb-3">
          {#if selectedFrequency === 'WEEKLY' || selectedFrequency === 'BIWEEKLY'}
            Choose your preferred cleaning day
          {:else if selectedFrequency === 'TWICE_WEEKLY'}
            Choose 2 days for your cleaning
          {/if}
        </p>

        <div class="grid grid-cols-7 gap-2">
          {#each daysOfWeek as day}
            <button
              type="button"
              on:click={() => toggleDay(day.value)}
              class="p-2 text-center border rounded-lg transition-all {selectedDays.includes(day.value) ? 'border-teal-500 bg-teal-500 text-white' : 'border-gray-200 hover:border-gray-300'}"
              title={day.label}
            >
              <span class="text-sm font-medium">{day.short}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Time Slot Selection -->
  {#if selectedFrequency}
    <div>
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock class="h-5 w-5 text-teal-600" />
        Preferred Time Slot
      </h3>

      <div class="space-y-2">
        {#each timeSlots as slot}
          <label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 {preferredTimeSlot === slot.value ? 'border-teal-500 bg-teal-50' : 'border-gray-200'}">
            <input
              type="radio"
              name="timeSlot"
              value={slot.value}
              checked={preferredTimeSlot === slot.value}
              on:change={() => handleTimeSlotChange(slot.value)}
              class="w-4 h-4 text-teal-600 focus:ring-teal-500"
            />
            <span>{slot.label}</span>
          </label>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Pricing Summary -->
  {#if selectedFrequency && basePrice > 0}
    <div class="bg-gray-50 rounded-lg p-4 space-y-3">
      <h3 class="font-semibold flex items-center gap-2">
        <DollarSign class="h-5 w-5 text-teal-600" />
        Recurring Pricing
      </h3>

      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span>Regular Price (per clean):</span>
          <span>R {basePrice.toFixed(2)}</span>
        </div>

        {#if discountPercentage > 0}
          <div class="flex justify-between text-green-600 font-medium">
            <span class="flex items-center gap-1">
              <Percent class="h-4 w-4" />
              Recurring Discount ({discountPercentage}%):
            </span>
            <span>- R {discountAmount.toFixed(2)}</span>
          </div>

          <div class="pt-2 border-t">
            <div class="flex justify-between text-lg font-bold">
              <span>Your Price (per clean):</span>
              <span class="text-teal-600">R {finalPrice.toFixed(2)}</span>
            </div>
          </div>
        {/if}
      </div>

      <div class="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
        <p class="flex items-start gap-2">
          <Info class="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <span>
            You'll be charged automatically {selectedFrequency === 'TWICE_MONTHLY' ? 'on your selected dates' :
            selectedFrequency === 'WEEKLY' ? 'weekly' :
            selectedFrequency === 'BIWEEKLY' ? 'every two weeks' :
            'on your selected days'}. Cancel anytime with 48 hours notice.
          </span>
        </p>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Add any additional styles here */
</style>