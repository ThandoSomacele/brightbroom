<!-- StepTracker.svelte - Booking progress step indicator -->
<script lang="ts">
  export let currentStep: number = 1;

  const steps = [
    { number: 1, name: 'Service' },
    { number: 2, name: 'Address' },
    { number: 3, name: 'Schedule' },
    { number: 4, name: 'Cleaner' },
    { number: 5, name: 'Review' }
  ];
</script>

<!-- Mobile view - Full width with smaller step indicators -->
<div class="mb-6 sm:mb-8 md:hidden">
  <!-- Progress bar background -->
  <div class="relative">
    <!-- Background line -->
    <div class="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700"></div>

    <!-- Progress line -->
    <div
      class="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-300"
      style="width: {((currentStep - 1) / (steps.length - 1)) * 100}%"
    ></div>

    <!-- Step indicators -->
    <div class="relative flex justify-between">
      {#each steps as step}
        <div class="flex flex-col items-center">
          <!-- Circle indicator -->
          <div
            class="relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold transition-all {
              step.number < currentStep
                ? 'bg-green-500 text-white'
                : step.number === currentStep
                ? 'bg-primary text-white ring-4 ring-primary/20'
                : 'bg-white border-2 border-gray-300 text-gray-400 dark:bg-gray-800 dark:border-gray-600'
            }"
          >
            {#if step.number < currentStep}
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            {:else}
              <span>{step.number}</span>
            {/if}
          </div>

          <!-- Step name - only show for current step on mobile -->
          <div class="mt-2 text-center">
            <p class="text-xs {
              step.number === currentStep
                ? 'font-semibold text-primary'
                : step.number < currentStep
                ? 'text-green-600 hidden sm:block'
                : 'text-gray-400 hidden sm:block'
            }">
              {step.name}
            </p>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Current step description for mobile -->
  <div class="mt-6 text-center sm:hidden">
    <p class="text-sm text-gray-500 dark:text-gray-400">
      Step {currentStep} of {steps.length}
    </p>
    <p class="text-base font-semibold text-gray-900 dark:text-white">
      {steps[currentStep - 1].name}
    </p>
  </div>
</div>

<!-- Desktop view - Full horizontal layout -->
<div class="hidden md:block mb-8">
  <div class="flex items-center justify-between">
    {#each steps as step, index}
      <div class="flex flex-1 items-center">
        <div class="flex items-center">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 {
              step.number < currentStep
                ? 'bg-green-500 text-white'
                : step.number === currentStep
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            }"
          >
            {#if step.number < currentStep}
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            {:else}
              <span class="text-sm font-semibold">{step.number}</span>
            {/if}
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium {
              step.number < currentStep
                ? 'text-green-500'
                : step.number === currentStep
                ? 'text-primary'
                : 'text-gray-500 dark:text-gray-400'
            }">
              {step.name}
            </p>
          </div>
        </div>
      </div>

      {#if index < steps.length - 1}
        <div class="flex-1 max-w-[100px]">
          <div class="h-0.5 w-full {
            step.number < currentStep
              ? 'bg-primary'
              : 'bg-gray-200 dark:bg-gray-700'
          }"></div>
        </div>
      {/if}
    {/each}
  </div>
</div>