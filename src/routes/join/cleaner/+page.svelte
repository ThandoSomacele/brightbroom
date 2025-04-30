<!-- src/routes/join/cleaner/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import GoogleMapsAutocomplete from "$lib/components/maps/GoogleMapsAutocomplete.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import {
    getClosestServiceArea,
    isWithinServiceArea,
  } from "$lib/utils/serviceAreaValidator";
    import { Clock, Wallet, Zap } from "lucide-svelte";

  // Environment variables
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Form state
  let isSubmitting = false;
  let formSuccess = false;
  let formError: string | null = null;
  let step = 1;
  const totalSteps = 3;

  // Form data state (for multi-step form)
  let firstName = "";
  let lastName = "";
  let email = "";
  let phone = "";

  // Replace simple city with detailed address data
  let selectedAddress = {
    formatted: "",
    street: "",
    aptUnit: "",
    city: "",
    state: "",
    zipCode: "",
    lat: 0,
    lng: 0,
  };
  let addressError = "";
  let isOutOfServiceArea = false;

  // Change experience from string to array of selected types
  let experienceTypes: string[] = [];

  let availability: string[] = [];
  let ownTransport = false;
  let whatsApp = false;
  let idType = "";
  let idNumber = "";
  let hearAboutUs = "";
  let documents: File[] = [];

  // Experience types
  const EXPERIENCE_TYPES = [
    { id: "GUEST_HOUSE", label: "Cleaning Guest house/Hotel/BnB" },
    { id: "OFFICE", label: "Cleaning Offices" },
    { id: "CARE_GIVING", label: "Care Giving" },
  ];

  // Reset form after submission
  function resetForm() {
    const form = document.getElementById("join-form") as HTMLFormElement;
    if (form) form.reset();
    step = 1;
    firstName = "";
    lastName = "";
    email = "";
    phone = "";
    selectedAddress = {
      formatted: "",
      street: "",
      aptUnit: "",
      city: "",
      state: "",
      zipCode: "",
      lat: 0,
      lng: 0,
    };
    addressError = "";
    isOutOfServiceArea = false;
    experienceTypes = [];
    availability = [];
    ownTransport = false;
    whatsApp = false;
    idType = "";
    idNumber = "";
    hearAboutUs = "";
    documents = [];
  }

  // Navigation functions for multi-step form
  function nextStep() {
    if (step < totalSteps) {
      step++;
    }
  }

  function previousStep() {
    if (step > 1) {
      step--;
    }
  }

  // Handle address selection from Google autocomplete
  function handleAddressSelect(event: CustomEvent) {
    selectedAddress = event.detail.address;
    addressError = "";

    // Check if address is within service area
    if (selectedAddress.lat && selectedAddress.lng) {
      isOutOfServiceArea = !isWithinServiceArea(
        selectedAddress.lat,
        selectedAddress.lng,
      );

      if (isOutOfServiceArea) {
        const { area, distance } = getClosestServiceArea(
          selectedAddress.lat,
          selectedAddress.lng,
        );
        addressError = `This address is outside our current service areas. The closest area is ${area.name}, which is ${distance.toFixed(1)}km away.`;
      }
    }
  }

  // Handle out-of-service-area warning
  function handleOutOfServiceArea(event: CustomEvent) {
    isOutOfServiceArea = true;
    addressError =
      "This address is outside our current service areas. We'll review your application, but please note service availability may be limited.";
  }

  // Helper function to validate current step
  function validateCurrentStep(): boolean {
    if (step === 1) {
      if (
        !firstName ||
        !lastName ||
        !email ||
        !phone ||
        !selectedAddress.formatted
      ) {
        return false;
      }
      // We'll still allow applications from outside service areas, but with a warning
      return true;
    } else if (step === 2) {
      // Make sure at least one experience type is selected
      return experienceTypes.length > 0 && availability.length > 0;
    } else {
      return true;
    }
  }
  const siteUrl = import.meta.env.VITE_SITE_URL || "https://brightbroom.com";
  const ogImageUrl = `${siteUrl}/images/join-cleaning-team-og.jpg`;
</script>

<svelte:head>
  <title>Join Our Cleaner Team | BrightBroom</title>
  <meta
    name="description"
    content="Join the BrightBroom team as a professional cleaner. Flexible hours, competitive pay, and a supportive work environment."
  />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content={$page.url.href} />
  <meta property="og:title" content="Join Our Cleaner Team | BrightBroom" />
  <meta
    property="og:description"
    content="Join the BrightBroom team as a professional cleaner. Flexible hours, competitive pay, and a supportive work environment."
  />
  <meta property="og:image" content={ogImageUrl} />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Join Our Cleaner Team | BrightBroom" />
  <meta
    name="twitter:description"
    content="Join the BrightBroom team as a professional cleaner. Flexible hours, competitive pay, and a supportive work environment."
  />
  <meta name="twitter:image" content={ogImageUrl} />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <!-- Hero Section -->
  <div class="bg-primary py-16 text-white">
    <div class="container mx-auto px-4">
      <div class="mx-auto max-w-3xl text-center">
        <h1 class="mb-4 text-4xl font-bold md:text-5xl">
          Join Our Team of Professional Cleaners
        </h1>
        <p class="mb-8 text-lg text-white/90">
          Flexible hours, competitive pay, and a supportive work environment.
          Join BrightBroom and start making a living with us.
        </p>
        <Button variant="secondary" size="lg" href="#apply">Apply Now</Button>
      </div>
    </div>
  </div>

  <!-- Benefits Section -->
  <section class="py-12 bg-gray-50 dark:bg-gray-800">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
      <h2
        class="text-2xl font-bold text-gray-900 dark:text-white text-center mb-12"
      >
        Why Join BrightBroom?
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Benefit 1 -->
        <div
          class="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 text-center"
        >
          <div
            class="w-16 h-16 mx-auto bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-4"
          >
            <Clock size={24} />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Flexible Schedule
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            Work when it suits you. Set your own availability and work hours
            that fit your lifestyle.
          </p>
        </div>

        <!-- Benefit 2 -->
        <div
          class="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 text-center"
        >
          <div
            class="w-16 h-16 mx-auto bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-4"
          >
            <Wallet size={24} />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Competitive Pay
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            Earn competitive rates plus tips. Get paid weekly with transparent
            payment processing.
          </p>
        </div>

        <!-- Benefit 3 -->
        <div
          class="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 text-center"
        >
          <div
            class="w-16 h-16 mx-auto bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-4"
          >
            <Zap size={24} />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Career Growth
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            Access training opportunities, build your reputation, and grow your
            client base with our platform.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Requirements Section -->
  <div class="bg-gray-100 py-16 dark:bg-gray-800">
    <div class="container mx-auto px-4">
      <div class="mx-auto max-w-3xl">
        <h2
          class="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white"
        >
          Requirements to Join
        </h2>

        <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-700">
          <ul class="space-y-4">
            <li class="flex">
              <div
                class="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white"
              >
                <span class="text-sm font-semibold">1</span>
              </div>
              <p class="text-gray-700 dark:text-gray-300">
                South African ID or Passport document
              </p>
            </li>
            <li class="flex">
              <div
                class="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white"
              >
                <span class="text-sm font-semibold">2</span>
              </div>
              <p class="text-gray-700 dark:text-gray-300">
                At least 6 months of professional cleaning experience
              </p>
            </li>
            <li class="flex">
              <div
                class="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white"
              >
                <span class="text-sm font-semibold">3</span>
              </div>
              <p class="text-gray-700 dark:text-gray-300">
                Reliable transportation to get to job locations
              </p>
            </li>
            <li class="flex">
              <div
                class="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white"
              >
                <span class="text-sm font-semibold">4</span>
              </div>
              <p class="text-gray-700 dark:text-gray-300">
                Smartphone with internet connection to use our app
              </p>
            </li>
            <li class="flex">
              <div
                class="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white"
              >
                <span class="text-sm font-semibold">5</span>
              </div>
              <p class="text-gray-700 dark:text-gray-300">
                Good with people and have a positive attitude
              </p>
            </li>
            <li class="flex">
              <div
                class="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white"
              >
                <span class="text-sm font-semibold">6</span>
              </div>
              <p class="text-gray-700 dark:text-gray-300">
                Background check clearance (we'll handle this process)
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <!-- Testimonials Section -->
  <div class="py-16">
    <div class="container mx-auto px-4">
      <h2
        class="mb-12 text-center text-3xl font-bold text-gray-900 dark:text-white"
      >
        What Our Cleaners Say
      </h2>

      <div class="grid gap-8 md:grid-cols-3">
        <!-- Testimonial 1 -->
        <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <div class="mb-4 flex">
            <div
              class="mr-4 h-12 w-12 overflow-hidden rounded-full bg-gray-200"
            >
              <div
                class="flex h-full w-full items-center justify-center bg-primary-100 text-primary"
              >
                <span class="text-xl font-bold">N</span>
              </div>
            </div>
            <div>
              <h3 class="font-medium text-gray-900 dark:text-white">
                Nomsa M.
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Cleaner since 2022
              </p>
            </div>
          </div>
          <p class="text-gray-600 dark:text-gray-300">
            "Working with BrightBroom has completely changed my life. I can now
            manage my own schedule and earn a good income while still having
            time for my family."
          </p>
        </div>

        <!-- Testimonial 2 -->
        <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <div class="mb-4 flex">
            <div
              class="mr-4 h-12 w-12 overflow-hidden rounded-full bg-gray-200"
            >
              <div
                class="flex h-full w-full items-center justify-center bg-primary-100 text-primary"
              >
                <span class="text-xl font-bold">S</span>
              </div>
            </div>
            <div>
              <h3 class="font-medium text-gray-900 dark:text-white">
                Simon P.
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Cleaner since 2021
              </p>
            </div>
          </div>
          <p class="text-gray-600 dark:text-gray-300">
            "The app is so easy to use, and I get paid quickly after each job.
            The support team is always there when I need help with anything."
          </p>
        </div>

        <!-- Testimonial 3 -->
        <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <div class="mb-4 flex">
            <div
              class="mr-4 h-12 w-12 overflow-hidden rounded-full bg-gray-200"
            >
              <div
                class="flex h-full w-full items-center justify-center bg-primary-100 text-primary"
              >
                <span class="text-xl font-bold">T</span>
              </div>
            </div>
            <div>
              <h3 class="font-medium text-gray-900 dark:text-white">
                Thandi K.
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Cleaner since 2023
              </p>
            </div>
          </div>
          <p class="text-gray-600 dark:text-gray-300">
            "I was worried about finding consistent work, but with BrightBroom I
            now have regular work. It's been a great experience."
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Application Form Section -->
  <div id="apply" class="bg-gray-100 py-16 dark:bg-gray-800">
    <div class="container mx-auto px-4">
      <div class="mx-auto max-w-3xl">
        <h2
          class="mb-6 text-center text-3xl font-bold text-gray-900 dark:text-white"
        >
          Apply to Join
        </h2>
        <p class="mb-12 text-center text-lg text-gray-600 dark:text-gray-300">
          Fill out the application form below to start your journey with
          BrightBroom. Our team will review your application and get back to you
          within 2-3 business days.
        </p>

        {#if formSuccess}
          <div
            class="rounded-lg bg-white p-8 text-center shadow-md dark:bg-gray-700"
          >
            <div class="mb-6 flex justify-center">
              <div
                class="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h3
              class="mb-4 text-2xl font-semibold text-gray-900 dark:text-white"
            >
              Application Submitted!
            </h3>
            <p class="mb-6 text-gray-600 dark:text-gray-300">
              Thank you for applying to join the BrightBroom team. We've
              received your application and will review it shortly. You'll hear
              back from us within 2-3 business days.
            </p>
            <Button
              variant="primary"
              on:click={() => {
                formSuccess = false;
                resetForm();
              }}
            >
              Submit Another Application
            </Button>
          </div>
        {:else}
          <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-700">
            <!-- Progress indicator for multi-step form -->
            <div class="mb-8">
              <div class="flex justify-between">
                {#each Array(totalSteps) as _, i}
                  <div class="relative flex flex-col items-center">
                    <div
                      class={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        i + 1 < step
                          ? "border-primary bg-primary text-white"
                          : i + 1 === step
                            ? "border-primary bg-white text-primary dark:bg-gray-700"
                            : "border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-700"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div class="mt-2 text-xs text-gray-600 dark:text-gray-300">
                      {i === 0
                        ? "Personal Info"
                        : i === 1
                          ? "Work Experience"
                          : "Additional Details"}
                    </div>
                    {#if i < totalSteps - 1}
                      <div
                        class="absolute left-full top-5 -translate-y-1/2 w-full"
                      >
                        <div
                          class={`h-1 w-full ${i + 1 < step ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}
                        ></div>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>

            {#if formError}
              <div
                class="mb-6 rounded-md bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-200"
              >
                <p>{formError}</p>
              </div>
            {/if}

            <form
              id="join-form"
              method="POST"
              enctype="multipart/form-data"
              use:enhance={() => {
                isSubmitting = true;
                formError = null;

                // Properly handle the form submission with server result
                return async ({ result }) => {
                  isSubmitting = false;

                  if (result.type === "success") {
                    formSuccess = true;
                  } else if (result.type === "failure") {
                    // Display the error message from the server
                    formError =
                      result.data?.error ||
                      "Failed to submit your application. Please try again.";
                  } else if (result.type === "error") {
                    formError = "Something went wrong. Please try again later.";
                  }
                };
              }}
            >
              <!-- Step 1: Personal Information -->
              {#if step === 1}
                <div class="space-y-6">
                  <h3
                    class="text-xl font-semibold text-gray-900 dark:text-white"
                  >
                    Personal Information
                  </h3>

                  <!-- Name Fields (2 columns) -->
                  <div class="grid gap-4 md:grid-cols-2">
                    <div>
                      <label
                        for="firstName"
                        class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        First Name <span class="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        bind:value={firstName}
                        required
                        class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label
                        for="lastName"
                        class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Last Name <span class="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        bind:value={lastName}
                        required
                        class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <!-- Email & Phone (2 columns) -->
                  <div class="grid gap-4 md:grid-cols-2">
                    <div>
                      <label
                        for="email"
                        class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Email <span class="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        bind:value={email}
                        required
                        class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label
                        for="phone"
                        class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Phone Number <span class="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        bind:value={phone}
                        required
                        class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        placeholder="+27 12 345 6789"
                      />
                    </div>
                  </div>

                  <!-- Address - Google Maps Autocomplete -->
                  <div>
                    <GoogleMapsAutocomplete
                      apiKey={googleMapsApiKey}
                      label="Home Address"
                      placeholder="Enter your address"
                      required
                      error={addressError}
                      bind:value={selectedAddress.formatted}
                      bind:selectedAddress
                      on:select={handleAddressSelect}
                      on:outOfServiceArea={handleOutOfServiceArea}
                    />

                    {#if isOutOfServiceArea}
                      <div
                        class="mt-2 text-sm text-amber-600 dark:text-amber-400"
                      >
                        <p>
                          You're outside our current service areas, but we're
                          still accepting applications.
                        </p>
                      </div>
                    {/if}

                    <!-- Hidden fields to store address details -->
                    <input
                      type="hidden"
                      name="street"
                      value={selectedAddress.street}
                    />
                    <input
                      type="hidden"
                      name="city"
                      value={selectedAddress.city}
                    />
                    <input
                      type="hidden"
                      name="state"
                      value={selectedAddress.state}
                    />
                    <input
                      type="hidden"
                      name="zipCode"
                      value={selectedAddress.zipCode}
                    />
                    <input
                      type="hidden"
                      name="latitude"
                      value={selectedAddress.lat}
                    />
                    <input
                      type="hidden"
                      name="longitude"
                      value={selectedAddress.lng}
                    />
                  </div>
                </div>
              {/if}

              <!-- Step 2: Work Experience -->
              {#if step === 2}
                <div class="space-y-6">
                  <h3
                    class="text-xl font-semibold text-gray-900 dark:text-white"
                  >
                    Work Experience
                  </h3>

                  <!-- Experience Types - Replace the old dropdown with checkboxes -->
                  <div>
                    <p
                      id="experience-types-label"
                      class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      What types of cleaning experience do you have? <span
                        class="text-red-500">*</span
                      >
                    </p>
                    <div
                      class="space-y-2"
                      aria-labelledby="experience-types-label"
                    >
                      {#each EXPERIENCE_TYPES as expType}
                        <label class="flex items-center">
                          <input
                            type="checkbox"
                            name="experienceTypes"
                            value={expType.id}
                            bind:group={experienceTypes}
                            class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span class="ml-2 text-gray-700 dark:text-gray-300"
                            >{expType.label}</span
                          >
                        </label>
                      {/each}
                    </div>
                    {#if experienceTypes.length === 0}
                      <p class="mt-1 text-xs text-red-500">
                        Please select at least one type of experience
                      </p>
                    {/if}
                  </div>

                  <!-- Availability section remains the same -->
                  <div>
                    <p
                      id="availability-label"
                      class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Availability <span class="text-red-500">*</span>
                    </p>
                    <div class="space-y-2" aria-labelledby="availability-label">
                      {#each ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as day}
                        <label class="flex items-center">
                          <input
                            type="checkbox"
                            name="availability"
                            value={day}
                            bind:group={availability}
                            class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span class="ml-2 text-gray-700 dark:text-gray-300"
                            >{day}</span
                          >
                        </label>
                      {/each}
                    </div>
                  </div>

                  <!-- Own Transport & Supplies -->
                  <div class="grid gap-4 md:grid-cols-2">
                    <div>
                      <p
                        id="transport-label"
                        class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Do you have your own transport?
                      </p>
                      <div
                        class="space-x-4"
                        role="radiogroup"
                        aria-labelledby="transport-label"
                      >
                        <label class="inline-flex items-center">
                          <input
                            type="radio"
                            name="ownTransport"
                            value="yes"
                            bind:group={ownTransport}
                            class="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                          />
                          <span class="ml-2 text-gray-700 dark:text-gray-300"
                            >Yes</span
                          >
                        </label>
                        <label class="inline-flex items-center">
                          <input
                            type="radio"
                            name="ownTransport"
                            value="no"
                            bind:group={ownTransport}
                            class="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                          />
                          <span class="ml-2 text-gray-700 dark:text-gray-300"
                            >No</span
                          >
                        </label>
                      </div>
                    </div>
                    <div>
                      <p
                        id="whatsapp-label"
                        class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Do you have your own WhatsApp?
                      </p>
                      <div
                        class="space-x-4"
                        role="radiogroup"
                        aria-labelledby="whatsapp-label"
                      >
                        <label class="inline-flex items-center">
                          <input
                            type="radio"
                            name="whatsApp"
                            value="yes"
                            bind:group={whatsApp}
                            class="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                          />
                          <span class="ml-2 text-gray-700 dark:text-gray-300"
                            >Yes</span
                          >
                        </label>
                        <label class="inline-flex items-center">
                          <input
                            type="radio"
                            name="whatsApp"
                            value="no"
                            bind:group={whatsApp}
                            class="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                          />
                          <span class="ml-2 text-gray-700 dark:text-gray-300"
                            >No</span
                          >
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              {/if}

              <!-- Step 3: Additional Details -->
              {#if step === 3}
                <div class="space-y-6">
                  <h3
                    class="text-xl font-semibold text-gray-900 dark:text-white"
                  >
                    Additional Details
                  </h3>

                  <!-- Hidden fields from previous steps -->
                  <input type="hidden" name="firstName" value={firstName} />
                  <input type="hidden" name="lastName" value={lastName} />
                  <input type="hidden" name="email" value={email} />
                  <input type="hidden" name="phone" value={phone} />
                  <!-- Hidden field for work radius - default 20km -->
                  <input type="hidden" name="workRadius" value="20" />

                  <!-- Hidden address fields -->
                  <input
                    type="hidden"
                    name="street"
                    value={selectedAddress.street}
                  />
                  <input
                    type="hidden"
                    name="city"
                    value={selectedAddress.city}
                  />
                  <input
                    type="hidden"
                    name="state"
                    value={selectedAddress.state}
                  />
                  <input
                    type="hidden"
                    name="zipCode"
                    value={selectedAddress.zipCode}
                  />
                  <input
                    type="hidden"
                    name="latitude"
                    value={selectedAddress.lat}
                  />
                  <input
                    type="hidden"
                    name="longitude"
                    value={selectedAddress.lng}
                  />

                  <!-- For checkbox arrays, we need to handle each item -->
                  {#each experienceTypes as expType}
                    <input
                      type="hidden"
                      name="experienceTypes"
                      value={expType}
                    />
                  {/each}

                  {#each availability as day}
                    <input type="hidden" name="availability" value={day} />
                  {/each}
                  <!-- Radio button values -->
                  <input
                    type="hidden"
                    name="ownTransport"
                    value={ownTransport ? "yes" : "no"}
                  />
                  <input
                    type="hidden"
                    name="whatsApp"
                    value={whatsApp ? "yes" : "no"}
                  />

                  <!-- ID Type & Number -->
                  <div class="grid gap-4 md:grid-cols-2">
                    <div>
                      <label
                        for="idType"
                        class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        ID Type
                      </label>
                      <select
                        id="idType"
                        name="idType"
                        bind:value={idType}
                        class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Select ID type...</option>
                        <option value="SOUTH_AFRICAN_ID"
                          >South African ID</option
                        >
                        <option value="PASSPORT">Passport</option>
                      </select>
                    </div>
                    <div>
                      <label
                        for="idNumber"
                        class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        ID Number <span class="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="idNumber"
                        name="idNumber"
                        bind:value={idNumber}
                        class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <!-- Bio Field -->
                  <div>
                    <label
                      for="bio"
                      class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Short Bio (Optional)
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows="3"
                      class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="Tell us a bit about yourself and your cleaning experience"
                    ></textarea>
                  </div>

                  <!-- Pet Compatibility -->
                  <div>
                    <label
                      for="petCompatibility"
                      class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Which Pets can you work with?
                    </label>
                    <select
                      id="petCompatibility"
                      name="petCompatibility"
                      class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="NONE">No Pets</option>
                      <option value="DOGS">Dogs Only</option>
                      <option value="CATS">Cats Only</option>
                      <option value="BOTH">Both Dogs and Cats</option>
                    </select>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Do you have any preferences regarding pets at cleaning
                      locations?
                    </p>
                  </div>

                  <!-- How did you hear about us -->
                  <div>
                    <label
                      for="hearAboutUs"
                      class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      How did you hear about BrightBroom?
                    </label>
                    <select
                      id="hearAboutUs"
                      name="hearAboutUs"
                      bind:value={hearAboutUs}
                      class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Please select...</option>
                      <option value="search">Search Engine</option>
                      <option value="social">Social Media</option>
                      <option value="friend">Friend/Family</option>
                      <option value="advertisement">Advertisement</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <!-- Terms and Conditions -->
                  <div>
                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        name="terms"
                        required
                        class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span
                        class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        I agree to the <a
                          href="/terms"
                          class="text-primary hover:underline"
                          >Terms of Service</a
                        >
                        and
                        <a href="/privacy" class="text-primary hover:underline"
                          >Privacy Policy</a
                        > <span class="text-red-500">*</span>
                      </span>
                    </label>
                  </div>
                </div>
              {/if}

              <!-- Form Navigation -->
              <div class="mt-8 flex justify-between">
                {#if step > 1}
                  <Button
                    type="button"
                    variant="outline"
                    on:click={previousStep}
                  >
                    Previous
                  </Button>
                {:else}
                  <div></div>
                  <!-- Empty div for spacing when no Previous button -->
                {/if}

                {#if step < totalSteps}
                  <Button
                    type="button"
                    variant="primary"
                    disabled={!validateCurrentStep()}
                    on:click={nextStep}
                  >
                    Next
                  </Button>
                {:else}
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                  >
                    {#if isSubmitting}
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
                      Submitting...
                    {:else}
                      Submit Application
                    {/if}
                  </Button>
                {/if}
              </div>
            </form>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- FAQ Section -->
  <section class="py-12 bg-white dark:bg-gray-900">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
      <h2
        class="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8"
      >
        Frequently Asked Questions
      </h2>

      <div class="space-y-6">
        <!-- FAQ Item 1 -->
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            What happens after I submit my application?
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            Our team will review your application within 2-3 business days. If
            your profile meets our requirements, we'll reach out to schedule a
            video interview and discuss the next steps.
          </p>
        </div>

        <!-- FAQ Item 2 -->
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            What equipment or supplies do I need?
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            BrightBroom customers provide all necessary cleaning supplies and
            equipment. You just need reliable transportation to get to your jobs
            and a smartphone to use our app.
          </p>
        </div>

        <!-- FAQ Item 3 -->
        <!-- <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            How does scheduling work?
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            You set your availability in the app, and you'll be notified of booking requests that match your schedule and location. You can accept or decline jobs based on your preferences.
          </p>
        </div> -->

        <!-- FAQ Item 4 -->
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            How and when do I get paid?
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            Payments are processed weekly for all completed jobs. Funds are
            transferred directly to your bank account.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <div class="bg-primary py-16 text-white">
    <div class="container mx-auto px-4">
      <div class="mx-auto max-w-3xl text-center">
        <h2 class="mb-4 text-3xl font-bold">Ready to Join Our Team?</h2>
        <p class="mb-8 text-lg text-white/90">
          Apply today and take the first step towards a flexible cleaning career
          with BrightBroom.
        </p>
        <Button variant="secondary" size="lg" href="#apply">Apply Now</Button>
      </div>
    </div>
  </div>
</div>
