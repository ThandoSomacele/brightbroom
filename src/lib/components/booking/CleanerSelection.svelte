<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { fade, slide } from "svelte/transition";

  export let selectedCleanerId: string | null = null;
  export let serviceId: string | null = null;
  export let address: { lat?: number; lng?: number } | null = null;
  export let scheduledDate: string | null = null;

  const dispatch = createEventDispatcher();

  type Cleaner = {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    bio: string;
    rating: number | null;
    profileImageUrl: string;
    petCompatibility: string;
    experienceTypes: string[];
    distance: number | null;
  };

  let cleaners: Cleaner[] = [];
  let loading = true;
  let error = "";
  let selectedCleaner: Cleaner | null = null;
  let showProfile: string | null = null;

  onMount(async () => {
    await fetchAvailableCleaners();
  });

  async function fetchAvailableCleaners() {
    try {
      loading = true;
      error = "";

      const params = new URLSearchParams();
      if (address?.lat) params.append("lat", address.lat.toString());
      if (address?.lng) params.append("lng", address.lng.toString());
      if (scheduledDate) params.append("date", scheduledDate);
      if (serviceId) params.append("serviceId", serviceId);

      const response = await fetch(`/api/cleaners/available?${params}`);
      const data = await response.json();

      if (data.success) {
        cleaners = data.cleaners;
        // Don't use placeholder data - show actual availability
      } else {
        error = "Unable to fetch available cleaners. Please try again.";
        cleaners = [];
      }
    } catch (err) {
      console.error("Error fetching cleaners:", err);
      error = "Unable to fetch available cleaners. Please try again.";
      cleaners = [];
    } finally {
      loading = false;
    }
  }

  function selectCleaner(cleaner: Cleaner) {
    selectedCleaner = cleaner;
    selectedCleanerId = cleaner.id;
    dispatch("select", { cleanerId: cleaner.id, cleaner });
  }

  function toggleProfile(cleanerId: string) {
    showProfile = showProfile === cleanerId ? null : cleanerId;
  }

  function getRatingStars(rating: number | null): string {
    if (!rating) return "☆☆☆☆☆";
    const roundedRating = Math.round(rating);
    const fullStars = roundedRating;
    const emptyStars = 5 - fullStars;
    return "★".repeat(fullStars) + "☆".repeat(emptyStars);
  }

  function getPetIcon(compatibility: string): string {
    switch (compatibility) {
      case "DOGS":
        return "🐕";
      case "CATS":
        return "🐈";
      case "BOTH":
        return "🐕 🐈";
      default:
        return "";
    }
  }
</script>

<div class="cleaner-selection">
  <h2 class="text-2xl font-bold mb-2">Choose Your Preferred Cleaner</h2>
  <p class="text-gray-600 mb-6">
    Select your preference - we'll do our best to match you with this cleaner.
  </p>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
      ></div>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
      {error}
    </div>
  {:else if cleaners.length === 0}
    <div
      class="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-lg"
    >
      <h3 class="font-semibold mb-2">No Cleaners Available</h3>
      <p>
        We don't have any cleaners available for your selected date and location
        at the moment. Don't worry - if you continue with your booking, we'll
        automatically assign the best available cleaner once one becomes
        available.
      </p>
    </div>
  {:else}
    <div class="grid gap-6 md:grid-cols-3">
      {#each cleaners as cleaner (cleaner.id)}
        <div
          class="cleaner-card border-2 rounded-lg p-4 cursor-pointer transition-all {selectedCleaner?.id ===
          cleaner.id
            ? 'border-primary bg-primary/5'
            : 'border-gray-200 hover:border-gray-300'}"
          on:click={() => selectCleaner(cleaner)}
          on:keydown={(e) => e.key === "Enter" && selectCleaner(cleaner)}
          role="button"
          tabindex="0"
        >
          <div class="flex flex-col items-center">
            <div class="relative mb-3">
              <img
                src={cleaner.profileImageUrl}
                alt={cleaner.name}
                class="w-24 h-24 rounded-full object-cover border-2 {selectedCleaner?.id ===
                cleaner.id
                  ? 'border-primary'
                  : 'border-gray-200'}"
                on:error={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.src = "/images/default-avatar.svg";
                }}
              />
              {#if selectedCleaner?.id === cleaner.id}
                <div
                  class="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1"
                  transition:fade
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
              {/if}
            </div>

            <h3 class="font-semibold text-lg mb-1">{cleaner.name}</h3>

            {#if cleaner.rating}
              <div class="flex items-center gap-1 mb-2">
                <span class="text-yellow-500"
                  >{getRatingStars(cleaner.rating)}</span
                >
                <span class="text-sm text-gray-600">({cleaner.rating})</span>
              </div>
            {/if}

            <div class="flex items-center gap-3 mb-3 text-sm">
              {#if cleaner.petCompatibility !== "NONE"}
                <span title="Pet friendly" class="text-2xl"
                  >{getPetIcon(cleaner.petCompatibility)}</span
                >
              {/if}
              {#if cleaner.distance}
                <span class="text-gray-600">📍 {cleaner.distance} km</span>
              {/if}
            </div>

            <p class="text-sm text-gray-600 mb-3 text-center line-clamp-2">
              {cleaner.bio}
            </p>

            <button
              type="button"
              class="text-primary hover:text-primary/80 text-sm font-medium"
              on:click|stopPropagation={() => toggleProfile(cleaner.id)}
            >
              {showProfile === cleaner.id ? "Hide" : "View"} Profile
            </button>

            {#if showProfile === cleaner.id}
              <div
                class="mt-3 pt-3 border-t border-gray-200 w-full"
                transition:slide
              >
                <div class="text-sm space-y-2">
                  <div>
                    <span class="font-medium">Experience:</span>
                    <ul class="mt-1 text-gray-600">
                      {#each cleaner.experienceTypes as type}
                        <li class="pl-2">• {type}</li>
                      {/each}
                    </ul>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .cleaner-card {
    transition: all 0.2s ease;
  }

  .cleaner-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  }
</style>
