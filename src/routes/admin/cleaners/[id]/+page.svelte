<!-- src/routes/admin/cleaners/[id]/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import { VITE_GOOGLE_MAPS_API_KEY } from "$env/static/public";
  import DbDebugger from "$lib/components/admin/DbDebugger.svelte";
  import ProfileImageUpload from "$lib/components/admin/ProfileImageUpload.svelte";
  import GoogleMapsAutocomplete from "$lib/components/maps/GoogleMapsAutocomplete.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import {
    getClosestServiceArea,
    isWithinServiceArea,
  } from "$lib/utils/serviceAreaValidator";
  import {
    Briefcase,
    Calendar,
    ChevronLeft,
    Mail,
    MapPin,
    PenTool,
    Phone,
    Save,
    User,
    X,
  } from "lucide-svelte";

  export let data;
  export let form;

  const { cleaner, services, bookings } = data;

  // Mode tracking
  let isPersonalInfoEditMode = false;
  let isProfileEditMode = false;
  let isSpecialisationsEditMode = false;
  let isLoading = false;

  // Personal info form values
  let firstName = cleaner.firstName;
  let lastName = cleaner.lastName;
  let email = cleaner.email;
  let phone = cleaner.phone || "";

  // Profile form values
  let workAddress = cleaner.cleanerProfile?.workAddress || "";
  let workRadius = cleaner.cleanerProfile?.workRadius?.toString() || "10";
  let bio = cleaner.cleanerProfile?.bio || "";
  let petCompatibility = cleaner.cleanerProfile?.petCompatibility || "NONE";
  let isAvailable = cleaner.cleanerProfile?.isAvailable || true;
  let idType = cleaner.cleanerProfile?.idType || "SOUTH_AFRICAN_ID";
  let idNumber = cleaner.cleanerProfile?.idNumber || "";
  let taxNumber = cleaner.cleanerProfile?.taxNumber || "";

  // Track available days (convert from array to object for easier handling)
  let availableDays = {
    MONDAY: false,
    TUESDAY: false,
    WEDNESDAY: false,
    THURSDAY: false,
    FRIDAY: false,
    SATURDAY: false,
    SUNDAY: false,
  };

  // Experience types constant
  const EXPERIENCE_TYPES = [
    { id: "GUEST_HOUSE", label: "Cleaning Guest house/Hotel/BnB" },
    { id: "OFFICE", label: "Cleaning Offices" },
    { id: "CARE_GIVING", label: "Care Giving" },
  ];

  // Initialize availableDays if data exists
  if (cleaner.cleanerProfile?.availableDays) {
    cleaner.cleanerProfile.availableDays.forEach((day) => {
      availableDays[day] = true;
    });
  }

  // Initialize selected experience types
  let selectedExperienceTypes: string[] =
    cleaner.cleanerProfile?.experienceTypes || [];

  // Track specialisations
  let selectedSpecialisations = new Map();

  // Initialize selected specialisations
  if (cleaner.specialisations) {
    cleaner.specialisations.forEach((spec) => {
      selectedSpecialisations.set(spec.serviceId, {
        selected: true,
        experience: spec.experience || 0,
      });
    });
  }

  // Format date function
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Format time function
  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Get status badge class
  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  }

  // Toggle personal info edit mode
  function togglePersonalInfoEdit() {
    isPersonalInfoEditMode = !isPersonalInfoEditMode;

    if (isPersonalInfoEditMode) {
      // Set initial values when entering edit mode
      firstName = cleaner.firstName;
      lastName = cleaner.lastName;
      phone = cleaner.phone || "";
    }
  }

  // Toggle specialisations edit mode
  function toggleSpecialisationsEdit() {
    isSpecialisationsEditMode = !isSpecialisationsEditMode;

    if (isSpecialisationsEditMode) {
      // Reset selected specialisations
      selectedSpecialisations = new Map();

      // Set from cleaner data
      if (cleaner.specialisations) {
        cleaner.specialisations.forEach((spec) => {
          selectedSpecialisations.set(spec.serviceId, {
            selected: true,
            experience: spec.experience || 0,
          });
        });
      }

      // Initialize missing services
      services.forEach((service) => {
        if (!selectedSpecialisations.has(service.id)) {
          selectedSpecialisations.set(service.id, {
            selected: false,
            experience: 0,
          });
        }
      });
    }
  }

  // Toggle service selection
  function toggleServiceSelection(serviceId: string) {
    if (selectedSpecialisations.has(serviceId)) {
      const currentValue = selectedSpecialisations.get(serviceId);
      selectedSpecialisations.set(serviceId, {
        ...currentValue,
        selected: !currentValue.selected,
      });
      // Force Svelte reactivity by creating a new Map with the same entries
      selectedSpecialisations = new Map(selectedSpecialisations);
    }
  }

  // Update service experience
  function updateServiceExperience(serviceId: string, months: number) {
    if (selectedSpecialisations.has(serviceId)) {
      const currentValue = selectedSpecialisations.get(serviceId);
      selectedSpecialisations.set(serviceId, {
        ...currentValue,
        experience: months,
      });
    }
  }

  // Convert available days to array for form submission
  function getAvailableDaysArray() {
    return Object.entries(availableDays)
      .filter(([_, isSelected]) => isSelected)
      .map(([day, _]) => day);
  }

  // Get selected specialisations for form submission
  function getSelectedSpecialisations() {
    const result = [];
    selectedSpecialisations.forEach((value, serviceId) => {
      if (value.selected) {
        result.push({
          serviceId,
          experience: parseInt(value.experience.toString()) || 0,
        });
      }
    });
    return JSON.stringify(result);
  }

  // Function to handle form submission
  function toggleProfileEdit() {
    isProfileEditMode = !isProfileEditMode;

    if (isProfileEditMode) {
      // Set initial values when entering edit mode
      workAddress = cleaner.cleanerProfile?.workAddress || "";
      workRadius = cleaner.cleanerProfile?.workRadius?.toString() || "10";
      bio = cleaner.cleanerProfile?.bio || "";
      petCompatibility = cleaner.cleanerProfile?.petCompatibility || "NONE";
      isAvailable = cleaner.cleanerProfile?.isAvailable || true;
      idType = cleaner.cleanerProfile?.idType || "SOUTH_AFRICAN_ID";
      idNumber = cleaner.cleanerProfile?.idNumber || "";
      taxNumber = cleaner.cleanerProfile?.taxNumber || "";
      selectedExperienceTypes = cleaner.cleanerProfile?.experienceTypes || [];

      // Reset available days
      Object.keys(availableDays).forEach((day) => {
        availableDays[day] = false;
      });

      // Set available days from cleaner data
      if (cleaner.cleanerProfile?.availableDays) {
        cleaner.cleanerProfile.availableDays.forEach((day) => {
          availableDays[day] = true;
        });
      }
    }
  }

  // Navigate to all cleaner bookings
  function viewAllBookings() {
    window.location.href = `/admin/bookings?search=${cleaner.email}`;
  }
  // Add a function to handle profile image upload success
  function handleProfileImageSuccess({ detail }: CustomEvent<{ url: string }>) {
    // Show success message or update UI as needed
    if (detail.url) {
      // Profile image updated successfully
      // You could show a notification or simply let the UI update via invalidation
    } else {
      // Profile image removed successfully
    }
  }

  // Add a function to handle profile image upload errors
  function handleProfileImageError({
    detail,
  }: CustomEvent<{ message: string }>) {
    // Show error message
    console.error("Profile image error:", detail.message);
    // You could set an error state variable here to show to the user
  }
  // Add geocoding data for the work address
  let addressInput = cleaner.cleanerProfile?.workAddress || "";
  let workCoordinates = {
    lat: cleaner.cleanerProfile?.workLocationLat || 0,
    lng: cleaner.cleanerProfile?.workLocationLng || 0,
  };
  let selectedAddress = {
    formatted: cleaner.cleanerProfile?.workAddress || "",
    street: "",
    aptUnit: "",
    city: "",
    state: "",
    zipCode: "",
    lat: cleaner.cleanerProfile?.workLocationLat || 0,
    lng: cleaner.cleanerProfile?.workLocationLng || 0,
  };
  let addressError = "";
  let isOutOfServiceArea = false;

  // Add address selection handler
  function handleAddressSelect(event) {
    selectedAddress = event.detail.address;
    addressError = "";

    // Update work address and coordinates
    workAddress = selectedAddress.formatted;
    workCoordinates = {
      lat: selectedAddress.lat,
      lng: selectedAddress.lng,
    };

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
  function handleOutOfServiceArea(event) {
    isOutOfServiceArea = true;
    addressError = "This address is outside our current service areas.";
  }
</script>

<svelte:head>
  <title>Cleaner Details | BrightBroom Admin</title>
</svelte:head>

<!-- Page header with back button -->
<div class="mb-6 flex items-center">
  <a
    href="/admin/cleaners"
    class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mr-3"
  >
    <ChevronLeft size={20} />
  </a>
  <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
    Cleaner Details
  </h1>
</div>

<!-- Success/Error messages -->
{#if form?.success}
  <div
    class="mb-6 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 p-4 rounded-md"
  >
    {form.message}
  </div>
{:else if form?.error}
  <div
    class="mb-6 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 p-4 rounded-md"
  >
    {form.error}
  </div>
{/if}

<!-- Main grid -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <!-- Left column: Cleaner profile -->
  <div class="space-y-6">
    <!-- Personal Information Card -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Personal Information
          </h2>
          <Button variant="ghost" size="sm" on:click={togglePersonalInfoEdit}>
            {#if isPersonalInfoEditMode}
              <X size={16} class="mr-1" />
              Cancel
            {:else}
              <PenTool size={16} class="mr-1" />
              Edit
            {/if}
          </Button>
        </div>

        {#if isPersonalInfoEditMode}
          <form
            method="POST"
            action="?/updatePersonalInfo"
            use:enhance={() => {
              isLoading = true;

              return async ({ result, update }) => {
                isLoading = false;

                if (result.type === "success") {
                  isPersonalInfoEditMode = false;
                }

                // First update the form result (success/error message)
                await update();

                // Then invalidate all data to force a refresh of the page data
                if (result.type === "success") {
                  await invalidateAll();
                }
              };
            }}
          >
            <div class="space-y-4">
              <div>
                <label
                  for="firstName"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  bind:value={firstName}
                  required
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label
                  for="lastName"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  bind:value={lastName}
                  required
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label
                  for="email"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  disabled
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                />
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Email address cannot be changed
                </p>
              </div>

              <div>
                <label
                  for="phone"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  bind:value={phone}
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div class="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                  class="w-full"
                >
                  {#if isLoading}
                    <svg
                      class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Saving...
                  {:else}
                    <Save size={16} class="mr-2" />
                    Save Changes
                  {/if}
                </Button>
              </div>
            </div>
          </form>
        {:else}
          <div class="space-y-4">
            <div class="flex items-center">
              <User class="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
              <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Name
                </p>
                <p class="text-gray-900 dark:text-white">
                  {cleaner.firstName}
                  {cleaner.lastName}
                </p>
              </div>
            </div>

            <div class="flex items-center">
              <Mail class="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
              <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </p>
                <p class="text-gray-900 dark:text-white">
                  {cleaner.email}
                </p>
              </div>
            </div>

            {#if cleaner.phone}
              <div class="flex items-center">
                <Phone class="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                <div>
                  <p
                    class="text-sm font-medium text-gray-500 dark:text-gray-400"
                  >
                    Phone
                  </p>
                  <p class="text-gray-900 dark:text-white">
                    {cleaner.phone}
                  </p>
                </div>
              </div>
            {/if}

            <div class="flex items-center">
              <Calendar class="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
              <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Member Since
                </p>
                <p class="text-gray-900 dark:text-white">
                  {formatDate(cleaner.createdAt)}
                </p>
              </div>
            </div>
          </div>
        {/if}

        <!-- Profile Image Upload -->
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Profile Image
          </h3>
          <ProfileImageUpload
            userId={cleaner.id}
            userType="cleaner"
            currentImageUrl={cleaner.cleanerProfile?.profileImageUrl || null}
            on:success={handleProfileImageSuccess}
            on:error={handleProfileImageError}
            disabled={isPersonalInfoEditMode || isLoading}
          />
        </div>

        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <details class="text-sm">
            <summary
              class="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-primary"
            >
              Advanced Troubleshooting
            </summary>
            <DbDebugger userId={cleaner.id} />
          </details>
        </div>
      </div>
    </div>

    <!-- Cleaner Profile Card -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Cleaner Profile
          </h2>
          <Button variant="ghost" size="sm" on:click={toggleProfileEdit}>
            {#if isProfileEditMode}
              <X size={16} class="mr-1" />
              Cancel
            {:else}
              <PenTool size={16} class="mr-1" />
              Edit
            {/if}
          </Button>
        </div>

        {#if isProfileEditMode}
          <form
            method="POST"
            action="?/updateProfile"
            use:enhance={() => {
              isLoading = true;

              return async ({ result, update }) => {
                isLoading = false;

                if (result.type === "success") {
                  isProfileEditMode = false;
                }

                await update();

                // Then invalidate all data to force a refresh of the page data
                if (result.type === "success") {
                  await invalidateAll();
                }
              };
            }}
          >
            <div class="space-y-4">
              <!-- Work Address -->
              <div>
                <GoogleMapsAutocomplete
                  apiKey={VITE_GOOGLE_MAPS_API_KEY}
                  label="Work Address"
                  placeholder="Enter cleaner's home/work address"
                  required
                  error={addressError}
                  value={addressInput}
                  bind:selectedAddress
                  on:select={handleAddressSelect}
                  on:outOfServiceArea={handleOutOfServiceArea}
                />

                {#if isOutOfServiceArea}
                  <div class="mt-2 text-sm text-amber-600 dark:text-amber-400">
                    <p>
                      Note: This address is outside our current service areas.
                    </p>
                  </div>
                {/if}

                <!-- Hidden fields to store all address components -->
                <input
                  type="hidden"
                  name="workAddress"
                  value={selectedAddress.formatted}
                />
                <input
                  type="hidden"
                  name="workLocationLat"
                  value={selectedAddress.lat}
                />
                <input
                  type="hidden"
                  name="workLocationLng"
                  value={selectedAddress.lng}
                />
              </div>

              <!-- Work Radius -->
              <div>
                <label
                  for="workRadius"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Work Radius (km)
                </label>
                <input
                  type="number"
                  id="workRadius"
                  name="workRadius"
                  bind:value={workRadius}
                  min="1"
                  max="50"
                  required
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label
                  for="experience-types"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Experience Types
                </label>
                <div class="space-y-2">
                  {#each EXPERIENCE_TYPES as expType}
                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        name="experienceTypes"
                        value={expType.id}
                        checked={selectedExperienceTypes.includes(expType.id)}
                        on:change={(e) => {
                          if (e.currentTarget.checked) {
                            selectedExperienceTypes = [
                              ...selectedExperienceTypes,
                              expType.id,
                            ];
                          } else {
                            selectedExperienceTypes =
                              selectedExperienceTypes.filter(
                                (id) => id !== expType.id,
                              );
                          }
                        }}
                        class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span
                        class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                        >{expType.label}</span
                      >
                    </label>
                  {/each}
                </div>
              </div>

              <input
                type="hidden"
                name="experienceTypesJson"
                value={JSON.stringify(selectedExperienceTypes)}
              />

              <!-- ID Type and Number -->
              <div>
                <label
                  for="idType"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  ID Type
                </label>
                <select
                  id="idType"
                  name="idType"
                  bind:value={idType}
                  required
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="SOUTH_AFRICAN_ID">South African ID</option>
                  <option value="PASSPORT">Passport</option>
                </select>
              </div>

              <div>
                <label
                  for="idNumber"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  ID Number
                </label>
                <input
                  type="text"
                  id="idNumber"
                  name="idNumber"
                  bind:value={idNumber}
                  required
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <!-- Tax Number -->
              <div>
                <label
                  for="taxNumber"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Tax Number (optional)
                </label>
                <input
                  type="text"
                  id="taxNumber"
                  name="taxNumber"
                  bind:value={taxNumber}
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <!-- Pet Compatibility -->
              <div>
                <label
                  for="petCompatibility"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Pet Compatibility
                </label>
                <select
                  id="petCompatibility"
                  name="petCompatibility"
                  bind:value={petCompatibility}
                  required
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="NONE">No pets</option>
                  <option value="DOGS">Dogs only</option>
                  <option value="CATS">Cats only</option>
                  <option value="BOTH">Dogs and cats</option>
                </select>
              </div>

              <!-- Bio -->
              <div>
                <label
                  for="bio"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  bind:value={bio}
                  rows="3"
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                ></textarea>
              </div>

              <!-- Available Days -->
              <div>
                <div
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Available Days
                </div>
                <div class="grid grid-cols-2 gap-2">
                  {#each Object.keys(availableDays) as day}
                    <div class="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`day-${day}`}
                        bind:checked={availableDays[day]}
                        class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label
                        for={`day-${day}`}
                        class="text-sm text-gray-700 dark:text-gray-300"
                      >
                        {day.charAt(0) + day.slice(1).toLowerCase()}
                      </label>
                    </div>
                  {/each}
                </div>
                <input
                  type="hidden"
                  name="availableDays"
                  value={JSON.stringify(getAvailableDaysArray())}
                />
              </div>

              <!-- Availability Toggle -->
              <div>
                <label class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    bind:checked={isAvailable}
                    class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span class="text-sm text-gray-700 dark:text-gray-300"
                    >Available for bookings</span
                  >
                </label>
              </div>

              <!-- Submit button -->
              <div class="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                  class="w-full"
                >
                  {#if isLoading}
                    <svg
                      class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Saving...
                  {:else}
                    <Save size={16} class="mr-2" />
                    Save Profile
                  {/if}
                </Button>
              </div>
            </div>
          </form>
        {:else}
          <!-- Display mode for cleaner profile -->
          <div class="space-y-4">
            {#if cleaner.cleanerProfile}
              <!-- Rating, Work Location, etc. remain the same -->

              <!-- Add Experience Types section -->
              <div class="flex items-start mt-3">
                <Briefcase
                  class="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 mt-1"
                />
                <div>
                  <p
                    class="text-sm font-medium text-gray-500 dark:text-gray-400"
                  >
                    Experience Types
                  </p>
                  {#if cleaner.cleanerProfile.experienceTypes && cleaner.cleanerProfile.experienceTypes.length > 0}
                    <div class="flex flex-wrap gap-1 mt-1">
                      {#each cleaner.cleanerProfile.experienceTypes as expType}
                        <span
                          class="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary dark:bg-primary-900/20"
                        >
                          {expType === "GUEST_HOUSE"
                            ? "Cleaning Guest house/Hotel/BnB"
                            : expType === "OFFICE"
                              ? "Cleaning Offices"
                              : expType === "CARE_GIVING"
                                ? "Care Giving"
                                : expType}
                        </span>
                      {/each}
                    </div>
                  {:else}
                    <p class="text-gray-600 dark:text-gray-400">
                      No experience types specified
                    </p>
                  {/if}
                </div>
              </div>

              {#if cleaner.cleanerProfile && cleaner.cleanerProfile.workAddress}
              <div class="flex items-start">
                <MapPin
                  class="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 mt-1"
                />
                <div>
                  <p
                    class="text-sm font-medium text-gray-500 dark:text-gray-400"
                  >
                    Work Location
                  </p>
                  <p class="text-gray-900 dark:text-white">
                    {cleaner.cleanerProfile.workAddress}
                  </p>
                  {#if cleaner.cleanerProfile.workRadius}
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {cleaner.cleanerProfile.workRadius}km radius
                    </p>
                  {/if}
                  
                  <!-- Add a small service area status indicator -->
                  {#if cleaner.cleanerProfile.workLocationLat && cleaner.cleanerProfile.workLocationLng}
                    {#if isWithinServiceArea(cleaner.cleanerProfile.workLocationLat, cleaner.cleanerProfile.workLocationLng)}
                      <p class="text-xs text-green-600 dark:text-green-400 mt-1">
                        Within service area
                      </p>
                    {:else}
                      <p class="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Outside main service areas
                      </p>
                    {/if}
                  {/if}
                </div>
              </div>
            {/if}
            

              {#if cleaner.cleanerProfile.availableDays && cleaner.cleanerProfile.availableDays.length > 0}
                <div class="flex items-start">
                  <Calendar
                    class="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 mt-1"
                  />
                  <div>
                    <p
                      class="text-sm font-medium text-gray-500 dark:text-gray-400"
                    >
                      Available Days
                    </p>
                    <p class="text-gray-900 dark:text-white">
                      {cleaner.cleanerProfile.availableDays
                        .map(
                          (day) => day.charAt(0) + day.slice(1).toLowerCase(),
                        )
                        .join(", ")}
                    </p>
                  </div>
                </div>
              {/if}

              {#if cleaner.cleanerProfile.petCompatibility && cleaner.cleanerProfile.petCompatibility !== "NONE"}
                <div class="flex items-start">
                  <div
                    class="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 mt-1"
                  >
                    <!-- Pet icon (could be replaced with a proper pet icon) -->
                    🐾
                  </div>
                  <div>
                    <p
                      class="text-sm font-medium text-gray-500 dark:text-gray-400"
                    >
                      Pet Compatibility
                    </p>
                    <p class="text-gray-900 dark:text-white">
                      {cleaner.cleanerProfile.petCompatibility === "DOGS"
                        ? "Dogs only"
                        : cleaner.cleanerProfile.petCompatibility === "CATS"
                          ? "Cats only"
                          : cleaner.cleanerProfile.petCompatibility === "BOTH"
                            ? "Dogs and cats"
                            : "None"}
                    </p>
                  </div>
                </div>
              {/if}

              {#if cleaner.cleanerProfile.bio}
                <div class="flex items-start">
                  <User
                    class="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 mt-1"
                  />
                  <div>
                    <p
                      class="text-sm font-medium text-gray-500 dark:text-gray-400"
                    >
                      Bio
                    </p>
                    <p class="text-gray-900 dark:text-white">
                      {cleaner.cleanerProfile.bio}
                    </p>
                  </div>
                </div>
              {/if}

              <div
                class="flex items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-700"
              >
                <div class="flex items-center">
                  <div
                    class={`h-2.5 w-2.5 rounded-full mr-2 ${cleaner.cleanerProfile.isAvailable ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  <p class="text-sm text-gray-700 dark:text-gray-300">
                    {cleaner.cleanerProfile.isAvailable
                      ? "Available for bookings"
                      : "Not available for bookings"}
                  </p>
                </div>
              </div>
            {:else}
              <p class="text-gray-500 dark:text-gray-400 py-4 text-center">
                No profile information available
              </p>
            {/if}
          </div>
        {/if}

        {#if !cleaner.isActive}
          <div class="mt-4 rounded-md bg-amber-50 p-4 dark:bg-amber-900/20">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg
                  class="h-5 w-5 text-amber-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <h3
                  class="text-sm font-medium text-amber-800 dark:text-amber-300"
                >
                  Account Inactive
                </h3>
                <div class="mt-2 text-sm text-amber-700 dark:text-amber-200">
                  <p>This cleaner account is currently inactive.</p>
                </div>
                <div class="mt-4">
                  <form method="POST" action="?/updateActivation" use:enhance>
                    <input type="hidden" name="setActive" value="true" />
                    <Button type="submit" variant="primary" size="sm">
                      Activate Account
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        {:else}
          <div
            class="mt-4 flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center">
              <div class="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></div>
              <p class="text-sm text-gray-700 dark:text-gray-300">
                Account Active
              </p>
            </div>
            <form method="POST" action="?/updateActivation" use:enhance>
              <input type="hidden" name="setActive" value="false" />
              <Button type="submit" variant="outline" size="sm">
                Deactivate Account
              </Button>
            </form>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Right columns -->
  <div class="lg:col-span-2 space-y-6">
    <!-- Specialisations -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Service Specialisations
          </h2>
          <Button
            variant="ghost"
            size="sm"
            on:click={toggleSpecialisationsEdit}
          >
            {#if isSpecialisationsEditMode}
              <X size={16} class="mr-1" />
              Cancel
            {:else}
              <PenTool size={16} class="mr-1" />
              Edit
            {/if}
          </Button>
        </div>

        {#if isSpecialisationsEditMode}
          <form
            method="POST"
            action="?/updateSpecialisations"
            use:enhance={() => {
              isLoading = true;

              return async ({ result, update }) => {
                isLoading = false;

                if (result.type === "success") {
                  isSpecialisationsEditMode = false;
                }

                await update();

                // Then invalidate all data to force a refresh of the page data
                if (result.type === "success") {
                  await invalidateAll();
                }
              };
            }}
          >
            <div class="space-y-4">
              {#each services as service}
                <div
                  class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div class="flex items-start">
                    <input
                      type="checkbox"
                      id={`service-${service.id}`}
                      checked={selectedSpecialisations.get(service.id)
                        ?.selected || false}
                      on:change={() => toggleServiceSelection(service.id)}
                      class="h-4 w-4 mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div class="ml-3 flex-1">
                      <label
                        for={`service-${service.id}`}
                        class="text-gray-900 dark:text-white font-medium"
                      >
                        {service.name}
                      </label>
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        {service.description}
                      </p>

                      {#if selectedSpecialisations.get(service.id)?.selected}
                        <div class="mt-2">
                          <label
                            for={`experience-${service.id}`}
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            Experience (months)
                          </label>
                          <input
                            type="number"
                            id={`experience-${service.id}`}
                            value={selectedSpecialisations.get(service.id)
                              ?.experience || 0}
                            on:input={(e) =>
                              updateServiceExperience(
                                service.id,
                                parseInt(e.target.value),
                              )}
                            min="0"
                            class="w-full sm:w-1/3 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}

              <input
                type="hidden"
                name="specialisations"
                value={getSelectedSpecialisations()}
              />

              <div class="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                  class="w-full"
                >
                  {#if isLoading}
                    <svg
                      class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Saving...
                  {:else}
                    <Save size={16} class="mr-2" />
                    Save Specialisations
                  {/if}
                </Button>
              </div>
            </div>
          </form>
        {:else if cleaner.specialisations && cleaner.specialisations.length > 0}
          <div class="space-y-3">
            {#each cleaner.specialisations as specialisation}
              <div class="flex items-start">
                <Briefcase
                  class="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3"
                />
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {services.find((s) => s.id === specialisation.serviceId)
                      ?.name || "Unknown Service"}
                  </p>

                  {#if specialisation.experience}
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {specialisation.experience} months experience
                    </p>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="py-4 text-center text-gray-500 dark:text-gray-400">
            No specialisations added yet
          </p>
        {/if}
      </div>
    </div>

    <!-- Recent Bookings -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Bookings
          </h2>
          <Button variant="outline" size="sm" on:click={viewAllBookings}>
            View All
          </Button>
        </div>

        {#if bookings && bookings.length > 0}
          <div class="overflow-x-auto">
            <table
              class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
            >
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Customer
                  </th>
                  <th
                    scope="col"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Details
                  </th>
                </tr>
              </thead>
              <tbody
                class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
              >
                {#each bookings as booking}
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td
                      class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                    >
                      {formatDate(booking.scheduledDate)}
                    </td>
                    <td
                      class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                    >
                      {booking.customer?.firstName}
                      {booking.customer?.lastName}
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap">
                      <span
                        class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <a
                        href={`/admin/bookings/${booking.id}`}
                        class="text-primary hover:text-primary-600 hover:underline"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <p class="py-4 text-center text-gray-500 dark:text-gray-400">
            No recent bookings for this cleaner
          </p>
        {/if}
      </div>
    </div>
  </div>
</div>
