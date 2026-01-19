<script>
  import Button from "$lib/components/ui/Button.svelte";
</script>

<svelte:head>
  <title>Professional Cleaning Services in North Riding | BrightBroom</title>
  <meta
    name="description"
    content="Top-rated home and office cleaning services in North Riding, Johannesburg. Book professional cleaners for regular or deep cleaning. Serving North Riding, Northworld, Bloubosrand, and surrounding areas."
  />
  <meta
    name="keywords"
    content="cleaning services North Riding, house cleaning North Riding, office cleaning North Riding, domestic cleaning North Riding, cleaners near me North Riding, maid service North Riding, home cleaning North Riding AH"
  />

  <!-- Open Graph / Facebook -->
  <meta
    property="og:title"
    content="Professional Cleaning Services in North Riding | BrightBroom"
  />
  <meta
    property="og:description"
    content="Book trusted cleaning services in North Riding. Professional cleaners for your home or office. Easy online booking."
  />
  <meta property="og:type" content="website" />
  <meta
    property="og:url"
    content="https://brightbroom.com/cleaning-services-north-riding"
  />
  <meta
    property="og:image"
    content="https://brightbroom.com/images/brightbroom-og-image.jpg"
  />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta
    name="twitter:title"
    content="Professional Cleaning Services in North Riding | BrightBroom"
  />
  <meta
    name="twitter:description"
    content="Book trusted cleaning services in North Riding. Professional cleaners for your home or office."
  />
  <meta
    name="twitter:image"
    content="https://brightbroom.com/images/brightbroom-og-image.jpg"
  />

  <!-- Structured Data for Local Business -->
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "BrightBroom - North Riding",
      "image": "https://brightbroom.com/images/brightbroom-og-image.jpg",
      "description": "Professional cleaning services in North Riding, Johannesburg. Book trusted cleaners for your home or office.",
      "@id": "https://brightbroom.com/cleaning-services-north-riding",
      "url": "https://brightbroom.com/cleaning-services-north-riding",
      "telephone": "+27-11-123-4567",
      "priceRange": "$$",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "North Riding",
        "addressLocality": "Randburg",
        "addressRegion": "Gauteng",
        "postalCode": "2162",
        "addressCountry": "ZA"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": -26.0469,
        "longitude": 27.951
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
          "latitude": -26.0469,
          "longitude": 27.951
        },
        "geoRadius": "15000"
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
              "description": "Perfect for maintaining a clean and tidy home on a regular basis in North Riding."
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Deep Cleaning",
              "description": "Thorough deep cleaning service for homes in North Riding."
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Office Cleaning",
              "description": "Professional cleaning for offices in the North Riding business district."
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
        Professional Cleaning Services in North Riding
      </h1>
      <p class="text-xl text-gray-600 mb-8">
        Your trusted local cleaning service serving North Riding and surrounding
        areas including Northworld, Bloubosrand, Northgate, Kya Sand, and
        Honeydew.
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
      <h2 class="text-2xl font-bold text-gray-900 mb-4">
        Areas We Serve in North Riding
      </h2>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div class="flex items-center">
          <svg
            class="w-5 h-5 text-primary-600 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            ></path>
          </svg>
          <span>North Riding AH</span>
        </div>
        <div class="flex items-center">
          <svg
            class="w-5 h-5 text-primary-600 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            ></path>
          </svg>
          <span>Northworld</span>
        </div>
        <div class="flex items-center">
          <svg
            class="w-5 h-5 text-primary-600 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            ></path>
          </svg>
          <span>Bloubosrand</span>
        </div>
        <div class="flex items-center">
          <svg
            class="w-5 h-5 text-primary-600 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            ></path>
          </svg>
          <span>Northgate</span>
        </div>
        <div class="flex items-center">
          <svg
            class="w-5 h-5 text-primary-600 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            ></path>
          </svg>
          <span>Kya Sand</span>
        </div>
        <div class="flex items-center">
          <svg
            class="w-5 h-5 text-primary-600 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            ></path>
          </svg>
          <span>Honeydew</span>
        </div>
      </div>
      <p class="mt-4 text-gray-600">
        We cover all areas within a 15km radius of North Riding, ensuring prompt
        and reliable service to your doorstep.
      </p>
    </section>

    <!-- Services Overview -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">
        Our Cleaning Services in North Riding
      </h2>
      <div class="grid md:grid-cols-2 gap-6">
        <div class="border border-gray-200 rounded-lg p-6">
          <h3 class="text-xl font-semibold text-gray-900 mb-3">
            Regular Home Cleaning
          </h3>
          <p class="text-gray-600 mb-4">
            Keep your North Riding home consistently clean with our regular
            cleaning service. Perfect for busy professionals and families in the
            area.
          </p>
          <ul class="space-y-2 text-gray-600">
            <li class="flex items-start">
              <span class="text-primary-600 mr-2">•</span>
              Weekly, bi-weekly, or monthly schedules
            </li>
            <li class="flex items-start">
              <span class="text-primary-600 mr-2">•</span>
              Trusted, vetted cleaners familiar with North Riding estates
            </li>
            <li class="flex items-start">
              <span class="text-primary-600 mr-2">•</span>
              Flexible booking options
            </li>
          </ul>
        </div>

        <div class="border border-gray-200 rounded-lg p-6">
          <h3 class="text-xl font-semibold text-gray-900 mb-3">
            Deep Cleaning
          </h3>
          <p class="text-gray-600 mb-4">
            Thorough deep cleaning for your home in North Riding. Ideal for
            spring cleaning, moving in/out, or special occasions.
          </p>
          <ul class="space-y-2 text-gray-600">
            <li class="flex items-start">
              <span class="text-primary-600 mr-2">•</span>
              Comprehensive cleaning of all areas
            </li>
            <li class="flex items-start">
              <span class="text-primary-600 mr-2">•</span>
              Meticulous attention to detail
            </li>
            <li class="flex items-start">
              <span class="text-primary-600 mr-2">•</span>
              Perfect for seasonal deep cleans
            </li>
          </ul>
        </div>

        <div class="border border-gray-200 rounded-lg p-6">
          <h3 class="text-xl font-semibold text-gray-900 mb-3">
            Office Cleaning
          </h3>
          <p class="text-gray-600 mb-4">
            Professional office cleaning for businesses in the North Riding
            commercial district and nearby business parks.
          </p>
          <ul class="space-y-2 text-gray-600">
            <li class="flex items-start">
              <span class="text-primary-600 mr-2">•</span>
              After-hours cleaning available
            </li>
            <li class="flex items-start">
              <span class="text-primary-600 mr-2">•</span>
              Commercial-grade cleaning standards
            </li>
            <li class="flex items-start">
              <span class="text-primary-600 mr-2">•</span>
              Regular service contracts available
            </li>
          </ul>
        </div>

        <div class="border border-gray-200 rounded-lg p-6">
          <h3 class="text-xl font-semibold text-gray-900 mb-3">
            Post-Construction Cleaning
          </h3>
          <p class="text-gray-600 mb-4">
            Specialised cleaning for newly built or renovated properties in
            North Riding and surrounding developments.
          </p>
          <ul class="space-y-2 text-gray-600">
            <li class="flex items-start">
              <span class="text-primary-600 mr-2">•</span>
              Removal of construction dust and debris
            </li>
            <li class="flex items-start">
              <span class="text-primary-600 mr-2">•</span>
              Window and fixture cleaning
            </li>
            <li class="flex items-start">
              <span class="text-primary-600 mr-2">•</span>
              Move-in ready results
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Why Choose Us -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">
        Why North Riding Residents Choose BrightBroom
      </h2>
      <div class="grid md:grid-cols-3 gap-6">
        <div class="text-center">
          <div
            class="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <h3 class="font-semibold text-gray-900 mb-2">Always On Time</h3>
          <p class="text-gray-600">
            Our cleaners arrive promptly at your scheduled time, respecting your
            busy North Riding lifestyle.
          </p>
        </div>

        <div class="text-center">
          <div
            class="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              ></path>
            </svg>
          </div>
          <h3 class="font-semibold text-gray-900 mb-2">Vetted Professionals</h3>
          <p class="text-gray-600">
            All our cleaners are thoroughly vetted, insured, and trained for
            your complete peace of mind.
          </p>
        </div>

        <div class="text-center">
          <div
            class="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
          <h3 class="font-semibold text-gray-900 mb-2">
            100% Satisfaction Guaranteed
          </h3>
          <p class="text-gray-600">
            We're not happy until you're completely satisfied with our cleaning
            service.
          </p>
        </div>
      </div>
    </section>

    <!-- Local Knowledge -->
    <section class="mb-12 bg-primary-50 rounded-lg p-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">
        Local North Riding Expertise
      </h2>
      <p class="text-gray-700 mb-4">
        As a local cleaning service, we understand the unique needs of North
        Riding residents. From managing estate access protocols to understanding
        load-shedding schedules, we've got you covered.
      </p>
      <p class="text-gray-700 mb-4">
        Our cleaners are familiar with North Riding estates, security estates,
        and residential complexes. We understand the area's high standards and
        deliver cleaning services that match the quality expectations of the
        community.
      </p>
      <p class="text-gray-700">
        Located between Randburg and Honeydew, North Riding has unique
        accessibility requirements. We work around your schedule, coordinate
        with estate security, and ensure seamless service delivery every time.
      </p>
    </section>

    <!-- CTA Section -->
    <section class="text-center py-8 bg-gray-900 text-white rounded-lg">
      <h2 class="text-3xl font-bold mb-4">
        Ready for a Cleaner Home in North Riding?
      </h2>
      <p class="text-xl mb-8 text-gray-300">
        Join hundreds of satisfied customers in North Riding who trust
        BrightBroom for their cleaning needs.
      </p>
      <div class="flex flex-wrap gap-4 justify-center">
        <Button
          href="/book"
          size="lg"
          class="!bg-white !text-gray-900 hover:!bg-secondary-200 focus:ring-primary-500"
        >
          Book Your Cleaning Today
        </Button>
        <Button
          href="/contact"
          size="lg"
          class="!bg-transparent !border-2 !border-white !text-white hover:!bg-white hover:!text-gray-900 focus:ring-white"
        >
          Get a Quote
        </Button>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="mt-12">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">
        Frequently Asked Questions - North Riding
      </h2>
      <div class="space-y-4">
        <details class="border border-gray-200 rounded-lg p-4">
          <summary class="font-semibold text-gray-900 cursor-pointer"
            >Do you service all estates in North Riding?</summary
          >
          <p class="mt-3 text-gray-600">
            Yes, we service all residential estates, complexes, and security
            villages within the North Riding area. Simply provide access details
            and security contact information when booking.
          </p>
        </details>

        <details class="border border-gray-200 rounded-lg p-4">
          <summary class="font-semibold text-gray-900 cursor-pointer"
            >How do you handle load-shedding in North Riding?</summary
          >
          <p class="mt-3 text-gray-600">
            We track load-shedding schedules for all North Riding areas and plan
            our cleaning appointments accordingly. If load-shedding affects your
            booking time, we'll coordinate with you to reschedule at no extra
            cost.
          </p>
        </details>

        <details class="border border-gray-200 rounded-lg p-4">
          <summary class="font-semibold text-gray-900 cursor-pointer"
            >Do I need to provide cleaning supplies?</summary
          >
          <p class="mt-3 text-gray-600">
            Yes, we ask that you provide cleaning supplies and equipment. This
            ensures you get exactly the products you prefer in your home and
            allows us to keep our service prices competitive.
          </p>
        </details>

        <details class="border border-gray-200 rounded-lg p-4">
          <summary class="font-semibold text-gray-900 cursor-pointer"
            >Can I book same-day cleaning in North Riding?</summary
          >
          <p class="mt-3 text-gray-600">
            We offer same-day bookings subject to cleaner availability in your
            area. For the best chance of securing your preferred time slot, we
            recommend booking at least 24-48 hours in advance.
          </p>
        </details>

        <details class="border border-gray-200 rounded-lg p-4">
          <summary class="font-semibold text-gray-900 cursor-pointer"
            >Are your cleaners insured?</summary
          >
          <p class="mt-3 text-gray-600">
            Yes, all our cleaners are fully insured and vetted. We take security
            and trust seriously, ensuring you can confidently welcome our
            professionals into your North Riding home.
          </p>
        </details>
      </div>
    </section>
  </div>
</div>
