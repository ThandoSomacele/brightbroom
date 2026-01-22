<!-- src/lib/components/admin/ApplicationEditForm.svelte -->

<script lang="ts">
  import DocumentUpload from "$lib/components/admin/DocumentUpload.svelte";
  import ProfileImageUpload from "$lib/components/admin/ProfileImageUpload.svelte";
  import GoogleMapsAutocomplete from "$lib/components/maps/GoogleMapsAutocomplete.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import { isWithinServiceArea } from "$lib/utils/serviceAreaValidator";

  import { createEventDispatcher } from "svelte";

  // Props
  export let application: any;
  export let isEditing = false;
  export let isProcessing = false;

  // Create a copy of the application for editing
  let editableApplication = isEditing ? { ...application } : null;
  let addressError = "";
  let isOutOfServiceArea = false;

  // Google Maps API key
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Create event dispatcher
  const dispatch = createEventDispatcher<{
    save: { updatedApplication: any };
    cancel: void;
  }>();

  // Handle address selection
  function handleAddressSelect(event: CustomEvent) {
    const address = event.detail.address;

    // Update editable application with new address
    editableApplication.street = address.street;
    editableApplication.city = address.city;
    editableApplication.state = address.state;
    editableApplication.zipCode = address.zipCode;
    editableApplication.latitude = address.lat;
    editableApplication.longitude = address.lng;
    editableApplication.formattedAddress = address.formatted;

    // Check if address is within service area
    if (address.lat && address.lng) {
      isOutOfServiceArea = !isWithinServiceArea(address.lat, address.lng);

      if (isOutOfServiceArea) {
        addressError = "This address is outside our current service areas.";
      } else {
        addressError = "";
      }
    }
  }

  // Parse availability from JSON string to array
  let availabilityDays: string[] = [];
  try {
    if (editableApplication?.availability) {
      // Parse the JSON and normalize case
      const parsedDays = JSON.parse(editableApplication.availability);
      // Convert each day to uppercase to match the expected format
      availabilityDays = parsedDays.map((day) => day.toUpperCase());
    }
  } catch (e) {
    console.error("Error parsing availability:", e);
    availabilityDays = [];
  }

  // Then in your handleSave function, make sure to stringify it back
  function handleSave() {
    // Update availability
    editableApplication.availability = JSON.stringify(availabilityDays);

    dispatch("save", { updatedApplication: editableApplication });
  }

  // Handle cancel
  function handleCancel() {
    dispatch("cancel");
  }

  // handle successful image upload
  function handleImageUploadSuccess(event: CustomEvent) {
    // Update the application's profileImageUrl
    editableApplication.profileImageUrl = event.detail.url;
  }

  // handle image upload errors
  function handleImageUploadError(event: CustomEvent) {
    // Display the error message
    // You could add this to a state variable for display
    console.error("Image upload error:", event.detail.message);
  }

  // document handling functions
  function handleDocumentsUpdate(event: CustomEvent) {
    editableApplication.documents = event.detail.documents;
  }

  function handleDocumentsError(event: CustomEvent) {
    console.error("Document upload/delete error:", event.detail.message);
    // You could show this in the UI as well
  }
</script>

<div class="space-y-6">
  {#if isEditing && editableApplication}
    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-4">
      <p class="text-blue-700 dark:text-blue-300 text-sm">
        You are editing this application. Make your changes and click Save to
        update.
      </p>
    </div>

    <div class="grid gap-6 md:grid-cols-2">
      <!-- Personal Information -->
      <div class="space-y-4">
        <div class="mb-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Profile Image
          </h3>

          <ProfileImageUpload
            userId={application.id}
            userType="applicant"
            currentImageUrl={editableApplication.profileImageUrl}
            on:success={handleImageUploadSuccess}
            on:error={handleImageUploadError}
          />
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Personal Information
        </h3>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            First Name
          </label>
          <input
            type="text"
            bind:value={editableApplication.firstName}
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Last Name
          </label>
          <input
            type="text"
            bind:value={editableApplication.lastName}
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Email
          </label>
          <input
            type="email"
            bind:value={editableApplication.email}
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Phone Number
          </label>
          <input
            type="tel"
            bind:value={editableApplication.phone}
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <!-- Location & Work Information -->
      <div class="space-y-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Location & Work Information
        </h3>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Address
          </label>

          <GoogleMapsAutocomplete
            apiKey={googleMapsApiKey}
            value={editableApplication.formattedAddress}
            error={addressError}
            on:select={handleAddressSelect}
          />

          {#if isOutOfServiceArea}
            <p class="mt-1 text-sm text-amber-600 dark:text-amber-400">
              This address is outside our service areas, but can still be
              approved.
            </p>
          {/if}
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            ID Type
          </label>
          <select
            bind:value={editableApplication.idType}
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="SOUTH_AFRICAN_ID">South African ID</option>
            <option value="PASSPORT">Passport</option>
          </select>
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            ID Number
          </label>
          <input
            type="text"
            bind:value={editableApplication.idNumber}
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>
    </div>

    <!-- Documents Status -->
    <div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Documents Status
      </h3>

      <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
        <label class="flex items-center cursor-pointer">
          <input
            type="checkbox"
            bind:checked={editableApplication.documentsPending}
            class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span class="ml-2 text-gray-700 dark:text-gray-300">
            Documents Pending
          </span>
        </label>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Check this if the applicant still needs to submit required documents.
        </p>
      </div>
    </div>

    <!-- Availability -->
    <div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Availability
      </h3>

      <div class="space-y-2 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
        {#each ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as day}
          <label class="flex items-center">
            <input
              type="checkbox"
              value={day}
              bind:group={availabilityDays}
              class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span class="ml-2 text-gray-700 dark:text-gray-300">
              {day.charAt(0) + day.slice(1).toLowerCase()}
            </span>
          </label>
        {/each}
      </div>
    </div>

    <!-- Additional Info -->
    <div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Additional Information
      </h3>
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Work Radius (km)
        </label>
        <input
          type="number"
          bind:value={editableApplication.workRadius}
          min="5"
          max="50"
          class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          How far the cleaner is willing to travel for jobs (in kilometers).
        </p>
      </div>

      <!-- Add this within the "Additional Info" section -->
      <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Tax Number (Optional)
          </label>
          <input
            type="text"
            bind:value={editableApplication.taxNumber}
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Enter tax number if available"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Tax number for payment processing
          </p>
        </div>

        <div class="mt-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Supporting Documents
          </h3>

          <DocumentUpload
            applicationId={application.id}
            documents={editableApplication.documents || []}
            on:success={handleDocumentsUpdate}
            on:error={handleDocumentsError}
          />
        </div>

      </div>

      <!-- Bank Details Section -->
      <div class="mt-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Bank Details
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              for="bankName"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Bank Name
            </label>
            <select
              id="bankName"
              bind:value={editableApplication.bankName}
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select bank...</option>
              <option value="ABSA">ABSA</option>
              <option value="Capitec">Capitec</option>
              <option value="FNB">First National Bank (FNB)</option>
              <option value="Nedbank">Nedbank</option>
              <option value="Standard Bank">Standard Bank</option>
              <option value="African Bank">African Bank</option>
              <option value="Investec">Investec</option>
              <option value="TymeBank">TymeBank</option>
              <option value="Discovery Bank">Discovery Bank</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label
              for="bankAccountType"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Account Type
            </label>
            <select
              id="bankAccountType"
              bind:value={editableApplication.bankAccountType}
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select type...</option>
              <option value="SAVINGS">Savings</option>
              <option value="CHEQUE">Cheque/Current</option>
              <option value="TRANSMISSION">Transmission</option>
            </select>
          </div>

          <div>
            <label
              for="bankAccountNumber"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Account Number
            </label>
            <input
              type="text"
              id="bankAccountNumber"
              bind:value={editableApplication.bankAccountNumber}
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Enter account number"
            />
          </div>

          <div>
            <label
              for="bankBranchCode"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Branch Code
            </label>
            <input
              type="text"
              id="bankBranchCode"
              bind:value={editableApplication.bankBranchCode}
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="6-digit branch code"
              maxlength="6"
            />
          </div>

          <div class="md:col-span-2">
            <label
              for="bankAccountHolder"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Account Holder Name
            </label>
            <input
              type="text"
              id="bankAccountHolder"
              bind:value={editableApplication.bankAccountHolder}
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Name as it appears on bank account"
            />
          </div>
        </div>
      </div>

      <div class="mt-4">
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Notes
        </label>
        <textarea
          bind:value={editableApplication.notes}
          rows="3"
          class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="Admin notes about this application..."
        ></textarea>
      </div>
    </div>

    <!-- Action Buttons -->
    <div
      class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700"
    >
      <Button variant="outline" on:click={handleCancel} disabled={isProcessing}>
        Cancel
      </Button>

      <Button variant="primary" on:click={handleSave} disabled={isProcessing}>
        {#if isProcessing}
          <div
            class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
          ></div>
          Saving...
        {:else}
          Save Changes
        {/if}
      </Button>
    </div>
  {/if}
</div>
