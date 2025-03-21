// src/lib/server/payment.ts
import { db } from "$lib/server/db";
import {
  booking,
  payment,
  service,
  user,
  type Payment,
} from "$lib/server/db/schema";
import crypto from "crypto";
import { eq } from "drizzle-orm";

// Get environment variables with fallbacks to sandbox credentials for safety
const PAYFAST_MERCHANT_ID =
  import.meta.env.VITE_PAYFAST_MERCHANT_ID || "10035674";
const PAYFAST_MERCHANT_KEY =
  import.meta.env.VITE_PAYFAST_MERCHANT_KEY || "9nqhf208lzpc4";
const PAYFAST_PASSPHRASE =
  import.meta.env.VITE_PAYFAST_PASSPHRASE || "personalprojectssanding";

// Determine if we should use sandbox mode (default to true in development)
const USE_SANDBOX =
  import.meta.env.VITE_PAYFAST_SANDBOX_MODE === "false" ? false : true;

// Set appropriate PayFast URL based on environment
const PAYFAST_URL = USE_SANDBOX
  ? "https://sandbox.payfast.co.za/eng/process"
  : "https://www.payfast.co.za/eng/process";

// Get base app URL with fallback
const APP_BASE_URL = import.meta.env.VITE_APP_URL || "http://localhost:5173";

// Construct full URLs for callbacks
const RETURN_URL = `${APP_BASE_URL}/payment/success`;
const CANCEL_URL = `${APP_BASE_URL}/payment/cancel`;
const NOTIFY_URL = `${APP_BASE_URL}/api/payments/ipn`;

// Log payment configuration on startup (but not sensitive info)
console.log("PayFast Configuration:");
console.log(`- Using ${USE_SANDBOX ? "SANDBOX" : "PRODUCTION"} mode`);
console.log(`- Return URL: ${RETURN_URL}`);
console.log(`- Cancel URL: ${CANCEL_URL}`);
console.log(`- Notify URL: ${NOTIFY_URL}`);

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

/**
 * Create a payment for a booking and generate PayFast redirect URL
 * @param bookingId The ID of the booking to create a payment for
 * @returns The payment ID and redirect URL for PayFast
 */
export async function createPaymentForBooking(
  bookingId: string,
): Promise<{ paymentId: string; redirectUrl: string }> {
  try {
    console.log(`Creating payment for booking: ${bookingId}`);

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

    // Get user data
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
        merchantReference: `BrightBroom-${bookingData.id}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(`Created payment record: ${newPayment.id}`);

    // Generate PayFast URL
    const redirectUrl = generatePayFastUrl(
      bookingData,
      userData,
      serviceData,
      newPayment,
    );
    console.log(
      `Generated PayFast URL (partial): ${redirectUrl.substring(0, 100)}...`,
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
): string {
  // Format amount to 2 decimal places as required by PayFast
  const formattedAmount = Number(bookingData.price).toFixed(2);

  // Make sure to trim any whitespace that might cause issues
  const firstName = userData.firstName.trim();
  const lastName = userData.lastName.trim();
  const email = userData.email.trim();

  // Create data object for PayFast
  const data: PayFastPaymentData = {
    merchant_id: PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,
    return_url: RETURN_URL,
    cancel_url: CANCEL_URL,
    notify_url: NOTIFY_URL,
    name_first: firstName,
    name_last: lastName,
    email_address: email,
    m_payment_id: paymentData.id,
    amount: formattedAmount,
    item_name: `BrightBroom ${serviceData.name}`,
    item_description: `Cleaning service scheduled for ${bookingData.scheduledDate.toISOString().split("T")[0]}`,
    custom_str1: bookingData.id, // Store booking ID for reference
  };

  // Generate signature
  const signature = generateSignature(data, PAYFAST_PASSPHRASE);

  // Build URL manually to ensure encoding is consistent with signature generation
  let queryString = "";
  const keys = Object.keys(data).sort();

  keys.forEach((key) => {
    if (data[key] !== "") {
      // Use the same encoding as in generateSignature
      const encodedValue = encodeURIComponent(data[key]).replace(/%20/g, "+");
      queryString += `${key}=${encodedValue}&`;
    }
  });

  // Add signature
  queryString += `signature=${signature}`;

  return `${PAYFAST_URL}?${queryString}`;
}

/**
 * Generate a signature for PayFast payment data
 * @param data The payment data
 * @param passphrase Optional passphrase for additional security
 * @returns MD5 hash signature
 */
function generateSignature(
  data: Record<string, string>,
  passphrase: string | null = null,
): string {
  try {
    // Define sections of parameters based on PayFast documentation
    const sections = [
      // Merchant details
      [
        "merchant_id",
        "merchant_key",
        "return_url",
        "cancel_url",
        "notify_url",
        "fica_idnumber",
      ],
      // Customer details
      ["name_first", "name_last", "email_address", "cell_number"],
      // Transaction details
      ["m_payment_id", "amount", "item_name", "item_description"],
      // Custom variables
      [
        "custom_str1",
        "custom_str2",
        "custom_str3",
        "custom_str4",
        "custom_str5",
        "custom_int1",
        "custom_int2",
        "custom_int3",
        "custom_int4",
        "custom_int5",
      ],
      // Transaction options
      ["email_confirmation", "confirmation_address", "payment_method"],
      // Recurring Billing
      [
        "subscription_type",
        "billing_date",
        "recurring_amount",
        "frequency",
        "cycles",
        "subscription_notify_email",
        "subscription_notify_webhook",
        "subscription_notify_buyer",
      ],
    ];

    // Create parameter string
    let pfOutput = "";

    // Create a set to track processed parameters
    const processedParams = new Set<string>();

    // Add parameters in the defined sections if they exist in the data
    for (const section of sections) {
      for (const key of section) {
        if (data[key] && data[key] !== "" && key !== "signature") {
          const encodedValue = encodeURIComponent(data[key]).replace(
            /%20/g,
            "+",
          );
          pfOutput += `${key}=${encodedValue}&`;
          processedParams.add(key);
        }
      }
    }

    // Add any remaining parameters not in the defined sections
    for (const key in data) {
      if (
        !processedParams.has(key) &&
        data[key] !== "" &&
        key !== "signature" &&
        data.hasOwnProperty(key)
      ) {
        const encodedValue = encodeURIComponent(data[key]).replace(/%20/g, "+");
        pfOutput += `${key}=${encodedValue}&`;
      }
    }

    // Remove last ampersand
    pfOutput = pfOutput.slice(0, -1);

    // Add passphrase if provided
    if (passphrase !== null && passphrase !== "") {
      const encodedPassphrase = encodeURIComponent(passphrase).replace(
        /%20/g,
        "+",
      );
      pfOutput += `&passphrase=${encodedPassphrase}`;
    }

    // Log the pre-hash string for debugging
    console.log(
      "Pre-hash signature string (without passphrase):",
      pfOutput.replace(/&passphrase=.*$/, "&passphrase=HIDDEN"),
    );

    // Generate MD5 hash
    return crypto.createHash("md5").update(pfOutput).digest("hex");
  } catch (error) {
    console.error("Error generating PayFast signature:", error);
    throw error;
  }
}

/**
 * Validate an IPN request from PayFast
 * @param pfData The data from PayFast
 * @param pfParamString The original parameter string
 * @returns True if the request is valid, false otherwise
 */
export async function validateIpnRequest(
  pfData: Record<string, string>,
  pfParamString: string,
): Promise<boolean> {
  // Use sandbox host for testing
  const pfHost = USE_SANDBOX ? "sandbox.payfast.co.za" : "www.payfast.co.za";

  try {
    console.log("Validating IPN request from PayFast");

    // Verify security signature
    const pfParamsToInclude = { ...pfData };

    // Remove signature from data to verify
    delete pfParamsToInclude.signature;

    // Regenerate signature
    const signature = generateSignature(pfParamsToInclude, PAYFAST_PASSPHRASE);

    if (pfData.signature !== signature) {
      console.error("IPN request signature validation failed");
      return false;
    }

    console.log("IPN signature validated successfully");

    // Skip server verification in sandbox mode if testing locally
    if (USE_SANDBOX && process.env.NODE_ENV === "development") {
      console.log(
        "Skipping server verification in sandbox mode for local development",
      );
      return true;
    }

    // Verify data with PayFast server
    const verifyUrl = `https://${pfHost}/eng/query/validate`;

    console.log(`Verifying IPN with PayFast at: ${verifyUrl}`);

    const response = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: pfParamString,
    });

    const text = await response.text();

    if (text !== "VALID") {
      console.error(`PayFast server validation failed: ${text}`);
      return false;
    }

    console.log("IPN request verified successfully with PayFast server");
    return true;
  } catch (error) {
    console.error("Error validating IPN request:", error);
    return false;
  }
}

/**
 * Process a successful payment
 * @param paymentId The ID of the payment
 */
export async function processSuccessfulPayment(
  paymentId: string,
): Promise<void> {
  try {
    console.log(`Processing successful payment: ${paymentId}`);

    // Update payment status to completed
    await db
      .update(payment)
      .set({
        status: "COMPLETED",
        updatedAt: new Date(),
      })
      .where(eq(payment.id, paymentId));

    console.log(`Updated payment status to COMPLETED: ${paymentId}`);

    // Get the booking ID for this payment
    const paymentResult = await db
      .select()
      .from(payment)
      .where(eq(payment.id, paymentId))
      .limit(1);

    if (!paymentResult || paymentResult.length === 0) {
      console.error(`Payment not found: ${paymentId}`);
      return;
    }

    const paymentData = paymentResult[0];
    const bookingId = paymentData.bookingId;

    // Update booking status to CONFIRMED
    await db
      .update(booking)
      .set({
        status: "CONFIRMED",
        updatedAt: new Date(),
      })
      .where(eq(booking.id, bookingId));

    console.log(`Updated booking status to CONFIRMED: ${bookingId}`);
  } catch (error) {
    console.error("Error processing successful payment:", error);
    throw error;
  }
}
