<!-- src/routes/join/company/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import HoneypotField from "$lib/components/forms/HoneypotField.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import SectionHeading from "$lib/components/ui/SectionHeading.svelte";
  import {
    CalendarCheck,
    LayoutDashboard,
    Users,
    Wallet,
  } from "lucide-svelte";

  export let data;
  export let form;

  let isSubmitting = false;

  const description =
    "List your cleaning company on BrightBroom. Get bookings, manage your team and track earnings from one dashboard.";
</script>

<svelte:head>
  <title>Partner With Us | BrightBroom</title>
  <meta name="description" content={description} />

  <meta property="og:type" content="website" />
  <meta property="og:url" content={$page.url.href} />
  <meta property="og:title" content="Partner With Us | BrightBroom" />
  <meta property="og:description" content={description} />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Partner With Us | BrightBroom" />
  <meta name="twitter:description" content={description} />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <!-- Hero -->
  <div class="bg-primary py-16 text-white">
    <div class="container mx-auto px-4">
      <div class="mx-auto max-w-3xl text-center">
        <h1 class="mb-4 font-heading text-4xl font-bold md:text-5xl">
          Grow your cleaning company with BrightBroom
        </h1>
        <p class="mb-8 text-lg text-white/90">
          Bring your team onto a platform that already has customers looking for
          cleaners. Set up in a couple of minutes — no contracts, no monthly fee.
        </p>
        <Button variant="secondary" size="lg" href="#signup">
          Register your company
        </Button>
      </div>
    </div>
  </div>

  <!-- Benefits -->
  <section class="py-12">
    <div class="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Why partner"
        title="Everything you need to run the work"
        subtitle="You keep control of your team and your pricing. We bring the customers and handle the payments."
      />

      <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        <Card hover class="text-center">
          <div class="icon-chip icon-chip-interactive mx-auto mb-4 h-16 w-16">
            <CalendarCheck size={24} />
          </div>
          <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Bookings that find you
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            Customers book through BrightBroom and the job lands in your
            dashboard, ready to assign.
          </p>
        </Card>

        <Card hover class="text-center">
          <div class="icon-chip icon-chip-interactive mx-auto mb-4 h-16 w-16">
            <Users size={24} />
          </div>
          <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Your team, your rules
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            Add your cleaners and office staff. Everyone sees only your
            company's work.
          </p>
        </Card>

        <Card hover class="text-center">
          <div class="icon-chip icon-chip-interactive mx-auto mb-4 h-16 w-16">
            <Wallet size={24} />
          </div>
          <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Paid without chasing
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            Customers pay upfront through the platform. We take a commission per
            booking — nothing else.
          </p>
        </Card>

        <Card hover class="text-center">
          <div class="icon-chip icon-chip-interactive mx-auto mb-4 h-16 w-16">
            <LayoutDashboard size={24} />
          </div>
          <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            One place to look
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            Bookings, cleaners, applications and earnings, all in a dashboard
            branded with your company name.
          </p>
        </Card>
      </div>
    </div>
  </section>

  <!-- Signup -->
  <section id="signup" class="py-12">
    <div class="container mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Get started"
        title="Register your company"
        subtitle="Your dashboard is ready as soon as you finish. You can invite your team straight after."
      />

      <Card padding="lg">
        {#if form?.error}
          <div
            class="mb-6 rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
          >
            <p class="text-sm text-red-800 dark:text-red-400">{form.error}</p>
          </div>
        {/if}

        <form
          method="POST"
          use:enhance={() => {
            isSubmitting = true;
            return async ({ update }) => {
              await update();
              isSubmitting = false;
            };
          }}
          class="space-y-6"
        >
          <HoneypotField fieldPrefix="company" />

          <fieldset class="space-y-4">
            <legend
              class="text-sm font-semibold text-gray-900 dark:text-white"
            >
              About your company
            </legend>

            <div>
              <label
                for="companyName"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Company name
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                required
                value={form?.companyName ?? ""}
                placeholder="Sparkle Cleaning Services"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  for="contactPhone"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Contact number
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  required
                  value={form?.contactPhone ?? ""}
                  placeholder="072 123 4567"
                  class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
              </div>

              <div>
                <label
                  for="province"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Province
                </label>
                <select
                  id="province"
                  name="province"
                  required
                  class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                >
                  <option value="">Select province</option>
                  {#each data.provinces as province}
                    <option
                      value={province}
                      selected={form?.province === province}
                    >
                      {province}
                    </option>
                  {/each}
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset
            class="space-y-4 border-t border-gray-200 pt-6 dark:border-gray-700"
          >
            <legend
              class="text-sm font-semibold text-gray-900 dark:text-white"
            >
              Your admin account
            </legend>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  for="firstName"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  First name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  value={form?.firstName ?? ""}
                  class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
              </div>

              <div>
                <label
                  for="lastName"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Last name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  value={form?.lastName ?? ""}
                  class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label
                for="email"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={form?.email ?? ""}
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                You'll sign in with this, and we'll send booking notifications
                here.
              </p>
            </div>

            <div>
              <label
                for="password"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                minlength="8"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                At least 8 characters.
              </p>
            </div>
          </fieldset>

          <div class="flex items-start gap-3">
            <input
              type="checkbox"
              id="terms"
              name="terms"
              required
              class="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600"
            />
            <label
              for="terms"
              class="text-sm text-gray-600 dark:text-gray-300"
            >
              I accept the
              <a href="/terms" class="text-primary hover:underline">
                Terms of Service
              </a>
              and
              <a href="/privacy" class="text-primary hover:underline">
                Privacy Policy
              </a>
            </label>
          </div>

          <Button type="submit" variant="primary" wide="full" disabled={isSubmitting}>
            {isSubmitting ? "Setting up your company..." : "Create my company account"}
          </Button>

          <p class="text-center text-sm text-gray-500 dark:text-gray-400">
            Already registered?
            <a href="/auth/login" class="text-primary hover:underline">Log in</a>
          </p>
        </form>
      </Card>
    </div>
  </section>
</div>
