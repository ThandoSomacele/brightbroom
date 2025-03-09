# Payment Processing

BrightBroom uses PayFast, a South African payment gateway, for processing payments securely.

## PayFast Integration

### Why PayFast?

PayFast is an ideal payment gateway choice for BrightBroom because:

1. **South African Focus**: Designed specifically for South African businesses
2. **Multiple Payment Methods**: Supports credit cards, debit cards, instant EFT, Mobicred, Snapscan, Zapper
3. **Easy Integration**: Well-documented API and development tools
4. **Competitive Fees**: Starts at 3.5% + R2.00 per transaction
5. **Local Support**: Based in South Africa with local customer service
6. **Secure**: PCI DSS Level 1 compliant

### Setup Requirements

To integrate PayFast, you'll need:

1. **PayFast Merchant Account**: Register at [PayFast.co.za](https://www.payfast.co.za/)
2. **API Credentials**:
   - Merchant ID
   - Merchant Key
   - Passphrase (for secure signature generation)
3. **Environment Variables**:
   ```
   VITE_PAYFAST_MERCHANT_ID=your_merchant_id
   VITE_PAYFAST_MERCHANT_KEY=your_merchant_key
   VITE_PAYFAST_PASSPHRASE=your_passphrase
   VITE_APP_URL=your_app_url
   ```

## Integration Architecture

### Payment Flow

1. **Initiation**: User completes booking and proceeds to payment
2. **Payment Creation**: Server creates a payment record and generates PayFast URL
3. **Redirect**: User is redirected to PayFast to complete payment
4. **Instant Payment Notification (IPN)**: PayFast notifies BrightBroom of payment status
5. **Confirmation**: User is redirected back to BrightBroom with payment status

### Implementation

#### 1. Payment Service

```typescript
// src/lib/server/payment.ts
import { PrismaClient, type Booking, type Payment } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Environment variables
const PAYFAST_MERCHANT_ID = import.meta.env.VITE_PAYFAST_MERCHANT_ID;
const PAYFAST_MERCHANT_KEY = import.meta.env.VITE_PAYFAST_MERCHANT_KEY;
const PAYFAST_PASSPHRASE = import.meta.env.VITE_PAYFAST_PASSPHRASE;
const PAYFAST_URL = import.meta.env.DEV 
  ? 'https://sandbox.payfast.co.za/eng/process'
  : 'https://www.payfast.co.za/eng/process';
const RETURN_URL = import.meta.env.VITE_APP_URL + '/payment/success';
const CANCEL_URL = import.meta.env.VITE_APP_URL + '/payment/cancel';
const NOTIFY_URL = import.meta.env.VITE_APP_URL + '/api/payments/ipn';

interface PayFastPaymentData {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  name_first: string;
  name_last: string;
  email_address: string;
  m_payment_id: string;
  amount: string;
  item_name: string;
  item_description?: string;
  custom_str1?: string;
  custom_str2?: string;
  custom_str3?: string;
  custom_str4?: string;
  custom_str5?: string;
  custom_int1?: string;
  custom_int2?: string;
  custom_int3?: string;
  custom_int4?: string;
  custom_int5?: string;
}

export async function createPaymentForBooking(
  bookingId: string
): Promise<{ paymentId: string; redirectUrl: string }> {
  // Get booking with user information
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: true,
      service: true,
    },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      userId: booking.userId,
      bookingId: booking.id,
      amount: booking.price,
      status: 'PENDING',
      merchantReference: `BrightBroom-${booking.id}`,
    },
  });

  // Generate PayFast URL
  const redirectUrl = await generatePayFastUrl(booking, payment);

  return {
    paymentId: payment.id,
    redirectUrl,
  };
}

async function generatePayFastUrl(
  booking: Booking & { user: { firstName: string; lastName: string; email: string }; service: { name: string } },
  payment: Payment
): Promise<string> {
  // Format amount to 2 decimal places as required by PayFast
  const formattedAmount = Number(booking.price).toFixed(2);

  // Create data object for PayFast
  const data: PayFastPaymentData = {
    merchant_id: PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,
    return_url: RETURN_URL,
    cancel_url: CANCEL_URL,
    notify_url: NOTIFY_URL,
    name_first: booking.user.firstName,
    name_last: booking.user.lastName,
    email_address: booking.user.email,
    m_payment_id: payment.id,
    amount: formattedAmount,
    item_name: `BrightBroom ${booking.service.name}`,
    item_description: `Cleaning service scheduled for ${booking.scheduledDate.toISOString().split('T')[0]}`,
    custom_str1: booking.id, // Store booking ID for reference
  };

  // Generate signature
  const signature = generateSignature(data, PAYFAST_PASSPHRASE);
  
  // Create URL with query parameters
  const queryParams = new URLSearchParams({
    ...data,
    signature
  }).toString();

  return `${PAYFAST_URL}?${queryParams}`;
}

function generateSignature(data: Record<string, string>, passphrase: string | null = null): string {
  // Create parameter string
  let pfOutput = '';
  
  // Sort the data object by key
  const keys = Object.keys(data).sort();
  
  // Build output string
  keys.forEach(key => {
    if (data[key] !== '' && key !== 'signature') {
      pfOutput += `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}&`;
    }
  });

  // Remove last ampersand
  pfOutput = pfOutput.slice(0, -1);

  // Add passphrase if provided
  if (passphrase !== null) {
    pfOutput += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`;
  }

  // Generate MD5 hash
  return crypto.createHash('md5').update(pfOutput).digest('hex');
}

export async function validateIpnRequest(
  pfData: Record<string, string>, 
  pfParamString: string
): Promise<boolean> {
  const pfHost = 'sandbox.payfast.co.za';
  
  // Verify security signature
  const passPhrase = PAYFAST_PASSPHRASE;
  const pfParamsToInclude = { ...pfData };
  
  // Remove signature from data to verify
  delete pfParamsToInclude.signature;
  
  // Regenerate signature
  const signature = generateSignature(pfParamsToInclude, passPhrase);
  
  if (pfData.signature !== signature) {
    console.error('Signature validation failed');
    return false;
  }

  // Verify data with PayFast server
  const verifyUrl = `https://${pfHost}/eng/query/validate`;
  
  try {
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: pfParamString
    });
    
    const text = await response.text();
    
    if (text !== 'VALID') {
      console.error('PayFast validation failed');
      return false;
    }
  } catch (error) {
    console.error('Error validating with PayFast server', error);
    return false;
  }

  return true;
}

export async function processSuccessfulPayment(paymentId: string): Promise<void> {
  // Update payment status to completed
  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: 'COMPLETED' }
  });

  // Update associated booking status
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { bookingId: true }
  });

  if (payment) {
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'CONFIRMED' }
    });
  }
}
```

#### 2. Payment Processing API Endpoint

```typescript
// src/routes/api/payments/process/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createPaymentForBooking } from '$lib/server/payment';

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = await locals.auth.validate();
  
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { bookingId } = await request.json();
    
    if (!bookingId) {
      return json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const result = await createPaymentForBooking(bookingId);
    
    return json(result);
  } catch (error) {
    console.error('Payment processing error:', error);
    return json({ error: 'Failed to process payment' }, { status: 500 });
  }
};
```

#### 3. Instant Payment Notification (IPN) Handler

```typescript
// src/routes/api/payments/ipn/+server.ts
import { validateIpnRequest, processSuccessfulPayment } from '$lib/server/payment';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  // Read form data from PayFast IPN
  const formData = await request.formData();
  
  // Convert FormData to plain object
  const pfData: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    pfData[key] = value.toString();
  }
  
  // Get original query string for validation
  const pfParamString = new URLSearchParams(pfData).toString();
  
  try {
    // Validate the request is from PayFast
    const isValid = await validateIpnRequest(pfData, pfParamString);
    
    if (!isValid) {
      console.error('Invalid IPN request');
      return new Response('Invalid request', { status: 400 });
    }
    
    // Check payment status
    if (pfData.payment_status === 'COMPLETE') {
      // Update payment and booking status
      await processSuccessfulPayment(pfData.m_payment_id);
    }
    
    return new Response('OK');
  } catch (error) {
    console.error('Error processing IPN:', error);
    return new Response('Server error', { status: 500 });
  }
};
```

#### 4. Payment Success Page

```svelte
<!-- src/routes/payment/success/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { CheckCircle } from 'lucide-svelte';
  
  export let data;
  
  // Get booking details based on URL params
  let bookingId = $page.url.searchParams.get('booking_id');
  let isLoading = true;
  let booking: any = null;
  let error = '';
  
  onMount(async () => {
    if (!bookingId) {
      error = 'No booking information found.';
      isLoading = false;
      return;
    }
    
    try {
      // Fetch booking details
      const response = await fetch(`/api/bookings/${bookingId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch booking details');
      }
      
      booking = await response.json();
      isLoading = false;
    } catch (e) {
      console.error('Error fetching booking:', e);
      error = 'Error retrieving booking information.';
      isLoading = false;
    }
  });
</script>

<!-- Success UI content -->
```

## Security Considerations

### Preventing Fraud

1. **Signature Validation**: Verify all PayFast communications with a secure signature
2. **IPN Verification**: Validate all IPN callbacks with PayFast's server
3. **IP Validation**: In production, check that IPN requests come from PayFast IP addresses
4. **Duplicate Payment Prevention**: Check for duplicate transaction IDs

### Data Protection

1. **No Storage of Payment Details**: PayFast handles all card details
2. **Secure Communication**: All requests use HTTPS
3. **Environment Variables**: Sensitive credentials stored as environment variables
4. **API Key Security**: Keys never exposed to client-side code

## Error Handling

### Common Scenarios

1. **Payment Failure**: Handle declined payments gracefully
2. **Connection Issues**: Implement retry mechanisms for API calls
3. **IPN Timeout**: Design system to work even if IPN is delayed
4. **Reconciliation**: Daily reconciliation with PayFast merchant reports

### User Experience

1. **Clear Error Messages**: User-friendly error messages without technical details
2. **Payment Retry**: Allow users to retry failed payments
3. **Support Contact**: Provide support contact for payment issues
4. **Email Notifications**: Send email confirmations for successful payments

## Testing

### Test Environment

PayFast provides a sandbox environment for testing:

1. **Sandbox URL**: https://sandbox.payfast.co.za/
2. **Test Credentials**: Use sandbox merchant credentials
3. **Test Cards**: Use PayFast's test card numbers for different scenarios

### Test Scenarios

1. **Successful Payment**: Test complete payment flow
2. **Failed Payment**: Test declined card scenarios
3. **Cancelled Payment**: Test user cancellation flow
4. **IPN Handling**: Test server-to-server notification processing
5. **Error Cases**: Test various error conditions and recovery
