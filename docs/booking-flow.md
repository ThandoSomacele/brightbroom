# Booking Flow

The booking flow is a core part of the BrightBroom application, allowing users to schedule cleaning services in a step-by-step process.

## Overview

The booking process consists of several steps:

1. **Service Selection**
2. **Address Selection**
3. **Scheduling**
4. **Review & Confirmation**
5. **Payment**
6. **Confirmation**

Each step is implemented as a separate route with its own form handling and validation.

## Detailed Flow

### 1. Service Selection

Users select the type of cleaning service they need:

- Regular cleaning
- Deep cleaning
- Office cleaning
- Add-on services (optional)
- Cleaning frequency (one-time, weekly, bi-weekly, monthly)

**Implementation:**

```svelte
<!-- src/routes/book/services/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Service } from '@prisma/client';

  export let data;
  const services: Service[] = data.services;
  
  let selectedService: string = '';
  let frequency: 'one-time' | 'weekly' | 'bi-weekly' | 'monthly' = 'one-time';
  
  function handleSubmit() {
    if (!selectedService) return;
    
    // Save to session or store
    localStorage.setItem('booking_service', selectedService);
    localStorage.setItem('booking_frequency', frequency);
    
    // Navigate to next step
    goto('/book/address');
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <!-- Service selection UI -->
  
  <button type="submit" disabled={!selectedService}>
    Continue
  </button>
</form>
```

```typescript
// src/routes/book/services/+page.server.ts
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async () => {
  // Fetch available services from database
  const services = await prisma.service.findMany();
  
  return {
    services
  };
};
```

### 2. Address Selection

Users select from their saved addresses or add a new one:

- Choose existing address
- Add new address
- Provide access instructions

**Implementation:**

```svelte
<!-- src/routes/book/address/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Address } from '@prisma/client';

  export let data;
  const addresses: Address[] = data.addresses;
  
  let selectedAddress: string = '';
  let accessInstructions: string = '';
  
  function handleSubmit() {
    if (!selectedAddress) return;
    
    // Save to session or store
    localStorage.setItem('booking_address', selectedAddress);
    localStorage.setItem('booking_instructions', accessInstructions);
    
    // Navigate to next step
    goto('/book/schedule');
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <!-- Address selection UI -->
  
  <button type="submit" disabled={!selectedAddress}>
    Continue
  </button>
</form>
```

```typescript
// src/routes/book/address/+page.server.ts
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();
  
  if (!session) {
    throw redirect(302, '/auth/login?redirectTo=/book/address');
  }
  
  // Fetch user's addresses
  const addresses = await prisma.address.findMany({
    where: { userId: session.user.userId }
  });
  
  return {
    addresses
  };
};
```

### 3. Scheduling

Users select the date and time for their cleaning service:

- Calendar date selection
- Time slot selection based on availability
- Duration confirmation

**Implementation:**

```svelte
<!-- src/routes/book/schedule/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { format } from 'date-fns';

  // For real app, these would come from the server
  let availableDates = [...]; // dates where service is available
  let availableTimeSlots = [...]; // time slots for the selected date
  
  let selectedDate: string = '';
  let selectedTime: string = '';
  
  function handleSubmit() {
    if (!selectedDate || !selectedTime) return;
    
    // Save to session or store
    localStorage.setItem('booking_date', selectedDate);
    localStorage.setItem('booking_time', selectedTime);
    
    // Navigate to next step
    goto('/book/review');
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <!-- Date and time selection UI -->
  
  <button type="submit" disabled={!selectedDate || !selectedTime}>
    Continue
  </button>
</form>
```

```typescript
// src/routes/book/schedule/+page.server.ts
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();
  
  if (!session) {
    throw redirect(302, '/auth/login?redirectTo=/book/schedule');
  }
  
  // Get available dates and time slots
  // This would typically involve checking cleaner availability
  const availableDates = [...]; // Generate available dates
  const timeSlots = [...]; // Available time slots
  
  return {
    availableDates,
    timeSlots
  };
};
```

### 4. Review & Confirmation

Users review their booking details before proceeding to payment:

- Service details
- Location details
- Date and time
- Price breakdown
- Special instructions

**Implementation:**

```svelte
<!-- src/routes/book/review/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';

  export let data;
  const { service, address, date, time, price } = data;
  
  function handleSubmit() {
    // Create booking in database
    fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        serviceId: service.id,
        addressId: address.id,
        scheduledDate: `${date}T${time}`,
        notes: localStorage.getItem('booking_instructions') || ''
      })
    })
    .then(res => res.json())
    .then(data => {
      // Navigate to payment with booking ID
      goto(`/payment/process?bookingId=${data.id}`);
    });
  }
</script>

<div>
  <!-- Booking summary UI -->
  
  <button on:click={handleSubmit}>
    Confirm & Pay
  </button>
</div>
```

```typescript
// src/routes/book/review/+page.server.ts
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  const session = await locals.auth.validate();
  
  if (!session) {
    throw redirect(302, '/auth/login?redirectTo=/book/review');
  }
  
  // Get booking details from previous steps (in a real app you'd use a more robust approach)
  const serviceId = cookies.get('booking_service');
  const addressId = cookies.get('booking_address');
  const date = cookies.get('booking_date');
  const time = cookies.get('booking_time');
  
  if (!serviceId || !addressId || !date || !time) {
    throw redirect(302, '/book');
  }
  
  // Fetch details from database
  const service = await prisma.service.findUnique({
    where: { id: serviceId }
  });
  
  const address = await prisma.address.findUnique({
    where: { id: addressId }
  });
  
  if (!service || !address) {
    throw error(404, 'Service or address not found');
  }
  
  return {
    service,
    address,
    date,
    time,
    price: service.basePrice
  };
};
```

### 5. Payment

Users complete payment for their booking using PayFast:

- Price confirmation
- Payment method selection
- Secure payment processing

**Implementation:**

```svelte
<!-- src/routes/payment/process/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  export let data;
  const { booking } = data;
  
  let isLoading = false;
  let paymentUrl = '';
  
  onMount(async () => {
    isLoading = true;
    
    try {
      // Get payment URL from server
      const response = await fetch('/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: booking.id
        })
      });
      
      const data = await response.json();
      paymentUrl = data.redirectUrl;
      
      // Redirect to PayFast
      window.location.href = paymentUrl;
    } catch (error) {
      console.error('Payment error:', error);
    }
  });
</script>

<div>
  <!-- Loading UI while redirecting to PayFast -->
  {#if isLoading}
    <p>Redirecting to payment gateway...</p>
    <!-- Loading spinner -->
  {/if}
</div>
```

```typescript
// src/routes/payment/process/+page.server.ts
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
  const session = await locals.auth.validate();
  
  if (!session) {
    throw redirect(302, '/auth/login?redirectTo=/payment/process');
  }
  
  const bookingId = url.searchParams.get('bookingId');
  
  if (!bookingId) {
    throw redirect(302, '/book');
  }
  
  // Fetch booking details
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      address: true
    }
  });
  
  if (!booking) {
    throw error(404, 'Booking not found');
  }
  
  // Check that the booking belongs to the logged-in user
  if (booking.userId !== session.user.userId) {
    throw error(403, 'Unauthorized');
  }
  
  return {
    booking
  };
};
```

### 6. Confirmation

After successful payment, users receive a confirmation:

- Booking details
- Confirmation number
- Receipt
- Next steps

**Implementation:**

```svelte
<!-- src/routes/payment/success/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  
  export let data;
  const { booking } = data;
</script>

<div>
  <h1>Booking Confirmed!</h1>
  
  <!-- Booking confirmation details -->
  <div>
    <h2>Booking Details</h2>
    <p>Service: {booking.service.name}</p>
    <p>Date: {new Date(booking.scheduledDate).toLocaleDateString()}</p>
    <p>Time: {new Date(booking.scheduledDate).toLocaleTimeString()}</p>
    <p>Address: {booking.address.street}, {booking.address.city}</p>
    <p>Amount Paid: R{booking.price}</p>
  </div>
  
  <!-- Success message and next steps -->
</div>
```

```typescript
// src/routes/payment/success/+page.server.ts
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
  const session = await locals.auth.validate();
  
  if (!session) {
    throw redirect(302, '/auth/login');
  }
  
  // Get booking ID from PayFast return params
  const bookingId = url.searchParams.get('booking_id');
  
  if (!bookingId) {
    throw redirect(302, '/profile/bookings');
  }
  
  // Fetch booking with related data
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      address: true,
      payment: true
    }
  });
  
  if (!booking) {
    throw error(404, 'Booking not found');
  }
  
  return {
    booking
  };
};
```

## State Management

Throughout the booking flow, state is managed using a combination of:

1. **Local Storage**: For temporary storage of user selections
2. **URL Parameters**: For passing IDs between pages
3. **Server-Side State**: For managing booking data securely
4. **Svelte Stores**: For cross-component state when needed

## Success and Error Handling

- Proper validation at each step
- Friendly error messages
- Progress saving (ability to resume booking)
- Timeout handling for payment process
- Confirmation emails after successful booking
