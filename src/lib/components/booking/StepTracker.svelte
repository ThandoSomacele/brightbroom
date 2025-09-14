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

<div class="mb-8">
  <div class="flex items-center justify-between">
    {#each steps as step, index}
      <div class="flex flex-1 items-center">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-full {
            step.number < currentStep
              ? 'bg-green-500 text-white'
              : step.number === currentStep
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
          }"
        >
          {#if step.number < currentStep}
            <span>✓</span>
          {:else}
            <span>{step.number}</span>
          {/if}
        </div>
        <div class="ml-2">
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

      {#if index < steps.length - 1}
        <div class="hidden flex-1 md:flex">
          <div class="h-1 w-full {
            step.number < currentStep
              ? 'bg-primary'
              : 'bg-gray-200 dark:bg-gray-700'
          }"></div>
        </div>
      {/if}
    {/each}
  </div>
</div>