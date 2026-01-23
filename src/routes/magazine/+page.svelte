<!-- src/routes/magazine/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import Button from "$lib/components/ui/Button.svelte";
  import { CustomerSkeleton } from "$lib/components/ui/skeletons";
  import { formatDate } from "$lib/utils/markdown";
  import { Calendar, Clock, Filter, MapPin, Search, Tag } from "lucide-svelte";
  import type { PageData } from "./$types";

  export let data: PageData;

  let showFilters = false;
  let searchInput = data.filters.search || "";

  // Category display names
  const categoryNames: Record<string, string> = {
    "small-spaces": "Small Spaces",
    organisation: "Organisation",
    "design-tips": "Design Tips",
    lifestyle: "Lifestyle",
    maintenance: "Maintenance",
    "apartment-living": "Apartment Living",
  };

  // Service area display names
  const areaNames: Record<string, string> = {
    fourways: "Fourways",
    bryanston: "Bryanston",
    randburg: "Randburg",
    midrand: "Midrand",
    "north-riding": "North Riding",
    "cosmo-city": "Cosmo City",
    roodepoort: "Roodepoort",
    diepsloot: "Diepsloot",
    honeydew: "Honeydew",
    "cape-town": "Cape Town",
    johannesburg: "Johannesburg",
  };

  function handleSearch() {
    const params = new URLSearchParams($page.url.searchParams);

    if (searchInput.trim()) {
      params.set("search", searchInput.trim());
    } else {
      params.delete("search");
    }

    // Clear other filters when searching
    params.delete("category");
    params.delete("area");

    goto(`/magazine?${params.toString()}`);
  }

  function handleFilter(type: "category" | "area", value: string) {
    const params = new URLSearchParams($page.url.searchParams);

    if (params.get(type) === value) {
      // Remove filter if clicking same value
      params.delete(type);
    } else {
      params.set(type, value);
    }

    // Clear search when using filters
    params.delete("search");

    goto(`/magazine?${params.toString()}`);
  }

  function clearAllFilters() {
    goto("/magazine");
  }

  function getActiveFiltersCount(): number {
    let count = 0;
    if (data.filters.category) count++;
    if (data.filters.area) count++;
    if (data.filters.search) count++;
    return count;
  }
</script>

<!-- Hero Section -->
<section class="bg-gradient-to-br from-primary to-primary-600 text-white">
  <div class="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
    <div class="text-center">
      <h1 class="text-4xl md:text-6xl font-bold mb-6">BrightBroom Magazine</h1>
      <p class="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
        Transform your space with expert tips on organisation, design, and
        maintenance for South African homes and apartments.
      </p>

      <!-- Search Bar -->
      <div class="max-w-xl mx-auto">
        <div class="flex gap-2">
          <div class="flex-1 relative">
            <Search
              class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search articles..."
              bind:value={searchInput}
              on:keydown={(e) => e.key === "Enter" && handleSearch()}
              class="w-full pl-10 pr-4 py-3 rounded-lg border-0 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary"
            />
          </div>
          <Button variant="secondary" on:click={handleSearch}>Search</Button>
        </div>
      </div>
    </div>
  </div>
</section>

{#await data.streamed.articlesData}
  <!-- Loading skeleton for Featured Articles -->
  {#if !data.filters.category && !data.filters.area && !data.filters.search}
    <section class="py-16 bg-white dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CustomerSkeleton variant="magazineList" />
      </div>
    </section>
  {/if}

  <!-- Loading skeleton for Articles Grid -->
  <section class="py-16 bg-gray-50 dark:bg-gray-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Filter Toggle (shown during loading) -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
          {#if data.filters.search}
            Search Results for "{data.filters.search}"
          {:else if data.filters.category}
            {categoryNames[data.filters.category]} Articles
          {:else if data.filters.area}
            Articles for {areaNames[data.filters.area]}
          {:else}
            All Articles
          {/if}
        </h2>

        <div class="flex items-center gap-4">
          {#if getActiveFiltersCount() > 0}
            <Button variant="outline" size="sm" on:click={clearAllFilters}>
              Clear filters
            </Button>
          {/if}

          <Button
            variant="outline"
            size="sm"
            on:click={() => (showFilters = !showFilters)}
            class="flex items-center gap-2"
          >
            <Filter size={16} />
            Filters
            {#if getActiveFiltersCount() > 0}
              <span class="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {getActiveFiltersCount()}
              </span>
            {/if}
          </Button>
        </div>
      </div>

      <!-- Filter Panel -->
      {#if showFilters}
        <div class="bg-white dark:bg-gray-900 rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <div class="grid gap-6 md:grid-cols-2">
            <!-- Categories -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Tag size={18} />
                Categories
              </h3>
              <div class="flex flex-wrap gap-2">
                {#each data.categories as category}
                  <button
                    type="button"
                    on:click={() => handleFilter("category", category)}
                    class={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      data.filters.category === category
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {categoryNames[category] || category}
                  </button>
                {/each}
              </div>
            </div>

            <!-- Service Areas -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin size={18} />
                Service Areas
              </h3>
              <div class="flex flex-wrap gap-2">
                {#each data.serviceAreas as area}
                  <button
                    type="button"
                    on:click={() => handleFilter("area", area)}
                    class={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      data.filters.area === area
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {areaNames[area] || area}
                  </button>
                {/each}
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Skeleton Grid -->
      <CustomerSkeleton variant="magazineList" />
    </div>
  </section>
{:then articlesData}
  {@const articles = articlesData.articles}
  {@const featuredArticles = articlesData.featuredArticles}

  <!-- Featured Articles (only show if no filters applied) -->
  {#if !data.filters.category && !data.filters.area && !data.filters.search && featuredArticles.length > 0}
    <section class="py-16 bg-white dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Featured Articles
        </h2>

        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {#each featuredArticles as article}
            <article class="group cursor-pointer">
              <a href="/magazine/{article.slug}" class="block">
                <div
                  class="aspect-w-16 aspect-h-9 mb-4 overflow-hidden rounded-lg"
                >
                  <img
                    src={article.featuredImage}
                    alt={article.imageAlt}
                    class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div class="space-y-2">
                  <div
                    class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400"
                  >
                    <span class="flex items-center gap-1">
                      <Calendar size={16} />
                      {formatDate(article.publishedAt)}
                    </span>
                    <span class="flex items-center gap-1">
                      <Clock size={16} />
                      {article.readingTime} min read
                    </span>
                  </div>

                  <h3
                    class="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors"
                  >
                    {article.title}
                  </h3>

                  <p class="text-gray-600 dark:text-gray-300 line-clamp-2">
                    {article.description}
                  </p>

                  <div class="flex items-center justify-between">
                    <span
                      class="inline-block px-3 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full dark:bg-primary-900/20 dark:text-primary-400"
                    >
                      {categoryNames[article.category] || article.category}
                    </span>

                    <span class="text-sm text-gray-500 dark:text-gray-400">
                      by {article.author.name}
                    </span>
                  </div>
                </div>
              </a>
            </article>
          {/each}
        </div>
      </div>
    </section>
  {/if}

  <!-- Filters and Articles Section -->
  <section class="py-16 bg-gray-50 dark:bg-gray-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Filter Toggle and Active Filters -->
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
      >
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
          {#if data.filters.search}
            Search Results for "{data.filters.search}"
          {:else if data.filters.category}
            {categoryNames[data.filters.category]} Articles
          {:else if data.filters.area}
            Articles for {areaNames[data.filters.area]}
          {:else}
            All Articles
          {/if}
          <span
            class="text-base font-normal text-gray-500 dark:text-gray-400 ml-2"
          >
            ({articles.length}
            {articles.length === 1 ? "article" : "articles"})
          </span>
        </h2>

        <div class="flex items-center gap-4">
          {#if getActiveFiltersCount() > 0}
            <Button variant="outline" size="sm" on:click={clearAllFilters}>
              Clear filters
            </Button>
          {/if}

          <Button
            variant="outline"
            size="sm"
            on:click={() => (showFilters = !showFilters)}
            class="flex items-center gap-2"
          >
            <Filter size={16} />
            Filters
            {#if getActiveFiltersCount() > 0}
              <span
                class="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
              >
                {getActiveFiltersCount()}
              </span>
            {/if}
          </Button>
        </div>
      </div>

      <!-- Filter Panel -->
      {#if showFilters}
        <div
          class="bg-white dark:bg-gray-900 rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700"
        >
          <div class="grid gap-6 md:grid-cols-2">
            <!-- Categories -->
            <div>
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"
              >
                <Tag size={18} />
                Categories
              </h3>
              <div class="flex flex-wrap gap-2">
                {#each data.categories as category}
                  <button
                    type="button"
                    on:click={() => handleFilter("category", category)}
                    class={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      data.filters.category === category
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {categoryNames[category] || category}
                  </button>
                {/each}
              </div>
            </div>

            <!-- Service Areas -->
            <div>
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"
              >
                <MapPin size={18} />
                Service Areas
              </h3>
              <div class="flex flex-wrap gap-2">
                {#each data.serviceAreas as area}
                  <button
                    type="button"
                    on:click={() => handleFilter("area", area)}
                    class={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      data.filters.area === area
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {areaNames[area] || area}
                  </button>
                {/each}
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Articles Grid -->
      {#if articles.length > 0}
        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {#each articles as article}
            <article
              class="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden group hover:shadow-lg transition-shadow"
            >
              <a href="/magazine/{article.slug}">
                <div class="aspect-w-16 aspect-h-9 overflow-hidden">
                  <img
                    src={article.featuredImage}
                    alt={article.imageAlt}
                    class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div class="p-6 space-y-4">
                  <div
                    class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400"
                  >
                    <span class="flex items-center gap-1">
                      <Calendar size={16} />
                      {formatDate(article.publishedAt)}
                    </span>
                    <span class="flex items-center gap-1">
                      <Clock size={16} />
                      {article.readingTime} min read
                    </span>
                  </div>

                  <h3
                    class="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2"
                  >
                    {article.title}
                  </h3>

                  <p class="text-gray-600 dark:text-gray-300 line-clamp-3">
                    {article.description}
                  </p>

                  <div
                    class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        class="inline-block px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded dark:bg-primary-900/20 dark:text-primary-400"
                      >
                        {categoryNames[article.category] || article.category}
                      </span>

                      {#if article.serviceAreas.length > 0}
                        <span
                          class="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded dark:bg-gray-700 dark:text-gray-400"
                        >
                          <MapPin size={12} class="inline mr-1" />
                          {areaNames[article.serviceAreas[0]] ||
                            article.serviceAreas[0]}
                          {#if article.serviceAreas.length > 1}
                            +{article.serviceAreas.length - 1}
                          {/if}
                        </span>
                      {/if}
                    </div>

                    <span class="text-sm text-gray-500 dark:text-gray-400">
                      by {article.author.name}
                    </span>
                  </div>
                </div>
              </a>
            </article>
          {/each}
        </div>
      {:else}
        <!-- No articles found -->
        <div class="text-center py-16">
          <div class="text-gray-400 dark:text-gray-600 mb-4">
            <Search size={64} class="mx-auto" />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No articles found
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            {#if data.filters.search}
              No articles match your search term "{data.filters.search}".
            {:else}
              No articles found with the current filters.
            {/if}
          </p>
          <Button variant="primary" on:click={clearAllFilters}>
            View all articles
          </Button>
        </div>
      {/if}
    </div>
  </section>
{:catch error}
  <section class="py-16 bg-gray-50 dark:bg-gray-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center py-16">
        <div class="text-red-400 dark:text-red-600 mb-4">
          <Search size={64} class="mx-auto" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Failed to load articles
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Something went wrong while loading the articles. Please try again later.
        </p>
        <Button variant="primary" on:click={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    </div>
  </section>
{/await}
