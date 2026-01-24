<!-- src/routes/coupon/[code]/+page.svelte -->
<script lang="ts">
  import {
    AlertCircle,
    Calendar,
    Clock,
    Scissors,
    Sparkles,
    Tag,
  } from "lucide-svelte";

  let { data } = $props();
  const coupon = $derived(data.coupon);
  const isExpired = $derived(data.isExpired);
  const isNotYetValid = $derived(data.isNotYetValid);
  const isValid = $derived(data.isValid);

  // Format price as currency (no decimals for cleaner display)
  function formatPrice(price: number | string) {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(price));
  }

  // Format date for display
  function formatDate(date: Date | string | null) {
    if (!date) return "No expiry";
    const d = new Date(date);
    return d.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // Get discount display text
  function getDiscountText() {
    if (coupon.discountType === "PERCENTAGE") {
      return `${parseFloat(coupon.discountValue)}% OFF`;
    } else {
      return `${formatPrice(coupon.discountValue)} OFF`;
    }
  }
</script>

<svelte:head>
  <title>{coupon.code} - {getDiscountText()} | BrightBroom</title>
  <meta
    name="description"
    content="Use code {coupon.code} to get {getDiscountText()} on your BrightBroom cleaning service booking!"
  />
</svelte:head>

<div
  class="min-h-screen bg-gradient-to-br from-teal-50 via-white to-orange-50 py-8 px-4 flex items-center justify-center"
>
  <div class="w-full max-w-md">
    <!-- Coupon Card -->
    <div class="relative">
      <!-- Scissors decoration -->
      <div
        class="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10 bg-white rounded-full p-2 shadow-lg"
      >
        <Scissors size={24} class="text-gray-400 rotate-90" />
      </div>

      <!-- Main coupon card -->
      <div
        class="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-dashed border-gray-200"
      >
        <!-- Header section with brand colors -->
        <div
          class="bg-gradient-to-r from-primary to-primary-600 p-6 text-center relative overflow-hidden"
        >
          <!-- Background pattern -->
          <div class="absolute inset-0 opacity-10">
            <div
              class="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"
            ></div>
            <div
              class="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"
            ></div>
          </div>

          <div class="relative z-10">
            <!-- Logo/Brand -->
            <div class="flex items-center justify-center gap-2 mb-3">
              <Sparkles size={20} class="text-white/80" />
              <span class="text-white font-bold text-xl tracking-wide"
                >BrightBroom</span
              >
              <Sparkles size={20} class="text-white/80" />
            </div>

            <!-- Discount amount -->
            <div class="text-white">
              <div class="text-5xl font-black tracking-tight mb-1">
                {getDiscountText()}
              </div>
              <div class="text-white/90 text-sm font-medium">
                {coupon.name}
              </div>
            </div>
          </div>
        </div>

        <!-- Perforated edge effect -->
        <div class="relative h-6 bg-white">
          <div
            class="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-gradient-to-br from-teal-50 via-white to-orange-50 rounded-full"
          ></div>
          <div
            class="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-6 h-6 bg-gradient-to-br from-teal-50 via-white to-orange-50 rounded-full"
          ></div>
          <div
            class="absolute inset-x-8 top-1/2 border-t-2 border-dashed border-gray-200"
          ></div>
        </div>

        <!-- Coupon code section -->
        <div class="p-6 text-center">
          <div
            class="text-xs uppercase tracking-widest text-gray-500 mb-2 font-medium"
          >
            Your Coupon Code
          </div>
          <div
            class="bg-gray-100 rounded-xl py-4 px-6 inline-block border-2 border-gray-200"
          >
            <div class="flex items-center gap-3">
              <Tag size={20} class="text-primary" />
              <span
                class="font-mono text-2xl font-black text-gray-800 tracking-wider"
              >
                {coupon.code}
              </span>
            </div>
          </div>
        </div>

        <!-- Status badge -->
        {#if !isValid}
          <div class="px-6 pb-4">
            {#if isExpired}
              <div
                class="flex items-center justify-center gap-2 bg-red-50 text-red-700 py-3 px-4 rounded-lg"
              >
                <AlertCircle size={18} />
                <span class="font-medium">This coupon has expired</span>
              </div>
            {:else if isNotYetValid}
              <div
                class="flex items-center justify-center gap-2 bg-amber-50 text-amber-700 py-3 px-4 rounded-lg"
              >
                <Clock size={18} />
                <span class="font-medium"
                  >Valid from {formatDate(coupon.validFrom)}</span
                >
              </div>
            {:else if !coupon.isActive}
              <div
                class="flex items-center justify-center gap-2 bg-gray-100 text-gray-600 py-3 px-4 rounded-lg"
              >
                <AlertCircle size={18} />
                <span class="font-medium"
                  >This coupon is not currently active</span
                >
              </div>
            {/if}
          </div>
        {/if}

        <!-- Details section -->
        <div class="px-6 pb-6 space-y-3">
          <!-- Description if available -->
          {#if coupon.description}
            <p class="text-gray-600 text-center text-sm">
              {coupon.description}
            </p>
          {/if}

          <!-- Terms/conditions -->
          <div class="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            {#if coupon.requiresFirstBooking}
              <div class="flex justify-between items-center text-gray-600">
                <span>Eligibility:</span>
                <span class="font-semibold text-blue-600"
                  >First booking only</span
                >
              </div>
            {/if}

            <div class="flex justify-between items-center text-gray-600">
              <div class="flex items-center gap-1">
                <Calendar size={14} />
                <span>Valid until:</span>
              </div>
              <span class="font-semibold text-gray-800">
                {coupon.validUntil
                  ? formatDate(coupon.validUntil)
                  : "No expiry"}
              </span>
            </div>
          </div>
        </div>

        <!-- CTA section -->
        <div
          class="bg-gradient-to-r from-secondary/10 to-secondary/5 p-6 text-center border-t border-gray-100"
        >
          <a
            href="/book"
            class="inline-flex items-center justify-center gap-2 bg-secondary hover:bg-secondary-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <Sparkles size={18} />
            Book Now
          </a>
          <p class="text-xs text-gray-500 mt-3">Apply this code at checkout</p>
        </div>
      </div>

      <!-- Bottom decoration -->
      <div class="flex justify-center gap-1 mt-4">
        {#each Array(5) as _, i (i)}
          <div class="w-2 h-2 bg-primary/30 rounded-full"></div>
        {/each}
      </div>
    </div>

    <!-- Footer text -->
    <p class="text-center text-gray-400 text-xs mt-6">brightbroom.com</p>
  </div>
</div>
