<!-- src/routes/services/+page.svelte -->
<script lang="ts">
  import ServicesGrid from '$lib/components/services/ServicesGrid.svelte';
  import Button from '$lib/components/ui/Button.svelte';
</script>

<svelte:head>
  <title>Services | BrightBroom</title>
  <meta name="description" content="BrightBroom offers a range of professional cleaning services for homes and offices." />
  
  <!-- Open Graph -->
  <meta property="og:title" content="Professional Cleaning Services | BrightBroom" />
  <meta property="og:description" content="BrightBroom offers a range of professional cleaning services for homes and offices." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://brightbroom.com/services" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="Professional Cleaning Services | BrightBroom" />
  <meta name="twitter:description" content="BrightBroom offers a range of professional cleaning services for homes and offices." />
  
  <!-- Structured Data -->
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Professional Cleaning Services",
      "provider": {
        "@type": "LocalBusiness",
        "name": "BrightBroom",
        "url": "https://brightbroom.com"
      },
      "serviceType": "Cleaning Service",
      "description": "BrightBroom offers a range of professional cleaning services for homes and offices.",
      "areaServed": [
        "Johannesburg",
        "Cape Town", 
        "Durban",
        "Pretoria"
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Cleaning Services",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Regular Cleaning",
              "description": "Perfect for maintaining a clean and tidy home on a regular basis.",
              "serviceType": "Residential Cleaning"
            }
          },
          {
            "@type": "Offer", 
            "itemOffered": {
              "@type": "Service",
              "name": "Extended Cleaning",
              "description": "A thorough cleaning service that reaches every corner and detail.",
              "serviceType": "Deep Cleaning"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service", 
              "name": "Office Cleaning",
              "description": "Professional cleaning for your office space or commercial property.",
              "serviceType": "Commercial Cleaning"
            }
          }
        ]
      }
    }
  </script>
</svelte:head>

<div class="bg-gray-50 py-16 dark:bg-gray-900">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <!-- Page header -->
    <div class="mb-12 text-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
        Our Cleaning Services
      </h1>
      <p class="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
        Choose from our range of professional cleaning services designed to meet your needs.
      </p>
    </div>
    
    <!-- Residential services section -->
    <div class="mb-16">
      <h2 class="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        Residential Cleaning
      </h2>
      <ServicesGrid category="residential" />
    </div>
    
    <!-- Commercial services section -->
    <div class="mb-16">
      <h2 class="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        Commercial Cleaning
      </h2>
      <ServicesGrid category="commercial" />
    </div>
    
    <!-- Custom request section -->
    <div class="mt-16 rounded-lg bg-primary-50 p-8 text-center dark:bg-primary-900/20">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
        Need a custom cleaning solution?
      </h2>
      <p class="mx-auto mt-4 max-w-xl text-gray-600 dark:text-gray-300">
        If you need a custom cleaning service that's not listed here, we'd be happy to 
        create a tailored solution for your specific requirements.
      </p>
      <div class="mt-6">
        <Button variant="primary" href="/contact">
          Contact Us
        </Button>
      </div>
    </div>
    
    <!-- FAQ section -->
    <div class="mt-16">
      <h2 class="mb-8 text-2xl font-bold text-center text-gray-900 dark:text-white">
        Frequently Asked Questions
      </h2>
      
      <div class="space-y-6">
        <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            What's included in your cleaning services?
          </h3>
          <p class="mt-2 text-gray-600 dark:text-gray-300">
            Each of our services includes a specific set of cleaning tasks. You can view the detailed 
            breakdown of each service by clicking on the "View Details" button on the service card.
          </p>
        </div>
        
        <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Do I need to provide cleaning supplies?
          </h3>
          <p class="mt-2 text-gray-600 dark:text-gray-300">
            Yes, our professional cleaners do not bring any cleaning supplies and equipment.
          </p>
        </div>
        
        <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            How do I book a service?
          </h3>
          <p class="mt-2 text-gray-600 dark:text-gray-300">
            Simply select the service you want, choose your preferred date and time, 
            and complete your booking online. You can also contact us directly if you 
            have specific requirements or questions.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
