<!-- src/routes/book/payment/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';
  import type { ActionData } from './$types';
  
  export let data: PageData;
  export let form: ActionData;
  
  let showLoginForm = false;
  let showSignupForm = false;
  let isSubmitting = false;
  
  // Show login form if there's a login error
  $: if (form?.error) {
    showLoginForm = true;
    showSignupForm = false;
  }
  
  // Removed continueAsGuest function - users must login or signup
  
  function showLogin() {
    showLoginForm = true;
    showSignupForm = false;
  }
  
  function showSignup() {
    showSignupForm = true;
    showLoginForm = false;
  }
  
  function hideAuthForms() {
    showLoginForm = false;
    showSignupForm = false;
  }
</script>

<svelte:head>
  <title>Payment Options - BrightBroom</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-2xl">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">Complete Your Booking</h1>
    <p class="text-gray-600">Please login or create an account to complete your booking</p>
  </div>
  
  <!-- Booking Summary -->
  <div class="bg-white rounded-lg shadow-md p-6 mb-8">
    <h2 class="text-xl font-semibold mb-4">Booking Summary</h2>
    
    {#if data.bookingData}
      <div class="space-y-3">
        <div class="flex justify-between">
          <span class="text-gray-600">Service:</span>
          <span class="font-medium">{data.bookingData.serviceName}</span>
        </div>
        
        <div class="flex justify-between">
          <span class="text-gray-600">Date & Time:</span>
          <span class="font-medium">{new Date(data.bookingData.scheduledDate).toLocaleString()}</span>
        </div>
        
        <div class="flex justify-between">
          <span class="text-gray-600">Duration:</span>
          <span class="font-medium">{Math.floor(data.bookingData.duration / 60)} hours</span>
        </div>
        
        {#if data.bookingData.guestAddress}
          <div class="flex justify-between">
            <span class="text-gray-600">Location:</span>
            <span class="font-medium">
              {data.bookingData.guestAddress.street}, {data.bookingData.guestAddress.city}
            </span>
          </div>
        {/if}
        
        <div class="border-t pt-3 mt-3">
          <div class="flex justify-between text-lg font-semibold">
            <span>Total:</span>
            <span class="text-primary">R{data.bookingData.servicePrice}</span>
          </div>
        </div>
      </div>
    {:else}
      <p class="text-gray-500">No booking data found. Please start a new booking.</p>
    {/if}
  </div>
  
  <!-- Authentication Options -->
  <div class="bg-white rounded-lg shadow-md p-6">
    <h2 class="text-xl font-semibold mb-6">Choose Your Option</h2>
    
    {#if !showLoginForm && !showSignupForm}
      <div class="space-y-4">
        <!-- Login -->
        <div class="border-2 border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
          <h3 class="font-semibold text-lg mb-2">Login to Your Account</h3>
          <p class="text-gray-600 mb-4">
            Access your saved addresses and booking history by logging in.
          </p>
          <button
            on:click={showLogin}
            class="w-full bg-primary-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
          >
            Login
          </button>
        </div>
        
        <!-- Signup -->
        <div class="border-2 border-gray-200 rounded-lg p-4 hover:border-secondary-300 transition-colors">
          <h3 class="font-semibold text-lg mb-2">Create an Account</h3>
          <p class="text-gray-600 mb-4">
            Save your details for faster future bookings and track your cleaning history.
          </p>
          <button
            on:click={showSignup}
            class="w-full bg-secondary-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-secondary-600 transition-colors"
          >
            Create Account
          </button>
        </div>
      </div>
    {/if}
    
    <!-- Login Form -->
    {#if showLoginForm}
      <div class="space-y-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Login to Your Account</h3>
          <button
            on:click={hideAuthForms}
            class="text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
        </div>
        
        <form
          method="POST"
          action="?/login"
          use:enhance={() => {
            isSubmitting = true;
            return ({ result, update }) => {
              isSubmitting = false;
              if (result.type === 'redirect') {
                // Let SvelteKit handle the redirect
                return;
              }
              // Update the form to show validation errors
              update();
            };
          }}
        >
          <input type="hidden" name="redirectTo" value={data.bookingId ? `/payment/process?bookingId=${data.bookingId}` : '/payment/process'} />
          
          <!-- Error message display -->
          {#if form?.error}
            <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div class="flex items-center">
                <svg class="w-4 h-4 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-sm font-medium text-red-800">Login Error:</span>
              </div>
              <p class="text-sm text-red-700 mt-1">{form.error}</p>
            </div>
          {/if}
          
          <div class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={form?.email || ''}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              class="w-full bg-primary-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Logging in...' : 'Login & Continue to Payment'}
            </button>
          </div>
        </form>
      </div>
    {/if}
    
    <!-- Signup Form -->
    {#if showSignupForm}
      <div class="space-y-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Create Your Account</h3>
          <button
            on:click={hideAuthForms}
            class="text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
        </div>
        
        <form
          method="POST"
          action="/auth/register"
          use:enhance={() => {
            isSubmitting = true;
            return ({ result }) => {
              isSubmitting = false;
              if (result.type === 'redirect') {
                const redirectUrl = data.bookingId ? `/payment/process?bookingId=${data.bookingId}` : '/payment/process';
                goto(redirectUrl);
              }
            };
          }}
        >
          <input type="hidden" name="redirectTo" value={data.bookingId ? `/payment/process?bookingId=${data.bookingId}` : '/payment/process'} />
          
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
              <div>
                <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            </div>
            
            <div>
              <label for="signup-email" class="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="signup-email"
                name="email"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            
            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            
            <div>
              <label for="signup-password" class="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="signup-password"
                name="password"
                required
                minlength="8"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            
            <div class="flex items-center">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                required
                class="h-4 w-4 text-secondary border-gray-300 rounded focus:ring-secondary"
              />
              <label for="terms" class="ml-2 block text-sm text-gray-700">
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              class="w-full bg-secondary-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-secondary-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account & Continue to Payment'}
            </button>
          </div>
        </form>
      </div>
    {/if}
  </div>
  
  <!-- Security Notice -->
  <div class="mt-6 p-4 bg-gray-50 rounded-lg">
    <p class="text-sm text-gray-600 text-center">
      🔒 Your payment information is processed securely. We never store your payment details.
    </p>
  </div>
</div>