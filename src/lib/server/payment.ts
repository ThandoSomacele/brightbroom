// src/lib/server/payment.ts
import { db } from '$lib/server/db';
import { booking, payment, user, service, type Payment } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Environment variables - these should be set in your .env file
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
  const [bookingData] = await db.select()
    .from(booking)
    .where(eq(booking.id, bookingId))
    .limit(1);

  if (!bookingData) {
    throw new Error('Booking not found');
  }

  // Get user and service data
  const [userData] = await db.select().from(user).where(eq(user.id, bookingData.userId)).limit(1);
  const [serviceData] = await db.select().from(service).where(eq(service.id, bookingData.serviceId)).limit(1);

  if (!userData || !serviceData) {
    throw new Error('User or service not found');
  }

  // Create payment record
  const paymentId = crypto.randomUUID();
  const [newPayment] = await db.insert(payment).values({
    id: paymentId,
    userId: bookingData.userId,
    bookingId: bookingData.id,
    amount: bookingData.price,
    status: 'PENDING',
    merchantReference: `BrightBroom-${bookingData.id}`,
  }).returning();

  // Generate PayFast URL
  const redirectUrl = await generatePayFastUrl(bookingData, userData, serviceData, newPayment);

  return {
    paymentId: paymentId,
    redirectUrl,
  };
}

async function generatePayFastUrl(
  bookingData: any,
  userData: any,
  serviceData: any,
  paymentData: Payment
): Promise<string> {
  // Format amount to 2 decimal places as required by PayFast
  const formattedAmount = Number(bookingData.price).toFixed(2);

  // Create data object for PayFast
  const data: PayFastPaymentData = {
    merchant_id: PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,
    return_url: RETURN_URL,
    cancel_url: CANCEL_URL,
    notify_url: NOTIFY_URL,
    name_first: userData.firstName,
    name_last: userData.lastName,
    email_address: userData.email,
    m_payment_id: paymentData.id,
    amount: formattedAmount,
    item_name: `BrightBroom ${serviceData.name}`,
    item_description: `Cleaning service scheduled for ${bookingData.scheduledDate.toISOString().split('T')[0]}`,
    custom_str1: bookingData.id, // Store booking ID for reference
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

// Rest of the functions remain largely the same, just updated to use Drizzle
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
  await db.update(payment)
    .set({ status: 'COMPLETED' })
    .where(eq(payment.id, paymentId));

  // Update associated booking status
  const [paymentData] = await db.select()
    .from(payment)
    .where(eq(payment.id, paymentId))
    .limit(1);

  if (paymentData) {
    await db.update(booking)
      .set({ status: 'CONFIRMED' })
      .where(eq(booking.id, paymentData.bookingId));
  }
}
