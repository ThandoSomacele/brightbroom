<!-- src/routes/magazine/[slug]/+page.svelte -->
<script lang="ts">
  import { page } from "$app/stores";
  import Button from "$lib/components/ui/Button.svelte";
  import { formatDate, renderMarkdown } from "$lib/utils/markdown";
  import {
    ArrowLeft,
    Calendar,
    Clock,
    Facebook,
    Linkedin,
    MapPin,
    Share2,
    Tag,
    Twitter,
  } from "lucide-svelte";
  import type { PageData } from "./$types";

  export let data: PageData;

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

  $: article = data.article;
  $: relatedArticles = data.relatedArticles;
  $: articleContent = renderMarkdown(article.content);

  let showShareMenu = false;

  function shareOnSocial(platform: string) {
    const url = $page.url.href;
    const title = article.frontmatter.title;

    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }

    showShareMenu = false;
  }

  function copyToClipboard() {
    navigator.clipboard.writeText($page.url.href);
    showShareMenu = false;
    // You could add a toast notification here
  }
</script>

<svelte:head>
  <title>{data.meta.title}</title>
  <meta name="description" content={data.meta.description} />
  {#if data.meta.keywords}
    <meta name="keywords" content={data.meta.keywords.join(", ")} />
  {/if}
  <link rel="canonical" href={data.meta.url} />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article" />
  <meta property="og:url" content={data.meta.url} />
  <meta property="og:title" content={data.meta.title} />
  <meta property="og:description" content={data.meta.description} />
  <meta property="og:image" content={data.meta.ogImage} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content={article.frontmatter.imageAlt} />
  <meta property="og:site_name" content="BrightBroom" />
  <meta property="og:locale" content="en_ZA" />

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content={data.meta.url} />
  <meta property="twitter:title" content={data.meta.title} />
  <meta property="twitter:description" content={data.meta.description} />
  <meta property="twitter:image" content={data.meta.ogImage} />
  <meta property="twitter:image:alt" content={article.frontmatter.imageAlt} />
  <meta property="twitter:site" content="@BrightBroom" />

  <!-- Article metadata -->
  <meta
    property="article:published_time"
    content={article.frontmatter.publishedAt}
  />
  {#if article.frontmatter.updatedAt}
    <meta
      property="article:modified_time"
      content={article.frontmatter.updatedAt}
    />
  {/if}
  <meta property="article:author" content={article.frontmatter.author.name} />
  <meta
    property="article:section"
    content={categoryNames[article.frontmatter.category]}
  />
  {#each article.frontmatter.tags as tag}
    <meta property="article:tag" content={tag} />
  {/each}
</svelte:head>

<!-- Back to Magazine Button -->
<div
  class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
>
  <div class="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
    <Button variant="outline" href="/magazine" class="flex items-center gap-2">
      <ArrowLeft size={16} />
      Back to Magazine
    </Button>
  </div>
</div>

<!-- Article Header -->
<article class="bg-white dark:bg-gray-900">
  <header class="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
    <!-- Article Meta Information -->
    <div
      class="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6"
    >
      <span class="flex items-center gap-1">
        <Calendar size={16} />
        {formatDate(article.frontmatter.publishedAt)}
      </span>
      <span class="flex items-center gap-1">
        <Clock size={16} />
        {article.frontmatter.readingTime} min read
      </span>
      <span
        class="inline-block px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded dark:bg-primary-900/20 dark:text-primary-400"
      >
        {categoryNames[article.frontmatter.category] ||
          article.frontmatter.category}
      </span>
    </div>

    <!-- Article Title -->
    <h1
      class="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight"
    >
      {article.frontmatter.title}
    </h1>

    <!-- Article Description -->
    <p class="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
      {article.frontmatter.description}
    </p>

    <!-- Tags and Service Areas -->
    <div class="flex flex-wrap gap-2 mb-8">
      {#each article.frontmatter.tags as tag}
        <span
          class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded dark:bg-gray-700 dark:text-gray-400"
        >
          <Tag size={12} />
          {tag}
        </span>
      {/each}

      {#each article.frontmatter.serviceAreas as area}
        <span
          class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-secondary-100 text-secondary-800 rounded dark:bg-secondary-900/20 dark:text-secondary-400"
        >
          <MapPin size={12} />
          {areaNames[area] || area}
        </span>
      {/each}
    </div>

    <!-- Share and Author Info -->
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6 border-t border-b border-gray-200 dark:border-gray-700"
    >
      <!-- Author Info -->
      <div class="flex items-center gap-3 mb-4 sm:mb-0">
        {#if article.frontmatter.author.avatar}
          <img
            src={article.frontmatter.author.avatar}
            alt={article.frontmatter.author.name}
            class="w-10 h-10 rounded-full object-cover"
          />
        {:else}
          <div
            class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold"
          >
            {article.frontmatter.author.name.charAt(0).toUpperCase()}
          </div>
        {/if}

        <div>
          <p class="font-semibold text-gray-900 dark:text-white">
            {article.frontmatter.author.name}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {article.frontmatter.author.bio}
          </p>
        </div>
      </div>

      <!-- Share Button -->
      <div class="relative">
        <Button
          variant="outline"
          size="sm"
          on:click={() => (showShareMenu = !showShareMenu)}
          class="flex items-center gap-2"
        >
          <Share2 size={16} />
          Share
        </Button>

        {#if showShareMenu}
          <div
            class="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10"
          >
            <div class="py-2">
              <button
                type="button"
                on:click={() => shareOnSocial("facebook")}
                class="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Facebook size={16} class="text-blue-600" />
                Facebook
              </button>
              <button
                type="button"
                on:click={() => shareOnSocial("twitter")}
                class="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Twitter size={16} class="text-blue-400" />
                Twitter
              </button>
              <button
                type="button"
                on:click={() => shareOnSocial("linkedin")}
                class="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Linkedin size={16} class="text-blue-700" />
                LinkedIn
              </button>
              <hr class="my-2 border-gray-200 dark:border-gray-700" />
              <button
                type="button"
                on:click={copyToClipboard}
                class="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Share2 size={16} />
                Copy link
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </header>

  <!-- Featured Image -->
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden mb-8">
      <img
        src={article.frontmatter.featuredImage}
        alt={article.frontmatter.imageAlt}
        class="w-full h-96 object-cover"
      />
    </div>
  </div>

  <!-- Article Content -->
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="prose prose-lg prose-gray dark:prose-invert max-w-none">
      {@html articleContent}
    </div>

    <!-- Inline CTAs (these would be embedded in the content, but we'll add them here for demo) -->
    {#each article.frontmatter.ctas.filter((cta) => cta.position === "inline") as cta}
      <div
        class="my-8 p-6 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800"
      >
        <div class="text-center">
          <Button
            variant={cta.type === "primary" ? "primary" : "secondary"}
            href={cta.href}
            size="lg"
          >
            {cta.text}
          </Button>
        </div>
      </div>
    {/each}

    <!-- End of Article CTAs -->
    {#each article.frontmatter.ctas.filter((cta) => cta.position === "end") as cta}
      <div
        class="mt-12 p-8 bg-gradient-to-r from-primary to-primary-600 rounded-lg text-white text-center"
      >
        <h3 class="text-2xl font-bold mb-4">Ready to transform your space?</h3>
        <p class="text-primary-100 mb-6">
          Let BrightBroom's professional cleaners help you maintain your
          beautifully organised home.
        </p>
        <Button variant="secondary" href={cta.href} size="lg">
          {cta.text}
        </Button>
      </div>
    {/each}
  </div>

  <!-- Related Articles -->
  {#if relatedArticles.length > 0}
    <section
      class="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-gray-700 mt-16"
    >
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-8">
        Related Articles
      </h2>

      <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {#each relatedArticles as relatedArticle}
          <article class="group">
            <a href="/magazine/{relatedArticle.slug}" class="block">
              <div
                class="aspect-w-16 aspect-h-9 mb-4 overflow-hidden rounded-lg"
              >
                <img
                  src={relatedArticle.featuredImage}
                  alt={relatedArticle.imageAlt}
                  class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div class="space-y-2">
                <div
                  class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400"
                >
                  <span class="flex items-center gap-1">
                    <Calendar size={16} />
                    {formatDate(relatedArticle.publishedAt)}
                  </span>
                  <span class="flex items-center gap-1">
                    <Clock size={16} />
                    {relatedArticle.readingTime} min read
                  </span>
                </div>

                <h3
                  class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2"
                >
                  {relatedArticle.title}
                </h3>

                <p
                  class="text-gray-600 dark:text-gray-300 line-clamp-2 text-sm"
                >
                  {relatedArticle.description}
                </p>

                <span
                  class="inline-block px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded dark:bg-primary-900/20 dark:text-primary-400"
                >
                  {categoryNames[relatedArticle.category] ||
                    relatedArticle.category}
                </span>
              </div>
            </a>
          </article>
        {/each}
      </div>
    </section>
  {/if}
</article>

<!-- Click outside to close share menu -->
{#if showShareMenu}
  <div
    class="fixed inset-0 z-0"
    on:click={() => (showShareMenu = false)}
    role="button"
    tabindex="-1"
    on:keydown={(e) => e.key === "Escape" && (showShareMenu = false)}
  ></div>
{/if}
