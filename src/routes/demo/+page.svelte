<!-- src/routes/demo/+page.svelte -->
<!--
  brightbroom.com only (404 on a company's site): the home page a cleaning
  company's customers see, as a live demo. Its booking buttons lead into the
  real booking flow (test payments in demo mode).
-->
<script lang="ts">
  import { brand } from "$lib/config/brand";
  import CustomerHome from "$lib/components/home/CustomerHome.svelte";
  import DemoNotice from "$lib/components/marketing/DemoNotice.svelte";
  import type { PageData } from "./$types";

  export let data: PageData;
</script>

<svelte:head>
  <title>Live demo: your customers' home page | {brand.name}</title>
  <meta
    name="description"
    content="Live demo of the booking website {brand.name} gives a cleaning company: the home page its customers see, under the company's own name."
  />
  <meta property="og:title" content="Live demo: your customers' home page | {brand.name}" />
  <meta
    property="og:description"
    content="See the home page {brand.name} gives a cleaning company's customers: book a clean, see the price and pay online, all under the company's own name."
  />
  <meta property="og:type" content="website" />
  <!-- A demo of a client's page: not one to index -->
  <meta name="robots" content="noindex" />
</svelte:head>

<DemoNotice what="home page" />

<CustomerHome bookingsPaused={data.bookingsPaused} user={data.user} />
