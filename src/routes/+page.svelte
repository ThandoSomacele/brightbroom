<!-- src/routes/+page.svelte -->
<!--
  A cleaning company's site: its customer home page. brightbroom.com: the page
  for cleaning companies, with the customer home kept as the live demo (/demo).
-->
<script lang="ts">
  import { absoluteSiteUrl, brand, isSingleCompany } from "$lib/config/brand";
  import CustomerHome from "$lib/components/home/CustomerHome.svelte";
  import PlatformHome from "$lib/components/home/PlatformHome.svelte";
  import JsonLd from "$lib/components/seo/JsonLd.svelte";
  import { localBusinessJsonLd, platformJsonLd } from "$lib/seo/structured-data";
  import type { PageData } from "./$types";

  // Root layout data (user, bookingsPaused)
  export let data: PageData;

  const ogImageUrl = absoluteSiteUrl(brand.ogImageUrl);
  const title = isSingleCompany
    ? `${brand.name} | ${brand.tagline}`
    : `${brand.name} | Booking software for cleaning companies`;
  const description = isSingleCompany
    ? `${brand.tagline}. Book professional cleaning services online in minutes and get your space sparkling clean.`
    : `Give your cleaning company its own booking website: online bookings with instant prices, PayFast payments into your own account, recurring cleans and a cleaner portal, under your name. From R1,500 a month.`;
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />

  <!-- Open Graph / Facebook (og:url and the canonical come from the root layout) -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={ogImageUrl} />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={ogImageUrl} />
</svelte:head>

{#if isSingleCompany}
  <JsonLd data={localBusinessJsonLd(description)} />
  <CustomerHome bookingsPaused={data.bookingsPaused} user={data.user} />
{:else}
  <JsonLd data={platformJsonLd(description)} />
  <PlatformHome />
{/if}
