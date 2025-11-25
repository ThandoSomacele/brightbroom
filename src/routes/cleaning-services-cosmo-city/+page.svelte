<script>
  import Button from '$lib/components/ui/Button.svelte';
</script>

<svelte:head>
  <title>Professional Cleaning Services in Cosmo City | BrightBroom</title>
  <meta name="description" content="Affordable and professional home and office cleaning services in Cosmo City, Roodepoort. Book trusted cleaners for regular or deep cleaning. Serving Cosmo City, Zandspruit, Diepsloot, and surrounding areas." />
  <meta name="keywords" content="cleaning services Cosmo City, house cleaning Cosmo City, office cleaning Cosmo City, domestic cleaning Cosmo City, cleaners near me Cosmo City, affordable cleaning Cosmo City, maid service Cosmo City, home cleaning Roodepoort" />

  <!-- Open Graph / Facebook -->
  <meta property="og:title" content="Professional Cleaning Services in Cosmo City | BrightBroom" />
  <meta property="og:description" content="Book affordable and trusted cleaning services in Cosmo City. Professional cleaners for your home or office. Easy online booking." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://brightbroom.com/cleaning-services-cosmo-city" />
  <meta property="og:image" content="https://brightbroom.com/images/brightbroom-og-image.jpg" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Professional Cleaning Services in Cosmo City | BrightBroom" />
  <meta name="twitter:description" content="Book affordable and trusted cleaning services in Cosmo City. Professional cleaners for your home or office." />
  <meta name="twitter:image" content="https://brightbroom.com/images/brightbroom-og-image.jpg" />

  <!-- Structured Data for Local Business -->
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "BrightBroom - Cosmo City",
      "image": "https://brightbroom.com/images/brightbroom-og-image.jpg",
      "description": "Professional and affordable cleaning services in Cosmo City, Roodepoort. Book trusted cleaners for your home or office.",
      "@id": "https://brightbroom.com/cleaning-services-cosmo-city",
      "url": "https://brightbroom.com/cleaning-services-cosmo-city",
      "telephone": "+27-11-123-4567",
      "priceRange": "$$",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Cosmo City",
        "addressLocality": "Roodepoort",
        "addressRegion": "Gauteng",
        "postalCode": "1709",
        "addressCountry": "ZA"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": -26.0212639,
        "longitude": 27.9289995
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday"
        ],
        "opens": "07:00",
        "closes": "19:00"
      },
      "areaServed": {
        "@type": "GeoCircle",
        "geoMidpoint": {
          "@type": "GeoCoordinates",
          "latitude": -26.0212639,
          "longitude": 27.9289995
        },
        "geoRadius": "50000"
      },
      "serviceType": "Cleaning Service",
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Cleaning Services",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Regular Home Cleaning",
              "description": "Affordable regular cleaning service for maintaining a clean home in Cosmo City."
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Deep Cleaning",
              "description": "Thorough deep cleaning service for homes in Cosmo City and surrounding areas."
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Office Cleaning",
              "description": "Professional cleaning for offices and businesses in Cosmo City."
            }
          }
        ]
      }
    }
  </script>
</svelte:head>

<div class="container mx-auto px-4 py-8 md:py-12">
  <div class="max-w-4xl mx-auto">
    <!-- Hero Section -->
    <section class="mb-12">
      <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
        Professional Cleaning Services in Cosmo City
      </h1>
      <p class="text-xl text-gray-600 mb-8">
        Your trusted affordable cleaning service serving Cosmo City and surrounding areas including Zandspruit, Diepsloot, Honeydew, and Randburg.
      </p>
      <div class="flex flex-wrap gap-4">
        <Button href="/book" size="lg" variant="primary">
          Book a Cleaning
        </Button>
        <Button href="/services" size="lg" variant="secondary">
          View Services
        </Button>
      </div>
    </section>

    <!-- Service Areas -->
    <section class="mb-12 bg-gray-50 rounded-lg p-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Areas We Serve Around Cosmo City</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-primary-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <span>Cosmo City</span>
        </div>
        <div class="flex items-center">
          <svg class="w-5 h-5 text-primary-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <span>Zandspruit</span>
        </div>
        <div class="flex items-center">
          <svg class="w-5 h-5 text-primary-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <span>Diepsloot</span>
        </div>
        <div class="flex items-center">
          <svg class="w-5 h-5 text-primary-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <span>Honeydew</span>
        </div>
        <div class="flex items-center">
          <svg class="w-5 h-5 text-primary-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <span>Randburg</span>
        </div>
        <div class="flex items-center">
          <svg class="w-5 h-5 text-primary-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <span>Roodepoort</span>
        </div>
      </div>
      <p class="mt-4 text-gray-600">
        We offer extended coverage with a 50km radius from Cosmo City, ensuring reliable service to a wide area.
      </p>
    </section>

    <!-- Services Overview -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Our Cleaning Services in Cosmo City</h2>
      <div class="grid md:grid-cols-2 gap-6">
        <div class="border border-gray-200 rounded-lg p-6">
          <h3 class="text-xl font-semibold text-gray-900 mb-3">Regular Home Cleaning</h3>
          <p class="text-gray-600 mb-4">
            Keep your Cosmo City home consistently clean with our affordable regular cleaning service. Perfect for busy families and working professionals.
          </p>
          <ul class="space-y-2 text-gray-600">
            <li class="flex items-start">
              <span class="text-primary-600 mr-2">•</span>
              Weekly, bi-weekly, or monthly schedules
            </li>
            <li class="flex items-start">
              <span class="text-primary-600 mr-2">•</span>
              Trusted, local cleaners from your community
            </li>
            <li class="flex items-start">
              <span class="text-primary-600 mr-2">•</span>
              Flexible and affordable pricing
            </li>
          </ul>
        </div>

        <div class="border border-gray-200 rounded-lg p-6">
          <h3 class="text-xl font-semibold text-gray-900 mb-3">Deep Cleaning</h3>
          <p class="text-gray-600 mb-4">
            Comprehensive deep cleaning for your home in Cosmo City. Ideal for spring cleaning, moving in/out, or special occasions.
          </p>
          <ul class="space-y-2 text-gray-600">
            <li class="flex items-start">
              <span class="text-primary-600 mr-2">•</span>
              Thorough cleaning of all areas
            </li>
            <li class="flex items-start">
              <span class="text-primary-600 mr-2">•</span>
              Attention to every detail
            </li>
            <li class="flex items-start">
              <span class="text-primary-600 mr-2">•</span>
              Perfect for seasonal deep cleans
            </li>
          </ul>
        </div>

        <div class="border border-gray-200 rounded-lg p-6">
          <h3 class="text-xl font-semibold text-gray-900 mb-3">Office Cleaning</h3>
          <p class="text-gray-600 mb-4">
            Professional office cleaning for businesses in Cosmo City and the surrounding commercial areas.
          </p>
          <ul class="space-y-2 text-gray-600">
            <li class="flex items-start">
              <span class="text-primary-600 mr-2">•</span>
              Flexible scheduling options
            </li>
            <li class="flex items-start">
              <span class="text-primary-600 mr-2">•</span>
              Commercial cleaning standards
            </li>
            <li class="flex items-start">
              <span class="text-primary-600 mr-2">•</span>
              Regular service contracts available
            </li>
          </ul>
        </div>

        <div class="border border-gray-200 rounded-lg p-6">
          <h3 class="text-xl font-semibold text-gray-900 mb-3">Move In/Move Out Cleaning</h3>
          <p class="text-gray-600 mb-4">
            Specialized cleaning for tenants and landlords in Cosmo City, ensuring properties are spotless for new occupants.
          </p>
          <ul class="space-y-2 text-gray-600">
            <li class="flex items-start">
              <span class="text-primary-600 mr-2">•</span>
              Complete property cleaning
            </li>
            <li class="flex items-start">
              <span class="text-primary-600 mr-2">•</span>
              Kitchen and bathroom deep clean
            </li>
            <li class="flex items-start">
              <span class="text-primary-600 mr-2">•</span>
              Move-in ready guarantee
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Why Choose Us -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Why Cosmo City Residents Choose BrightBroom</h2>
      <div class="grid md:grid-cols-3 gap-6">
        <div class="text-center">
          <div class="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 class="font-semibold text-gray-900 mb-2">Affordable Pricing</h3>
          <p class="text-gray-600">Quality cleaning services at prices that work for Cosmo City families and businesses.</p>
        </div>

        <div class="text-center">
          <div class="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <h3 class="font-semibold text-gray-900 mb-2">Local Community Focus</h3>
          <p class="text-gray-600">We employ local cleaners from Cosmo City and surrounding areas, supporting our community.</p>
        </div>

        <div class="text-center">
          <div class="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>
          <h3 class="font-semibold text-gray-900 mb-2">Vetted & Trusted</h3>
          <p class="text-gray-600">All our cleaners are thoroughly vetted and trained for your complete peace of mind.</p>
        </div>
      </div>
    </section>

    <!-- Local Knowledge -->
    <section class="mb-12 bg-primary-50 rounded-lg p-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Serving the Cosmo City Community</h2>
      <p class="text-gray-700 mb-4">
        BrightBroom is proud to serve the diverse and vibrant Cosmo City community. We understand the unique needs of this integrated township and work with local cleaners who know the area well.
      </p>
      <p class="text-gray-700 mb-4">
        Our cleaners are familiar with the different residential sections, apartment complexes, and townhouse developments throughout Cosmo City. We provide the same high-quality service whether you're in the subsidized housing area or private developments.
      </p>
      <p class="text-gray-700">
        With extended coverage reaching Zandspruit, Diepsloot, Honeydew, and beyond, we're committed to making professional cleaning services accessible and affordable for everyone in the area.
      </p>
    </section>

    <!-- CTA Section -->
    <section class="text-center py-8 bg-gray-900 text-white rounded-lg">
      <h2 class="text-3xl font-bold mb-4">Ready for a Cleaner Home in Cosmo City?</h2>
      <p class="text-xl mb-8 text-gray-300">
        Join our growing community of satisfied customers in Cosmo City who trust BrightBroom for affordable, professional cleaning.
      </p>
      <div class="flex flex-wrap gap-4 justify-center">
        <Button href="/book" size="lg" class="!bg-white !text-gray-900 hover:!bg-gray-100 focus:ring-primary-500">
          Book Your Cleaning Today
        </Button>
        <Button href="/contact" size="lg" class="!bg-transparent !border-2 !border-white !text-white hover:!bg-white hover:!text-gray-900 focus:ring-white">
          Get a Quote
        </Button>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="mt-12">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions - Cosmo City</h2>
      <div class="space-y-4">
        <details class="border border-gray-200 rounded-lg p-4">
          <summary class="font-semibold text-gray-900 cursor-pointer">Do you serve all areas within Cosmo City?</summary>
          <p class="mt-3 text-gray-600">
            Yes, we service all residential areas within Cosmo City, including apartment complexes, townhouses, and standalone homes. We have extended coverage reaching 50km from the center of Cosmo City.
          </p>
        </details>

        <details class="border border-gray-200 rounded-lg p-4">
          <summary class="font-semibold text-gray-900 cursor-pointer">How do you handle load-shedding schedules?</summary>
          <p class="mt-3 text-gray-600">
            We track load-shedding schedules for Cosmo City and surrounding areas, planning our appointments accordingly. If load-shedding affects your booking, we'll work with you to reschedule at no extra cost.
          </p>
        </details>

        <details class="border border-gray-200 rounded-lg p-4">
          <summary class="font-semibold text-gray-900 cursor-pointer">Do I need to provide cleaning supplies?</summary>
          <p class="mt-3 text-gray-600">
            Yes, we ask that you provide cleaning supplies and equipment. This helps us keep our prices affordable and ensures you get the specific products you prefer in your home.
          </p>
        </details>

        <details class="border border-gray-200 rounded-lg p-4">
          <summary class="font-semibold text-gray-900 cursor-pointer">What payment methods do you accept?</summary>
          <p class="mt-3 text-gray-600">
            We accept secure online payments through our platform, including credit/debit cards and EFT. Payment is processed when you complete your booking.
          </p>
        </details>

        <details class="border border-gray-200 rounded-lg p-4">
          <summary class="font-semibold text-gray-900 cursor-pointer">Can I book a cleaner for the same day?</summary>
          <p class="mt-3 text-gray-600">
            We offer same-day bookings based on cleaner availability in your area. For the best chance of securing your preferred time, we recommend booking at least 24 hours in advance.
          </p>
        </details>

        <details class="border border-gray-200 rounded-lg p-4">
          <summary class="font-semibold text-gray-900 cursor-pointer">Are your cleaners from the local community?</summary>
          <p class="mt-3 text-gray-600">
            Yes, we actively recruit and train cleaners from Cosmo City and surrounding communities. This supports local employment while ensuring our cleaners understand the area and can communicate effectively with residents.
          </p>
        </details>
      </div>
    </section>
  </div>
</div>
