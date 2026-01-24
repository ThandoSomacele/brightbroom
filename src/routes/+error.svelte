<!-- src/routes/+error.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Forbidden403 from '$lib/components/errors/Forbidden403.svelte';
  import { AlertTriangle, Home, RefreshCw, Mail, Calendar } from 'lucide-svelte';
  
  // Get error information from the page store
  $: status = $page.status;
  $: message = $page.error?.message || 'Something went wrong';
  
  // Determine error type
  $: is404 = status === 404;
  $: is403 = status === 403;

  // Helpful pages for navigation
  const helpfulPages = [
    { title: 'Book Cleaning', href: '/book', description: 'Schedule your cleaning service', icon: Calendar },
    { title: 'Our Services', href: '/services', description: 'View all cleaning services' },
    { title: 'Contact Us', href: '/contact', description: 'Get help from our team', icon: Mail },
    { title: 'Join as Cleaner', href: '/join/cleaner', description: 'Start earning with us' },
  ];

  function refresh() {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  onMount(() => {
    // Track 404 errors for analytics if needed
    if (is404 && typeof window !== 'undefined') {
      console.log('404 error tracked:', $page.url.pathname);
    }
  });
</script>

<svelte:head>
  <title>
    {is404 ? '404 - Page Not Found' : `${status} - Error`} | BrightBroom
  </title>
  <meta 
    name="description" 
    content={is404 
      ? 'The page you\'re looking for couldn\'t be found. Browse our cleaning services or contact us for assistance.'
      : 'We encountered an error while processing your request. Please try again or contact support.'
    } 
  />
  <meta name="robots" content="noindex, nofollow" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="{is404 ? '404 - Page Not Found' : `${status} - Error`} | BrightBroom" />
  <meta property="og:description" content={is404 
    ? 'The page you\'re looking for couldn\'t be found. Browse our cleaning services in South Africa.'
    : 'We encountered an error. Please try again or contact our support team.'
  } />
  <meta property="og:image" content="https://brightbroom.com/images/og-default.jpg" />
  <meta property="og:url" content="https://brightbroom.com{$page.url.pathname}" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{is404 ? '404 - Page Not Found' : `${status} - Error`} | BrightBroom" />
  <meta property="twitter:description" content={is404 
    ? 'Page not found - Browse our cleaning services in South Africa.'
    : 'We encountered an error. Please try again or contact support.'
  } />
  <meta name="twitter:image" content="https://brightbroom.com/images/og-default.jpg" />
  
  <!-- Canonical URL to home page -->
  <link rel="canonical" href="https://brightbroom.com/" />
</svelte:head>

{#if is403}
  <Forbidden403 />
{:else}
  <div class="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
    <!-- Main error content -->
    <main class="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div class="text-center">
        <!-- Error illustration/icon -->
        <div class="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-primary/10">
          {#if is404}
            <div class="text-6xl font-bold text-primary">404</div>
          {:else}
            <AlertTriangle class="h-16 w-16 text-primary" />
          {/if}
        </div>

        <!-- Error title and description -->
        <h1 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          {is404 ? 'Page Not Found' : 'Server Error'}
        </h1>
        <p class="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {is404 
            ? 'The page you\'re looking for doesn\'t exist or has been moved.'
            : 'We\'re sorry, but something went wrong on our end.'}
        </p>

        {#if !is404}
          <div class="mt-6 text-sm text-gray-500 dark:text-gray-400">
            <p>Error {status}: {message}</p>
            <button
              on:click={refresh}
              class="mt-2 inline-flex items-center space-x-1 text-primary hover:text-primary-600 transition-colors"
            >
              <RefreshCw size={14} />
              <span>Try refreshing the page</span>
            </button>
          </div>
        {/if}

        <!-- Action buttons -->
        <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="primary" href="/" class="inline-flex items-center space-x-2">
            <Home size={16} />
            <span>Return Home</span>
          </Button>
          
          {#if is404}
            <Button variant="outline" href="/contact" class="inline-flex items-center space-x-2">
              <Mail size={16} />
              <span>Contact Support</span>
            </Button>
          {:else}
            <Button variant="outline" on:click={refresh} class="inline-flex items-center space-x-2">
              <RefreshCw size={16} />
              <span>Try Again</span>
            </Button>
          {/if}
        </div>

        {#if is404}
        <!-- Helpful pages -->
        <div class="mt-12">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white text-center mb-8">
            Popular Pages
          </h2>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
            {#each helpfulPages as pageLink}
              <a
                href={pageLink.href}
                class="group relative rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 transition-all duration-200"
              >
                <div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                    {pageLink.title}
                  </h3>
                  <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {pageLink.description}
                  </p>
                </div>
                <div class="absolute top-6 right-6">
                  <svg
                    class="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            {/each}
          </div>
        </div>

        <!-- SEO content for South African context -->
        <div class="mt-12 text-center text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          <p>
            If you followed a link from another website, please let us know at 
            <a href="mailto:support@brightbroom.com" class="text-primary hover:underline">
              support@brightbroom.com
            </a>
          </p>
          <p class="mt-2">
            Looking for cleaning services in South Africa? 
            <a href="/services" class="text-primary hover:underline">View our services</a> or 
            <a href="/book" class="text-primary hover:underline">book now</a>.
          </p>
        </div>
      {/if}

      <!-- Error Code -->
      <div class="mt-8 text-sm text-gray-500 dark:text-gray-400">
        Error Code: {status}
      </div>
      </div>
    </main>
  </div>
{/if}
