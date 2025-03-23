<!-- src/routes/admin/cleaners/[id]/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import Button from "$lib/components/ui/Button.svelte";
  import {
    Briefcase,
    Calendar,
    ChevronLeft,
    Mail,
    MapPin,
    PenTool,
    Phone,
    Save,
    Star,
    User,
    X,
  } from "lucide-svelte";

  export let data;
  export let form;

  const { cleaner, services, bookings } = data;

  // Mode tracking
  let isPersonalInfoEditMode = false;
  let isProfileEditMode = false;
  let isSpecializationsEditMode = false;
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

  // Initialize availableDays if data exists
  if (cleaner.cleanerProfile?.availableDays) {
    cleaner.cleanerProfile.availableDays.forEach((day) => {
      availableDays[day] = true;
    });
  }

  // Track specializations
  let selectedSpecializations = new Map();

  // Initialize selected specializations
  if (cleaner.specializations) {
    cleaner.specializations.forEach((spec) => {
      selectedSpecializations.set(spec.serviceId, {
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

  // Toggle profile edit mode
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

  // Toggle specializations edit mode
  function toggleSpecializationsEdit() {
    isSpecializationsEditMode = !isSpecializationsEditMode;

    if (isSpecializationsEditMode) {
      // Reset selected specializations
      selectedSpecializations = new Map();

      // Set from cleaner data
      if (cleaner.specializations) {
        cleaner.specializations.forEach((spec) => {
          selectedSpecializations.set(spec.serviceId, {
            selected: true,
            experience: spec.experience || 0,
          });
        });
      }

      // Initialize missing services
      services.forEach((service) => {
        if (!selectedSpecializations.has(service.id)) {
          selectedSpecializations.set(service.id, {
            selected: false,
            experience: 0,
          });
        }
      });
    }
  }

  // Toggle service selection
  function toggleServiceSelection(serviceId: string) {
    if (selectedSpecializations.has(serviceId)) {
      const currentValue = selectedSpecializations.get(serviceId);
      selectedSpecializations.set(serviceId, {
        ...currentValue,
        selected: !currentValue.selected,
      });
    }
  }

  // Update service experience
  function updateServiceExperience(serviceId: string, months: number) {
    if (selectedSpecializations.has(serviceId)) {
      const currentValue = selectedSpecializations.get(serviceId);
      selectedSpecializations.set(serviceId, {
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

  // Get selected specializations for form submission
  function getSelectedSpecializations() {
    const result = [];
    selectedSpecializations.forEach((value, serviceId) => {
      if (value.selected) {
        result.push({
          serviceId,
          experience: parseInt(value.experience.toString()) || 0,
        });
      }
    });
    return JSON.stringify(result);
  }

  // Navigate to all cleaner bookings
  function viewAllBookings() {
    window.location.href = `/admin/bookings?search=${cleaner.email}`;
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

                await update();
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
              };
            }}
          >
            <div class="space-y-4">
              <!-- Work Address -->
              <div>
                <label
                  for="workAddress"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Work Address
                </label>
                <input
                  type="text"
                  id="workAddress"
                  name="workAddress"
                  bind:value={workAddress}
                  required
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
          <div class="space-y-4">
            {#if cleaner.cleanerProfile}
              {#if cleaner.cleanerProfile.rating}
                <div class="flex items-center">
                  <Star class="h-5 w-5 text-yellow-500 mr-2" />
                  <div>
                    <p
                      class="text-sm font-medium text-gray-500 dark:text-gray-400"
                    >
                      Rating
                    </p>
                    <p class="text-gray-900 dark:text-white">
                      {cleaner.cleanerProfile.rating} / 5
                    </p>
                  </div>
                </div>
              {/if}

              {#if cleaner.cleanerProfile.workAddress}
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
      </div>
    </div>
  </div>

  <!-- Right columns -->
  <div class="lg:col-span-2 space-y-6">
    <!-- Specializations -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Service Specializations
          </h2>
          <Button
            variant="ghost"
            size="sm"
            on:click={toggleSpecializationsEdit}
          >
            {#if isSpecializationsEditMode}
              <X size={16} class="mr-1" />
              Cancel
            {:else}
              <PenTool size={16} class="mr-1" />
              Edit
            {/if}
          </Button>
        </div>

        {#if isSpecializationsEditMode}
          <form
            method="POST"
            action="?/updateSpecializations"
            use:enhance={() => {
              isLoading = true;

              return async ({ result, update }) => {
                isLoading = false;

                if (result.type === "success") {
                  isSpecializationsEditMode = false;
                }

                await update();
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
                      checked={selectedSpecializations.get(service.id)
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

                      {#if selectedSpecializations.get(service.id)?.selected}
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
                            value={selectedSpecializations.get(service.id)
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
                name="specializations"
                value={getSelectedSpecializations()}
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
                    Save Specializations
                  {/if}
                </Button>
              </div>
            </div>
          </form>
        {:else if cleaner.specializations && cleaner.specializations.length > 0}
          <div class="space-y-3">
            {#each cleaner.specializations as specialization}
              <div class="flex items-start">
                <Briefcase
                  class="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3"
                />
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {services.find((s) => s.id === specialization.serviceId)
                      ?.name || "Unknown Service"}
                  </p>

                  {#if specialization.experience}
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {specialization.experience} months experience
                    </p>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="py-4 text-center text-gray-500 dark:text-gray-400">
            No specializations added yet
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
