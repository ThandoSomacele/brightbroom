<!-- src/routes/service-areas/+page.svelte -->
<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import SectionHeading from "$lib/components/ui/SectionHeading.svelte";
  import { SERVICE_AREAS } from "$lib/utils/serviceAreaValidator";
  import { MapPin, Check } from "lucide-svelte";

  // Local state
  let selectedArea: string | null = null;

  // Toggle area selection
  function selectArea(areaName: string) {
    selectedArea = selectedArea === areaName ? null : areaName;
  }
</script>

<svelte:head>
  <title>Service Areas | BrightBroom</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
  <div class="mx-auto max-w-7xl">
    <!-- Hero section -->
    <div class="mb-12 text-center">
      <h1 class="font-heading text-4xl font-bold text-gray-900 dark:text-white">
        Our Service Areas
      </h1>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-300">
        BrightBroom currently serves these areas around Gauteng, South Africa with varied coverage radiuses.
      </p>
    </div>

    <!-- Service areas section -->
    <div class="mb-16">
      <div class="mb-6 lg:grid-cols-5">
        <!-- Service areas list -->
        <div class="w-full">
          <Card>
            <h2 class="font-heading mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Areas We Serve
            </h2>

            <ul class="space-y-3">
              {#each SERVICE_AREAS as area}
                <li>
                  <button
                    class={`card card-hover w-full border-2 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700
                      ${
                        selectedArea === area.name
                          ? "border-primary bg-primary-50 dark:border-primary-700 dark:bg-primary-900/20"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                    on:click={() => selectArea(area.name)}
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center">
                        <MapPin class="mr-3 h-5 w-5 text-primary" />
                        <span class="font-medium text-gray-900 dark:text-white">
                          {area.name}
                        </span>
                      </div>

                      {#if selectedArea === area.name}
                        <div class="rounded-full bg-primary p-1 text-white">
                          <Check class="h-4 w-4" />
                        </div>
                      {/if}
                    </div>

                    <p class="mt-1 pl-8 text-sm text-gray-500 dark:text-gray-400">
                      Service radius: {area.radius} km
                    </p>
                  </button>
                </li>
              {/each}
            </ul>
          </Card>
        </div>
      </div>

      <!-- Note about coverage -->
      <div class="rounded-lg bg-primary-50 p-6 dark:bg-primary-900/20">
        <h3 class="text-lg font-medium text-primary-800 dark:text-primary-300">
          Extended Coverage
        </h3>
        <p class="mt-2 text-primary-700 dark:text-primary-300">
          We've expanded our coverage with special attention to areas like Diepsloot (100km radius) and 
          Cosmo City/Roodepoort (50km radius). Our other service areas have a standard 15-30km radius, 
          ensuring reliable and efficient service delivery.
        </p>
        <div class="mt-4">
          <Button
            variant="primary"
            href="/contact?subject=Service Area Request"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </div>

    <!-- FAQ section -->
    <div class="mb-16">
      <SectionHeading title="Frequently Asked Questions" />

      <div class="space-y-4">
        <div class="card card-hover">
          <button
            class="flex w-full items-center justify-between p-4 text-left focus:outline-none"
            aria-expanded="true"
          >
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              How do I know if my address is covered?
            </h3>
          </button>
          <div class="p-4 pt-0">
            <p class="text-gray-600 dark:text-gray-300">
              Our booking system will automatically verify if your address is within our service area during checkout. 
              We have varying coverage radiuses based on location, with special extended coverage for areas like Diepsloot.
            </p>
          </div>
        </div>

        <div class="card card-hover">
          <button
            class="flex w-full items-center justify-between p-4 text-left focus:outline-none"
            aria-expanded="true"
          >
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              What if I'm just outside your service area?
            </h3>
          </button>
          <div class="p-4 pt-0">
            <p class="text-gray-600 dark:text-gray-300">
              With our expanded coverage in certain regions, most locations around Gauteng are now covered. 
              If your address still falls outside our service areas, please contact our support team, 
              and we'll do our best to accommodate your request.
            </p>
          </div>
        </div>

        <div class="card card-hover">
          <button
            class="flex w-full items-center justify-between p-4 text-left focus:outline-none"
            aria-expanded="true"
          >
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Are there different prices for locations farther from service centers?
            </h3>
          </button>
          <div class="p-4 pt-0">
            <p class="text-gray-600 dark:text-gray-300">
              We offer the same competitive pricing throughout our service areas regardless of distance.
              However, for locations on the outermost edges of our service areas, availability might be
              more limited depending on cleaner schedules.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA section -->
    <div class="rounded-lg bg-primary p-8 text-center text-white">
      <h2 class="mb-4 text-2xl font-bold">Ready to Book a Cleaning?</h2>
      <p class="mb-6 text-white/90">
        Experience our professional cleaning services in your area today.
      </p>
      <Button variant="secondary" href="/book">Book Now</Button>
    </div>
  </div>
</div>