<!-- src/routes/join/cleaner/+page.svelte -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import Button from "$lib/components/ui/Button.svelte";
  
  // Get data from server load function (services list)
  export let data;
  export let form;
  
  // Form state
  let isLoading = false;
  let submitted = false;
  let selectedServices = new Map();
  
  // Initialize service selection
  $: {
    if (data.services) {
      data.services.forEach(service => {
        if (!selectedServices.has(service.id)) {
          selectedServices.set(service.id, {
            selected: false,
            experience: 0
          });
        }
      });
    }
  }
  
  // Toggle service selection
  function toggleService(serviceId: string) {
    if (selectedServices.has(serviceId)) {
      const current = selectedServices.get(serviceId);
      selectedServices.set(serviceId, {
        ...current,
        selected: !current.selected
      });
      // Force reactivity by creating a new map
      selectedServices = new Map(selectedServices);
    }
  }
  
  // Update service experience
  function updateExperience(serviceId: string, months: number) {
    if (selectedServices.has(serviceId)) {
      const current = selectedServices.get(serviceId);
      selectedServices.set(serviceId, {
        ...current,
        experience: months
      });
    }
  }
</script>

<svelte:head>
  <title>Join Our Cleaner Team | BrightBroom</title>
  <meta name="description" content="Apply to join our team of professional cleaners at BrightBroom." />
</svelte:head>

<!-- Header section -->
<section class="py-12 bg-gray-50 dark:bg-gray-800">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
    <div class="text-center">
      <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
        Join Our Cleaner Team
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
        Become a BrightBroom professional cleaner and take control of your schedule while providing exceptional service to our customers.
      </p>
    </div>
  </div>
</section>

<!-- If form submission is successful -->
{#if form?.success || submitted}
  <section class="py-16 bg-white dark:bg-gray-900">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
      <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Application Submitted Successfully!
        </h2>
        
        <p class="text-gray-600 dark:text-gray-300 mb-6">
          Thank you for applying to join the BrightBroom cleaning team. Our team will review your application and contact you within 2-3 business days.
        </p>
        
        <div class="flex flex-col sm:flex-row justify-center gap-4">
          <Button variant="primary" href="/">
            Return to Home Page
          </Button>
          
          <Button variant="outline" href="/contact">
            Contact Us
          </Button>
        </div>
      </div>
    </div>
  </section>
{:else}
  <!-- Application Form -->
  <section class="py-12 bg-white dark:bg-gray-900">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
      <!-- Error message -->
      {#if form?.error}
        <div class="mb-6 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 p-4 rounded-md">
          {form.error}
        </div>
      {/if}
      
      <!-- Form card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
        <form 
          method="POST" 
          action="?/apply"
          use:enhance={() => {
            isLoading = true;
            
            return async ({ result, update }) => {
              isLoading = false;
              await update();
              
              if (result.type === "success") {
                submitted = true;
                window.scrollTo(0, 0);
              }
            };
          }}
        >
          <div class="p-6">
            <div class="mb-8">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Personal Information
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Tell us about yourself. Fields marked with * are required.
              </p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- First Name -->
              <div>
                <label for="firstName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  value={form?.data?.firstName || ''}
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <!-- Last Name -->
              <div>
                <label for="lastName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  value={form?.data?.lastName || ''}
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <!-- Email -->
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={form?.data?.email || ''}
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <!-- Phone -->
              <div>
                <label for="phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={form?.data?.phone || ''}
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <!-- Password -->
              <div>
                <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Create Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  minlength="8"
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <!-- Confirm Password -->
              <div>
                <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  minlength="8"
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            
            <div class="mt-10 mb-8">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                ID Verification
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                For security and verification purposes, we need your ID information.
              </p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- ID Type -->
              <div>
                <label for="idType" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ID Type *
                </label>
                <select
                  id="idType"
                  name="idType"
                  required
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="SOUTH_AFRICAN_ID">South African ID</option>
                  <option value="PASSPORT">Passport</option>
                </select>
              </div>
              
              <!-- ID Number -->
              <div>
                <label for="idNumber" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ID Number *
                </label>
                <input
                  type="text"
                  id="idNumber"
                  name="idNumber"
                  required
                  value={form?.data?.idNumber || ''}
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            
            <div class="mt-10 mb-8">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Work Information
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Tell us about your location and preferences.
              </p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Work Address -->
              <div class="md:col-span-2">
                <label for="workAddress" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Home/Work Address *
                </label>
                <input
                  type="text"
                  id="workAddress"
                  name="workAddress"
                  required
                  value={form?.data?.workAddress || ''}
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Your full address"
                />
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Used to calculate job distances. We'll never share your exact address.
                </p>
              </div>
              
              <!-- Work Radius -->
              <div>
                <label for="workRadius" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  How far are you willing to travel? (km) *
                </label>
                <input
                  type="number"
                  id="workRadius"
                  name="workRadius"
                  min="1"
                  max="100"
                  required
                  value={form?.data?.workRadius || '10'}
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <!-- Pet Compatibility -->
              <div>
                <label for="petCompatibility" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Are you comfortable working with pets? *
                </label>
                <select
                  id="petCompatibility"
                  name="petCompatibility"
                  required
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="NONE">No pets please</option>
                  <option value="DOGS">Dogs only</option>
                  <option value="CATS">Cats only</option>
                  <option value="BOTH">Both dogs and cats are fine</option>
                </select>
              </div>
            </div>
            
            <!-- Bio -->
            <div class="mt-6">
              <label for="bio" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tell us about yourself
              </label>
              <textarea
                id="bio"
                name="bio"
                rows="4"
                class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Share your relevant experience, why you want to join our team, or anything else you'd like us to know"
              ></textarea>
            </div>
            
            <!-- Available Days -->
            <div class="mt-6">
              <span class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Which days are you available to work? *
              </span>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {#each ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as day}
                  <label class="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      name={`day-${day}`} 
                      id={`day-${day}`}
                      class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={form?.data?.availableDays?.includes(day) || false}
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300">
                      {day.charAt(0) + day.slice(1).toLowerCase()}
                    </span>
                  </label>
                {/each}
              </div>
            </div>
            
            <div class="mt-10 mb-8">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Services & Experience
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Select the services you can provide and your experience level.
              </p>
            </div>
            
            <div class="space-y-4">
              {#each data.services as service}
                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div class="flex items-start">
                    <input
                      type="checkbox"
                      id={`service-${service.id}`}
                      name="serviceId"
                      value={service.id}
                      checked={selectedServices.get(service.id)?.selected}
                      on:change={() => toggleService(service.id)}
                      class="h-4 w-4 mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div class="ml-3 flex-1">
                      <label
                        for={`service-${service.id}`}
                        class="text-gray-900 dark:text-white font-medium"
                      >
                        {service.name}
                      </label>
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        {service.description}
                      </p>

                      {#if selectedServices.get(service.id)?.selected}
                        <div class="mt-2">
                          <label
                            for={`experience-${service.id}`}
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            How many months of experience do you have with this service?
                          </label>
                          <input
                            type="number"
                            id={`experience-${service.id}`}
                            name={`experience-${service.id}`}
                            value={selectedServices.get(service.id)?.experience || 0}
                            on:input={(e) => updateExperience(service.id, parseInt(e.target.value))}
                            min="0"
                            class="w-full sm:w-1/3 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
            
            <!-- Terms and Conditions -->
            <div class="mt-8">
              <label class="flex items-start space-x-2">
                <input 
                  type="checkbox" 
                  name="termsAccepted" 
                  id="termsAccepted"
                  required
                  class="h-4 w-4 mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">
                  I agree to the <a href="/terms" class="text-primary hover:underline">Terms of Service</a> and <a href="/privacy" class="text-primary hover:underline">Privacy Policy</a>. I understand that my application will be reviewed by BrightBroom staff, and I may be contacted for additional information or an interview.
                </span>
              </label>
            </div>
          </div>
          
          <!-- Form Actions -->
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end space-x-3">
            <Button type="submit" variant="primary" disabled={isLoading} class="w-full sm:w-auto">
              {#if isLoading}
                <div class="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></div>
                Submitting...
              {:else}
                Submit Application
              {/if}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </section>
  
  <!-- Benefits Section -->
  <section class="py-12 bg-gray-50 dark:bg-gray-800">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white text-center mb-12">
        Why Join BrightBroom?
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Benefit 1 -->
        <div class="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 text-center">
          <div class="w-16 h-16 mx-auto bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Flexible Schedule
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            Work when it suits you. Set your own availability and work hours that fit your lifestyle.
          </p>
        </div>
        
        <!-- Benefit 2 -->
        <div class="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 text-center">
          <div class="w-16 h-16 mx-auto bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Competitive Pay
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            Earn competitive rates plus tips. Get paid weekly with transparent payment processing.
          </p>
        </div>
        
        <!-- Benefit 3 -->
        <div class="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 text-center">
          <div class="w-16 h-16 mx-auto bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Career Growth
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            Access training opportunities, build your reputation, and grow your client base with our platform.
          </p>
        </div>
      </div>
    </div>
  </section>
  
  <!-- FAQ Section -->
  <section class="py-12 bg-white dark:bg-gray-900">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
        Frequently Asked Questions
      </h2>
      
      <div class="space-y-6">
        <!-- FAQ Item 1 -->
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            What happens after I submit my application?
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            Our team will review your application within 2-3 business days. If your profile meets our requirements, we'll reach out to schedule a video interview and discuss the next steps.
          </p>
        </div>
        
        <!-- FAQ Item 2 -->
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            What equipment or supplies do I need?
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            BrightBroom customers provide all necessary cleaning supplies and equipment. You just need reliable transportation to get to your jobs and a smartphone to use our app.
          </p>
        </div>
        
        <!-- FAQ Item 3 -->
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            How does scheduling work?
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            You set your availability in the app, and you'll be notified of booking requests that match your schedule and location. You can accept or decline jobs based on your preferences.
          </p>
        </div>
        
        <!-- FAQ Item 4 -->
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            How and when do I get paid?
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            Payments are processed weekly for all completed jobs. Funds are transferred directly to your bank account, and you can track your earnings in real-time through the app.
          </p>
        </div>
      </div>
    </div>
  </section>
{/if}
