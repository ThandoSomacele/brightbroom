// src/lib/server/payment.ts
import { db } from "$lib/server/db";
import { booking, payment, service, user, type Payment } from "$lib/server/db/schema";
import { payFastPassphrase, payFastSandbox } from "$lib/server/payfast-itn";
import { signedCheckoutQuery, type CheckoutData } from "$lib/server/payfast-signature";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { env } from "$env/dynamic/private";
import { parseDateTimeString } from "$lib/utils/date-utils";
import { brand } from "$lib/config/brand";

// PayFast credentials come from the environment only. Each deployment (one per
// cleaning company) takes payments into its own PayFast account, so a built-in
// fallback would quietly send one company's money to another's account.
// Read on use rather than at import, so a build without PayFast env vars still
// succeeds and only creating a payment fails.
function getPayFastCredentials(): {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
} {
  const merchantId = env.PAYFAST_MERCHANT_ID ?? "";
  const merchantKey = env.PAYFAST_MERCHANT_KEY ?? "";
  if (!merchantId.trim() || !merchantKey.trim()) {
    throw new Error(
      "PayFast is not configured: set PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY (and PAYFAST_PASSPHRASE if the PayFast account has one)",
    );
  }
  return { merchantId, merchantKey, passphrase: payFastPassphrase() };
}

// Determine if we should use sandbox mode (default to true in development)
const USE_SANDBOX = payFastSandbox();

// Set appropriate PayFast URL based on environment
const PAYFAST_URL = USE_SANDBOX
  ? "https://sandbox.payfast.co.za/eng/process"
  : "https://www.payfast.co.za/eng/process";

// Default fallback base URL - only used if no origin is provided
const DEFAULT_BASE_URL = import.meta.env.VITE_APP_URL || brand.siteUrl;

// Log payment configuration on startup
console.log("PayFast Configuration:");
console.log(`- Using ${USE_SANDBOX ? "SANDBOX" : "PRODUCTION"} mode`);

/** "BrightBroom" by default; the brand name with anything but letters and digits removed */
function merchantReferencePrefix(): string {
  return brand.name.replace(/[^A-Za-z0-9]/g, "") || "Booking";
}

/**
 * Create a payment for a booking and generate PayFast redirect URL
 * @param bookingId The ID of the booking to create a payment for
 * @param options Additional options including origin URL
 * @returns The payment ID and redirect URL for PayFast
 */
export async function createPaymentForBooking(
  bookingId: string,
  options: { origin?: string } = {},
): Promise<{ paymentId: string; redirectUrl: string }> {
  try {
    console.log(`Creating payment for booking: ${bookingId}`);

    // Fail before writing a PENDING payment row if PayFast isn't set up
    getPayFastCredentials();

    // Get the origin from options or use default
    const origin = options.origin || DEFAULT_BASE_URL;

    // Construct callback URLs using the current domain
    const returnUrl = `${origin}/payment/success`;
    const cancelUrl = `${origin}/api/payments/cancel`;
    // The SvelteKit IPN route validates PayFast's signature and runs the
    // post-payment hooks in-process; the old Netlify function did neither.
    const notifyUrl = `${origin}/api/payments/ipn`;
    // Log the dynamic URLs
    console.log("Using PayFast callback URLs:");
    console.log(`- Return URL: ${returnUrl}`);
    console.log(`- Cancel URL: ${cancelUrl}`);
    console.log(`- Notify URL: ${notifyUrl}`);

    // Get booking with user information
    const bookingResult = await db
      .select()
      .from(booking)
      .where(eq(booking.id, bookingId))
      .limit(1);

    if (!bookingResult || bookingResult.length === 0) {
      console.error(`Booking not found: ${bookingId}`);
      throw new Error("Booking not found");
    }

    const bookingData = bookingResult[0];
    console.log(
      `Found booking: ${bookingData.id} for user: ${bookingData.userId}`,
    );

    // Get user data (guest bookings have no userId, so there is no user to find)
    if (!bookingData.userId) {
      console.error(`User not found: ${bookingData.userId}`);
      throw new Error("User not found");
    }

    const userResult = await db
      .select()
      .from(user)
      .where(eq(user.id, bookingData.userId))
      .limit(1);

    if (!userResult || userResult.length === 0) {
      console.error(`User not found: ${bookingData.userId}`);
      throw new Error("User not found");
    }

    const userData = userResult[0];

    // Get service data
    const serviceResult = await db
      .select()
      .from(service)
      .where(eq(service.id, bookingData.serviceId))
      .limit(1);

    if (!serviceResult || serviceResult.length === 0) {
      console.error(`Service not found: ${bookingData.serviceId}`);
      throw new Error("Service not found");
    }

    const serviceData = serviceResult[0];

    // Create payment record
    const paymentId = crypto.randomUUID();
    console.log(`Generated payment ID: ${paymentId}`);

    const [newPayment] = await db
      .insert(payment)
      .values({
        id: paymentId,
        userId: bookingData.userId,
        bookingId: bookingData.id,
        amount: bookingData.price,
        status: "PENDING",
        paymentMethod: "CREDIT_CARD",
        // Informational only: nothing parses this back (the IPN finds the
        // payment by m_payment_id and the booking by custom_str1), so older
        // "BrightBroom-<id>" rows and new "<Brand>-<id>" rows coexist safely.
        merchantReference: `${merchantReferencePrefix()}-${bookingData.id}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(`Created payment record: ${newPayment.id}`);

    // Generate PayFast URL with dynamic callback URLs
    const redirectUrl = generatePayFastUrl(
      bookingData,
      userData,
      serviceData,
      newPayment,
      { returnUrl, cancelUrl, notifyUrl }, // Pass the dynamic URLs
    );

    return {
      paymentId,
      redirectUrl,
    };
  } catch (error) {
    console.error("Error creating payment for booking:", error);
    throw error;
  }
}

/**
 * Generate a PayFast URL for redirecting the user to complete payment
 */
function generatePayFastUrl(
  bookingData: any,
  userData: any,
  serviceData: any,
  paymentData: Payment,
  urls: { returnUrl: string; cancelUrl: string; notifyUrl: string },
): string {
  const credentials = getPayFastCredentials();

  // Values are trimmed and signed in PayFast's field order by
  // signedCheckoutQuery; the URL carries exactly what was signed.
  const data: CheckoutData = {
    merchant_id: credentials.merchantId,
    merchant_key: credentials.merchantKey,
    return_url: `${urls.returnUrl}?booking_id=${bookingData.id}`,
    cancel_url: `${urls.cancelUrl}?booking_id=${bookingData.id}`,
    notify_url: urls.notifyUrl,
    name_first: userData.firstName,
    name_last: userData.lastName,
    email_address: userData.email,
    m_payment_id: paymentData.id,
    // Two decimal places, as PayFast requires
    amount: Number(bookingData.price).toFixed(2),
    item_name: `${brand.name} ${serviceData.name}`,
    item_description: `Cleaning service scheduled for ${parseDateTimeString(bookingData.scheduledDate).toISOString().split("T")[0]}`,
    custom_str1: bookingData.id, // Store booking ID for reference
  };

  return `${PAYFAST_URL}?${signedCheckoutQuery(data, credentials.passphrase)}`;
}
