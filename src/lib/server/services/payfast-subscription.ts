// src/lib/server/services/payfast-subscription.ts

import { env } from '$env/dynamic/private';
import crypto from 'crypto';
import type { Subscription, NewSubscription, SubscriptionPayment } from '../db/schema';

// PayFast subscription endpoints
const PAYFAST_SUBSCRIPTION_URL = (env.VITE_PAYFAST_SANDBOX_MODE === 'true' || env.VITE_PAYFAST_USE_SANDBOX === 'true')
  ? 'https://sandbox.payfast.co.za/eng/process'
  : 'https://www.payfast.co.za/eng/process';

const PAYFAST_API_URL = (env.VITE_PAYFAST_SANDBOX_MODE === 'true' || env.VITE_PAYFAST_USE_SANDBOX === 'true')
  ? 'https://api.payfast.co.za/subscriptions/v1'
  : 'https://api.payfast.co.za/subscriptions/v1';

interface PayFastSubscriptionParams {
  // Merchant details
  merchant_id: string;
  merchant_key: string;

  // Payment details
  amount: number; // Initial payment amount

  // Subscription details
  subscription_type: 1 | 2; // 1 = Subscription, 2 = Ad hoc token
  billing_date?: string; // Format: YYYY-MM-DD
  recurring_amount?: number; // Amount for recurring charges (optional for type 1)
  frequency: 3 | 4 | 5 | 6; // 3 = Monthly, 4 = Quarterly, 5 = Biannual, 6 = Annual
  cycles: number; // 0 for indefinite

  // Subscription notification settings
  email_confirmation?: string; // "1" to send confirmation email
  confirmation_address?: string; // Email address for confirmation
  subscription_notify_email?: string; // "true" to notify merchant
  subscription_notify_buyer?: string; // "true" to notify buyer

  // Customer details
  name_first: string;
  name_last: string;
  email_address: string;
  cell_number?: string;

  // URLs
  return_url: string;
  cancel_url: string;
  notify_url: string;

  // Additional fields
  m_payment_id: string; // Our subscription ID
  item_name: string;
  item_description?: string;

  // Security signature
  signature?: string;
}

interface PayFastSubscriptionResponse {
  token: string;
  status: string;
  amount: number;
  frequency: string;
  cycles_complete: number;
  cycles_total: number;
  next_run_date: string;
}

// Map our frequency to PayFast frequency
function mapFrequencyToPayFast(frequency: string): 3 | 4 | 5 | 6 {
  // PayFast only supports monthly for recurring payments
  // We'll handle weekly and bi-weekly by creating multiple monthly subscriptions
  // or by using their tokenization for manual billing
  return 3; // Monthly
}

// Calculate cycles based on frequency
function calculateCycles(frequency: string, endDate?: Date): number {
  if (!endDate) return 0; // Indefinite

  const now = new Date();
  const months = (endDate.getFullYear() - now.getFullYear()) * 12 +
                 (endDate.getMonth() - now.getMonth());

  switch (frequency) {
    case 'WEEKLY':
      return Math.ceil(months * 4.33); // Approximate weeks per month
    case 'BIWEEKLY':
      return Math.ceil(months * 2.17);
    case 'TWICE_WEEKLY':
      return Math.ceil(months * 8.67); // Twice per week
    default:
      return months;
  }
}

// Generate PayFast signature using PayFast's specific parameter order
function generateSignature(params: Record<string, any>, passphrase?: string): string {
  // Remove signature if present
  const { signature: _unusedSignature, ...data } = params;

  // Define sections of parameters based on PayFast documentation
  // Parameters MUST be in this specific order, NOT alphabetical
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
        const encodedValue = encodeURIComponent(data[key].toString().trim()).replace(
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
      const encodedValue = encodeURIComponent(data[key].toString().trim()).replace(/%20/g, "+");
      pfOutput += `${key}=${encodedValue}&`;
    }
  }

  // Remove last ampersand
  pfOutput = pfOutput.slice(0, -1);

  // Add passphrase if provided
  if (passphrase && passphrase !== "") {
    const encodedPassphrase = encodeURIComponent(passphrase.trim()).replace(
      /%20/g,
      "+",
    );
    pfOutput += `&passphrase=${encodedPassphrase}`;
  }

  // Debug logging
  console.log('PayFast Signature String:', pfOutput);

  // Generate MD5 signature
  const signature = crypto.createHash('md5').update(pfOutput).digest('hex');
  console.log('PayFast Generated Signature:', signature);

  return signature;
}

export class PayFastSubscriptionService {
  private merchantId: string;
  private merchantKey: string;
  private passphrase?: string;
  private apiKey?: string;

  constructor() {
    this.merchantId = env.VITE_PAYFAST_MERCHANT_ID || '';
    this.merchantKey = env.VITE_PAYFAST_MERCHANT_KEY || '';
    this.passphrase = env.VITE_PAYFAST_PASSPHRASE || env.PAYFAST_PASSPHRASE;
    this.apiKey = env.PAYFAST_API_KEY;
  }

  // Create a new subscription
  async createSubscription(subscription: NewSubscription, customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  }): Promise<{ redirectUrl: string; token?: string }> {
    // For all our frequencies, use subscription_type: 1 (standard subscription)
    // We'll handle custom frequencies (weekly, bi-weekly, etc.) manually via API after initial setup
    const finalPrice = parseFloat(subscription.finalPrice.toString());

    // Build params in PayFast's required order - CRITICAL!
    // The object insertion order MUST match the signature generation order
    const params: PayFastSubscriptionParams = {
      // 1. Merchant details
      merchant_id: this.merchantId,
      merchant_key: this.merchantKey,
      return_url: `${env.PUBLIC_URL || process.env.PUBLIC_URL}/book/payment/subscription-success`,
      cancel_url: `${env.PUBLIC_URL || process.env.PUBLIC_URL}/book/payment/subscription-cancel`,
      notify_url: `${env.PUBLIC_URL || process.env.PUBLIC_URL}/api/payfast/subscription-webhook`,

      // 2. Customer details
      name_first: customer.firstName,
      name_last: customer.lastName,
      email_address: customer.email,
      cell_number: customer.phone,

      // 3. Transaction details
      m_payment_id: subscription.id,
      amount: finalPrice,
      item_name: 'Recurring Cleaning Service',
      item_description: `${subscription.frequency} cleaning service subscription`,

      // 4. Transaction options
      email_confirmation: "1",
      confirmation_address: customer.email,

      // 5. Recurring Billing (must match generateSignature section order!)
      subscription_type: 1,
      // billing_date - optional, only for TWICE_MONTHLY
      // recurring_amount - optional
      frequency: 3, // Monthly - required field
      cycles: 0, // Infinite cycles
      subscription_notify_email: "true",
      // subscription_notify_webhook - not used
      subscription_notify_buyer: "true",
    };

    // Set billing date for TWICE_MONTHLY subscriptions (specific dates each month)
    if (subscription.frequency === 'TWICE_MONTHLY' && subscription.monthlyDates && subscription.monthlyDates.length > 0) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(subscription.monthlyDates[0]);
      params.billing_date = nextMonth.toISOString().split('T')[0];
    }

    // Generate signature
    params.signature = generateSignature(params, this.passphrase);

    // Create form data
    const formData = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        formData.append(key, value.toString());
      }
    });

    // Return redirect URL for PayFast payment page
    return {
      redirectUrl: `${PAYFAST_SUBSCRIPTION_URL}?${formData.toString()}`,
    };
  }

  // Update subscription (pause, resume, cancel)
  async updateSubscriptionStatus(token: string, action: 'pause' | 'unpause' | 'cancel'): Promise<boolean> {
    if (!this.apiKey) {
      console.error('PayFast API key not configured');
      return false;
    }

    const endpoint = `${PAYFAST_API_URL}/${token}/${action}`;

    try {
      const response = await fetch(endpoint, {
        method: action === 'cancel' ? 'DELETE' : 'PUT',
        headers: {
          'merchant-id': this.merchantId,
          'version': 'v1',
          'timestamp': new Date().toISOString(),
          'signature': this.generateApiSignature(endpoint, action === 'cancel' ? 'DELETE' : 'PUT'),
        },
      });

      return response.ok;
    } catch (error) {
      console.error(`Error ${action}ing subscription:`, error);
      return false;
    }
  }

  // Get subscription details
  async getSubscriptionDetails(token: string): Promise<PayFastSubscriptionResponse | null> {
    if (!this.apiKey) {
      console.error('PayFast API key not configured');
      return null;
    }

    const endpoint = `${PAYFAST_API_URL}/${token}`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'merchant-id': this.merchantId,
          'version': 'v1',
          'timestamp': new Date().toISOString(),
          'signature': this.generateApiSignature(endpoint, 'GET'),
        },
      });

      if (response.ok) {
        return await response.json();
      }

      return null;
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      return null;
    }
  }

  // Process recurring payment for custom frequencies
  async processCustomRecurringPayment(subscription: Subscription, token: string): Promise<boolean> {
    if (!this.apiKey) {
      console.error('PayFast API key not configured');
      return false;
    }

    // Use the ad hoc token to charge the customer
    const endpoint = `${PAYFAST_API_URL}/adhoc/${token}`;

    const params = {
      amount: parseFloat(subscription.finalPrice.toString()) * 100, // Amount in cents
      item_name: 'Recurring Cleaning Service',
      item_description: `${subscription.frequency} cleaning service payment`,
      m_payment_id: crypto.randomBytes(16).toString('hex'),
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'merchant-id': this.merchantId,
          'version': 'v1',
          'timestamp': new Date().toISOString(),
          'signature': this.generateApiSignature(endpoint, 'POST', JSON.stringify(params)),
        },
        body: JSON.stringify(params),
      });

      return response.ok;
    } catch (error) {
      console.error('Error processing custom recurring payment:', error);
      return false;
    }
  }

  // Generate API signature for authenticated requests
  private generateApiSignature(url: string, method: string, body?: string): string {
    const timestamp = new Date().toISOString();
    const data = [
      this.merchantId,
      url.replace('https://', ''),
      timestamp,
      'v1',
      method.toUpperCase(),
      body || '',
    ].join('\n');

    return crypto
      .createHmac('sha256', this.apiKey || '')
      .update(data)
      .digest('hex');
  }

  // Validate webhook signature
  validateWebhookSignature(params: Record<string, any>, signature: string): boolean {
    const calculatedSignature = generateSignature(params, this.passphrase);
    return calculatedSignature === signature;
  }

  // Calculate next billing date based on frequency
  calculateNextBillingDate(frequency: string, lastBillingDate: Date, preferredDays?: string[]): Date {
    const next = new Date(lastBillingDate);

    switch (frequency) {
      case 'WEEKLY':
        next.setDate(next.getDate() + 7);
        break;
      case 'BIWEEKLY':
        next.setDate(next.getDate() + 14);
        break;
      case 'TWICE_WEEKLY':
        // Find next preferred day (twice per week)
        if (preferredDays && preferredDays.length > 0) {
          const dayMap: Record<string, number> = {
            'SUNDAY': 0, 'MONDAY': 1, 'TUESDAY': 2, 'WEDNESDAY': 3,
            'THURSDAY': 4, 'FRIDAY': 5, 'SATURDAY': 6
          };

          let found = false;
          for (let i = 1; i <= 7; i++) {
            next.setDate(lastBillingDate.getDate() + i);
            const dayName = Object.keys(dayMap).find(key => dayMap[key] === next.getDay());
            if (dayName && preferredDays.includes(dayName)) {
              found = true;
              break;
            }
          }
          if (!found) {
            next.setDate(lastBillingDate.getDate() + 3); // Default to 3 days
          }
        } else {
          next.setDate(next.getDate() + 3); // Default to twice a week
        }
        break;
      default:
        // Monthly
        next.setMonth(next.getMonth() + 1);
    }

    return next;
  }
}

export const payFastSubscriptionService = new PayFastSubscriptionService();