<!-- src/routes/contact/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import Button from "$lib/components/ui/Button.svelte";
  import HoneypotField from "$lib/components/forms/HoneypotField.svelte";
  
  import {
    ExternalLink,
    Mail,
    MapPin,
    MessageSquare,
    Users,
  } from "lucide-svelte";

  // Form state
  let isSubmitting = false;
  let formSuccess = false;
  let formError: string | null = null;

  // Reset form after submission
  function resetForm() {
    const form = document.getElementById("contact-form") as HTMLFormElement;
    if (form) form.reset();
  }
</script>

<svelte:head>
  <title>Contact Us | BrightBroom</title>
  <meta
    name="description"
    content="Get in touch with BrightBroom cleaning services for questions, support, or to join our team of professional cleaners."
  />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12 dark:bg-gray-900">
  <div class="container mx-auto px-4">
    <!-- Page Header -->
    <div class="mb-12 text-center">
      <h1 class="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
        Contact Us
      </h1>
      <p class="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
        Have questions or need assistance? We're here to help. Fill out the form
        below or use our contact information to reach out.
      </p>
    </div>

    <div class="mx-auto max-w-6xl">
      <div class="grid gap-8 md:grid-cols-3">
        <!-- Contact Info Section -->
        <div class="md:col-span-1">
          <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <h2
              class="mb-6 text-2xl font-semibold text-gray-900 dark:text-white"
            >
              Get In Touch
            </h2>

            <!-- Contact Methods -->
            <div class="space-y-6">
              <!-- Email -->
              <div class="flex">
                <div
                  class="mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary dark:bg-primary-900/20"
                >
                  <Mail size={20} />
                </div>
                <div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                    Email Us
                  </h3>
                  <p class="mt-1 text-gray-600 dark:text-gray-300">
                    <a
                      href="mailto:info@brightbroom.com"
                      class="hover:underline"
                    >
                      info@brightbroom.com
                    </a>
                  </p>
                </div>
              </div>

              <!-- Phone -->
              <div class="flex">
                <div
                  class="mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary dark:bg-primary-900/20"
                >
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                    WhatsApp Us
                  </h3>
                  <p class="mt-1 text-gray-600 dark:text-gray-300">
                    <a href="https://wa.me/0693915277" class="hover:underline">
                      +27 69 391 1577
                    </a>
                  </p>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Monday-Friday: 8am - 6pm
                  </p>
                </div>
              </div>

              <!-- Office -->
              <div class="flex">
                <div
                  class="mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary dark:bg-primary-900/20"
                >
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                    Visit Us
                  </h3>
                  <p class="mt-1 text-gray-600 dark:text-gray-300">
                    0B Cedar Avenue West<br />
                    Fourways, 2191<br />
                    South Africa
                  </p>
                </div>
              </div>
            </div>

            <!-- Join Our Team Section -->
            <div
              class="mt-10 rounded-lg bg-secondary-50 p-5 dark:bg-secondary-900/20"
            >
              <div class="flex">
                <div
                  class="mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-secondary-100 text-secondary dark:bg-secondary-800"
                >
                  <Users size={20} />
                </div>
                <div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                    Join Our Team
                  </h3>
                  <p class="mt-1 text-gray-600 dark:text-gray-300">
                    Are you a professional cleaner looking for work? Join our
                    network of cleaning experts.
                  </p>
                  <div class="mt-3">
                    <Button
                      variant="secondary"
                      href="/join/cleaner"
                      class="inline-flex items-center"
                    >
                      Apply Now
                      <ExternalLink size={16} class="ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Contact Form Section -->
        <div class="md:col-span-2">
          <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <h2
              class="mb-6 text-2xl font-semibold text-gray-900 dark:text-white"
            >
              Send Us a Message
            </h2>

            {#if formSuccess}
              <div
                class="mb-6 rounded-md bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-200"
              >
                <p>
                  Thank you for your message! We'll get back to you as soon as
                  possible.
                </p>
                <button
                  class="mt-2 text-sm font-medium text-green-700 underline dark:text-green-300"
                  on:click={() => {
                    formSuccess = false;
                    resetForm();
                  }}
                >
                  Send another message
                </button>
              </div>
            {:else}
              {#if formError}
                <div
                  class="mb-6 rounded-md bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-200"
                >
                  <p>{formError}</p>
                </div>
              {/if}

              <form
                id="contact-form"
                method="POST"
                use:enhance={() => {
                  isSubmitting = true;
                  formError = null;

                  return async ({ result }) => {
                    isSubmitting = false;

                    // Process the actual server result
                    if (result.type === "success") {
                      formSuccess = true;
                    } else if (result.type === "failure") {
                      formError =
                        result.data?.error ||
                        "There was an error submitting your message. Please try again.";
                    } else if (result.type === "error") {
                      formError =
                        "A server error occurred. Please try again later.";
                    }
                  };
                }}
              >
              <HoneypotField fieldPrefix="contact" />
                <!-- Name Fields (2 columns) -->
                <div class="mb-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      for="firstName"
                      class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      First Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label
                      for="lastName"
                      class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Last Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <!-- Email & Phone (2 columns) -->
                <div class="mb-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      for="email"
                      class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Email <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label
                      for="phone"
                      class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="+27 12 345 6789"
                    />
                  </div>
                </div>

                <!-- Subject -->
                <div class="mb-6">
                  <label
                    for="subject"
                    class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Subject <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <!-- Message -->
                <div class="mb-6">
                  <label
                    for="message"
                    class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Message <span class="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    required
                    class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  ></textarea>
                </div>

                <!-- How did you hear about us -->
                <div class="mb-6">
                  <label
                    for="referral"
                    class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    How did you hear about us?
                  </label>
                  <select
                    id="referral"
                    name="referral"
                    class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Please select...</option>
                    <option value="search">Search Engine</option>
                    <option value="social">Social Media</option>
                    <option value="friend">Friend/Family</option>
                    <option value="advertisement">Advertisement</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <!-- Are you interested in joining as a cleaner? -->
                <div class="mb-6">
                  <label class="flex items-center">
                    <input
                      type="checkbox"
                      name="joinAsCleaner"
                      class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span class="ml-2 text-sm text-gray-600 dark:text-gray-300">
                      I'm interested in joining the BrightBroom team as a
                      cleaner
                    </span>
                  </label>
                </div>

                <!-- Submit Button -->
                <div>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    class="w-full md:w-auto"
                  >
                    {#if isSubmitting}
                      <svg
                        class="mr-2 h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          class="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                        ></circle>
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending...
                    {:else}
                      Send Message
                    {/if}
                  </Button>
                </div>
              </form>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
