<!-- src/routes/profile/+page.svelte -->
<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import { Calendar, Clock, MapPin, Settings, User } from 'lucide-svelte';
  
  // Get data from the server load function
  export let data;
  const { user, upcomingBookings } = data;
</script>

<svelte:head>
  <title>My Profile | BrightBroom</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
  <div class="mx-auto max-w-6xl">
    <!-- Profile header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-300">
        Welcome back, {user.firstName}! Manage your account and bookings here.
      </p>
    </div>
    
    <!-- Main content grid -->
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <!-- Left column: User info -->
      <div>
        <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <div class="mb-6 flex items-center">
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary dark:bg-primary-900/20">
              <User size={32} />
            </div>
            <div class="ml-4">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
          
          <div class="mb-6 border-t border-gray-200 pt-6 dark:border-gray-700">
            <h3 class="mb-3 text-lg font-medium text-gray-900 dark:text-white">Account Information</h3>
            
            <div class="space-y-3">
              {#if user.phone}
                <div>
                  <span class="block text-sm font-medium text-gray-500 dark:text-gray-400">Phone</span>
                  <span class="text-gray-800 dark:text-gray-200">{user.phone}</span>
                </div>
              {/if}
              
              <div>
                <span class="block text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</span>
                <span class="text-gray-800 dark:text-gray-200">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div>
                <span class="block text-sm font-medium text-gray-500 dark:text-gray-400">Account Type</span>
                <span class="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-sm font-medium text-primary dark:bg-primary-900/20">
                  {user.role === 'CUSTOMER' ? 'Customer' : 
                   user.role === 'CLEANER' ? 'Cleaner' : 'Administrator'}
                </span>
              </div>
            </div>
          </div>
          
          <div class="space-y-3">
            <Button variant="outline" href="/profile/edit" class="w-full justify-start">
              <Settings size={18} class="mr-2" />
              Edit Profile
            </Button>
            
            <Button variant="outline" href="/profile/addresses" class="w-full justify-start">
              <MapPin size={18} class="mr-2" />
              Manage Addresses
            </Button>
            
            <form method="POST" action="/auth/logout">
              <Button variant="ghost" type="submit" class="w-full justify-start text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </div>
      
      <!-- Right column: Bookings and quick actions -->
      <div class="lg:col-span-2">
        <!-- Quick Actions -->
        <div class="mb-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Quick Actions</h2>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Button variant="secondary" href="/book" class="flex h-auto flex-col items-center justify-center p-6">
              <Calendar size={32} class="mb-3" />
              <span class="text-lg font-medium">Book Now</span>
              <span class="mt-1 text-sm text-white/80">Schedule your next service</span>
            </Button>

            <Button variant="secondary" href="/profile/bookings" class="flex h-auto flex-col items-center justify-center p-6">
              <Clock size={32} class="mb-3" />
              <span class="text-lg font-medium">View Bookings</span>
              <span class="mt-1 text-sm text-white/80">Manage your appointments</span>
            </Button>

            <Button variant="secondary" href="/profile/subscriptions" class="flex h-auto flex-col items-center justify-center p-6">
              <svg xmlns="http://www.w3.org/2000/svg" class="mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
              </svg>
              <span class="text-lg font-medium">Subscriptions</span>
              <span class="mt-1 text-sm text-white/80">Manage recurring services</span>
            </Button>
          </div>
        </div>
        
        <!-- Upcoming Bookings -->
        <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Upcoming Bookings</h2>
            
            <Button variant="outline" size="sm" href="/profile/bookings">
              View All
            </Button>
          </div>
          
          {#if upcomingBookings && upcomingBookings.length > 0}
            <div class="space-y-4">
              {#each upcomingBookings as booking}
                <div class="rounded-lg border border-gray-200 p-4 transition-all hover:border-primary-200 dark:border-gray-700 dark:hover:border-primary-800">
                  <div class="flex items-start justify-between">
                    <div>
                      <h3 class="font-medium text-gray-900 dark:text-white">{booking.service.name}</h3>
                      <p class="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <MapPin size={14} class="mr-1" />
                        {booking.address.street}, {booking.address.city}
                      </p>
                      <p class="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar size={14} class="mr-1" />
                        {new Date(booking.scheduledDate).toLocaleDateString()} at 
                        {new Date(booking.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    <div class="text-right">
                      <span class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                        ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 
                          booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' : 
                          'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'}`}
                      >
                        {booking.status}
                      </span>
                      
                      <p class="mt-2 text-lg font-bold text-primary">
                        R{typeof booking.price === 'number' 
                            ? booking.price.toFixed(2) 
                            : parseFloat(booking.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div class="mt-3 flex justify-end">
                    <Button variant="outline" size="sm" href={`/profile/bookings/${booking.id}`}>
                      View Details
                    </Button>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
              <p class="text-gray-500 dark:text-gray-400">You don't have any upcoming bookings.</p>
              <Button variant="secondary" href="/book" class="mt-4">
                Book Now
              </Button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
