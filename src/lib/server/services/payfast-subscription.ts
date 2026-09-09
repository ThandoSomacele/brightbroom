// src/lib/server/services/payfast-subscription.ts

import { env } from '$env/dynamic/private';
import crypto from 'crypto';
import type { Subscription, NewSubscription, SubscriptionPayment } from '../db/schema';

// PayFast subscription endpoints
const PAYFAST_SUBSCRIPTION_URL = (env.PAYFAST_SANDBOX_MODE === 'true' || env.PAYFAST_USE_SANDBOX === 'true')
  ? 'https://sandbox.payfast.co.za/eng/process'
  : 'https://www.payfast.co.za/eng/process';

// One API host for live and sandbox; sandbox is selected per request with the
// testing=true query parameter, which must also be part of the signature.
const PAYFAST_SANDBOX =
  env.PAYFAST_SANDBOX_MODE === 'true' || env.PAYFAST_USE_SANDBOX === 'true';
const PAYFAST_API_BASE = 'https://api.payfast.co.za/subscriptions';

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
  frequency?: 3 | 4 | 5 | 6; // 3 = Monthly, 4 = Quarterly, 5 = Biannual, 6 = Annual; type 1 only
  cycles?: number; // 0 for indefinite; type 1 only

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

// PHP-style urlencode, which PayFast's API signature is defined against:
// spaces become +, and the characters encodeURIComponent leaves bare
// (! ' ( ) * ~) are percent-encoded too.
function phpUrlencode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, '+')
    .replace(/[!'()*~]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

// PayFast wants Y-m-d\TH:i:sO - seconds precision, zone offset, no colon
function apiTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const offsetMinutes = -d.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `${sign}${pad(Math.floor(abs / 60))}${pad(abs % 60)}`
  );
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
      // Check for undefined/null, but allow 0 and false values
      if (data[key] !== undefined && data[key] !== null && data[key] !== "" && key !== "signature") {
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
      data[key] !== undefined &&
      data[key] !== null &&
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

  // Generate MD5 signature
  const signature = crypto.createHash('md5').update(pfOutput).digest('hex');

  return signature;
}

export class PayFastSubscriptionService {
  private merchantId: string;
  private merchantKey: string;
  private passphrase?: string;
  private apiKey?: string;

  constructor() {
    this.merchantId = env.PAYFAST_MERCHANT_ID || '';
    this.merchantKey = env.PAYFAST_MERCHANT_KEY || '';
    this.passphrase = env.PAYFAST_PASSPHRASE;
    this.apiKey = env.PAYFAST_API_KEY;
  }

  // Create a new subscription
  async createSubscription(subscription: NewSubscription, customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  }): Promise<{ redirectUrl: string; token?: string }> {
    // Ad-hoc token agreement (subscription_type 2): the checkout charges the
    // first cycle and authorises the card; every later cycle is billed by our
    // cron on the customer's actual schedule via chargeSubscriptionCycle.
    // PayFast's native subscriptions only support monthly and longer, so a
    // weekly plan cannot be billed natively - type 1 here quietly registered
    // every customer as monthly, whatever schedule they chose.
    const finalPrice = parseFloat(subscription.finalPrice.toString());

    // Build params in PayFast's required order - CRITICAL!
    // The object insertion order MUST match the signature generation order
    const params: PayFastSubscriptionParams = {
      // 1. Merchant details
      merchant_id: this.merchantId,
      merchant_key: this.merchantKey,
      return_url: `${env.PUBLIC_URL || process.env.PUBLIC_URL}/book/payment/subscription-success?m_payment_id=${subscription.id}`,
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
      // Ad-hoc agreement: no frequency, cycles or billing_date - PayFast
      // never initiates a charge, we do.
      subscription_type: 2,
    };

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

  // Update subscription (pause, resume, cancel). All three are PUTs against
  // the token's endpoint - cancel included, per PayFast's API.
  async updateSubscriptionStatus(token: string, action: 'pause' | 'unpause' | 'cancel'): Promise<boolean> {
    const result = await this.apiRequest('PUT', `${token}/${action}`);
    if (!result.ok) {
      console.error(`PayFast ${action} failed (${result.status}):`, result.body);
    }
    return result.ok;
  }

  // Get subscription details
  async getSubscriptionDetails(token: string): Promise<PayFastSubscriptionResponse | null> {
    const result = await this.apiRequest('GET', `${token}/fetch`);
    if (!result.ok) {
      console.error(`PayFast fetch failed (${result.status}):`, result.body);
      return null;
    }
    try {
      return JSON.parse(result.body)?.data?.response ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Charge one billing cycle against the customer's saved card.
   *
   * mPaymentId identifies the cycle and comes back in PayFast's ITN, so the
   * caller must pass a stable, resolvable id (the cycle's payment record id)
   * — never a random value, or the ITN cannot be matched to anything.
   * Amount is in cents, per the PayFast API.
   */
  async chargeSubscriptionCycle(
    subscription: Subscription,
    token: string,
    mPaymentId: string,
  ): Promise<{ ok: boolean; detail: string; pfPaymentId?: string }> {
    const amountCents = Math.round(
      parseFloat(subscription.finalPrice.toString()) * 100,
    );

    const result = await this.apiRequest('POST', `${token}/adhoc`, {
      amount: String(amountCents),
      item_name: 'Recurring Cleaning Service',
      item_description: `${subscription.frequency} cleaning service payment`,
      m_payment_id: mPaymentId,
    });

    if (!result.ok) {
      return { ok: false, detail: `HTTP ${result.status}: ${result.body.slice(0, 500)}` };
    }

    // A successful charge answers {code, status, data: {response: ...}} -
    // where response is sometimes just boolean true. Only keep something that
    // actually looks like a payment id.
    try {
      const parsed = JSON.parse(result.body);
      const pf = parsed?.data?.response?.pf_payment_id ?? parsed?.data?.response;
      const pfPaymentId =
        typeof pf === 'number' || (typeof pf === 'string' && /^\d+$/.test(pf))
          ? String(pf)
          : undefined;
      return { ok: true, detail: result.body.slice(0, 500), pfPaymentId };
    } catch {
      return { ok: true, detail: result.body.slice(0, 500) };
    }
  }

  /**
   * The PayFast API signature: every header and body value plus the
   * passphrase, sorted alphabetically by key, urlencoded PHP-style, MD5'd —
   * mirroring PayFast's own SDK (Auth::generateApiSignature). The previous
   * implementation was an invented HMAC scheme PayFast never accepted, which
   * is why no API call from this service had ever succeeded.
   */
  apiSignature(params: Record<string, string>): string {
    const data: Record<string, string> = { ...params };
    if (this.passphrase && this.passphrase !== '') {
      data.passphrase = this.passphrase.trim();
    }

    const paramString = Object.keys(data)
      .filter((key) => key !== 'signature')
      .sort()
      .map((key) => `${key}=${phpUrlencode(data[key])}`)
      .join('&');

    return crypto.createHash('md5').update(paramString).digest('hex');
  }

  private async apiRequest(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH',
    path: string,
    body?: Record<string, string>,
  ): Promise<{ ok: boolean; status: number; body: string }> {
    const headers: Record<string, string> = {
      'merchant-id': this.merchantId,
      version: 'v1',
      timestamp: apiTimestamp(),
    };

    // Sandbox is the testing=true query parameter on the live host. It is
    // deliberately NOT part of the signature: PayFast recomputes signatures
    // from headers and body only, and including it earns a 401 - verified
    // against /ping, contrary to what their SDK's header-merge suggests.
    const signature = this.apiSignature({ ...headers, ...(body ?? {}) });
    const url =
      `${PAYFAST_API_BASE}/${path}` + (PAYFAST_SANDBOX ? '?testing=true' : '');

    try {
      const response = await fetch(url, {
        method,
        headers: {
          ...headers,
          signature,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return {
        ok: response.ok,
        status: response.status,
        body: await response.text(),
      };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        body: error instanceof Error ? error.message : 'network error',
      };
    }
  }

  // Generate API signature for authenticated requests

  // Validate webhook signature
  validateWebhookSignature(params: Record<string, any>, signature: string): boolean {
    const calculatedSignature = generateSignature(params, this.passphrase);
    return calculatedSignature === signature;
  }

  /**
   * Validate the signature on an ITN (webhook) post from PayFast.
   *
   * ITN signatures are calculated over the posted fields in the order they
   * were sent, stopping at the signature field, with the passphrase appended —
   * a different scheme from the checkout signature above, which uses PayFast's
   * documented attribute order. Validating webhooks with the checkout scheme
   * rejected every genuine ITN, which left paid subscriptions PENDING with no
   * booking ever created.
   *
   * Works on the raw body rather than decoded params so the bytes hashed here
   * are exactly the bytes PayFast signed — no re-encoding to get subtly wrong.
   */
  validateItnSignature(rawBody: string): boolean {
    let paramString = "";
    let received: string | null = null;

    for (const pair of rawBody.split("&")) {
      const eq = pair.indexOf("=");
      const key = eq === -1 ? pair : pair.slice(0, eq);
      if (key === "signature") {
        received = eq === -1 ? "" : pair.slice(eq + 1);
        break; // PayFast signs only the fields posted before the signature
      }
      paramString += (paramString ? "&" : "") + pair;
    }

    // 32 hex chars is an md5 digest; anything else cannot match
    if (!received || !/^[0-9a-fA-F]{32}$/.test(received)) return false;

    if (this.passphrase && this.passphrase !== "") {
      const encodedPassphrase = encodeURIComponent(this.passphrase.trim()).replace(/%20/g, "+");
      paramString += `&passphrase=${encodedPassphrase}`;
    }

    const expected = crypto.createHash("md5").update(paramString).digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(received.toLowerCase()),
    );
  }

  /**
   * When the next cleaning should happen, from the customer's preferences.
   *
   * Counted from the payment that just landed — except that a subscription
   * whose start date is still in the future must not be cleaned before it:
   * the first booking lands on the first matching day on or after the start
   * date, which may be the start date itself. The webhook used to ignore
   * startDate entirely, which booked customers for the week before the
   * start they chose.
   *
   * `now` is injectable for tests; production callers leave it defaulted.
   */
  calculateNextCleaningDate(
    frequency: string,
    preferredDays: string[],
    monthlyDates: number[],
    timeSlot: string,
    startDate?: Date | null,
    now: Date = new Date(),
  ): Date {
    const [startTime] = timeSlot.split('-');
    const [hours, minutes] = startTime.split(':').map(Number);

    // A future start date anchors the search and may itself be the first
    // cleaning day. From "now", the earliest slot stays at least a day out,
    // as before — the payment only just landed.
    const startsLater = !!startDate && startDate > now;
    const base = startsLater ? new Date(startDate) : new Date(now);
    const sameDayAllowed = startsLater;

    const dayMap: Record<string, number> = {
      SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
      THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
    };

    // Days from the base date to the target weekday within a span. Zero means
    // the base date itself, allowed only when anchored to a future start.
    const daysUntil = (target: number, span: number): number => {
      const offset = (target - base.getDay() + span) % span;
      return offset === 0 && !sameDayAllowed ? span : offset;
    };

    const nextDate = new Date(base);
    nextDate.setHours(hours, minutes, 0, 0);

    switch (frequency) {
      case 'WEEKLY':
        nextDate.setDate(
          base.getDate() +
            (preferredDays.length > 0
              ? daysUntil(dayMap[preferredDays[0]], 7)
              : sameDayAllowed ? 0 : 7),
        );
        break;

      case 'BIWEEKLY':
        nextDate.setDate(
          base.getDate() +
            (preferredDays.length > 0
              ? daysUntil(dayMap[preferredDays[0]], 14)
              : sameDayAllowed ? 0 : 14),
        );
        break;

      case 'TWICE_WEEKLY': {
        if (preferredDays.length > 0) {
          let minDays = 7;
          for (const day of preferredDays) {
            minDays = Math.min(minDays, daysUntil(dayMap[day], 7));
          }
          // 7 means no reachable preferred day; fall back to 3, as before
          nextDate.setDate(base.getDate() + (minDays === 7 ? 3 : minDays));
        } else {
          nextDate.setDate(base.getDate() + (sameDayAllowed ? 0 : 3));
        }
        break;
      }

      case 'TWICE_MONTHLY': {
        if (monthlyDates && monthlyDates.length > 0) {
          const dates = [...monthlyDates].sort((a, b) => a - b);
          const target = sameDayAllowed
            ? dates.find((d) => d >= base.getDate())
            : dates.find((d) => d > base.getDate());
          if (target !== undefined) {
            nextDate.setDate(target);
          } else {
            // Past this month's dates: first date of next month. Pin the day
            // to 1 before stepping the month, or a base on the 31st rolls
            // straight through to the month after.
            nextDate.setDate(1);
            nextDate.setMonth(nextDate.getMonth() + 1);
            nextDate.setDate(dates[0]);
          }
        } else {
          nextDate.setDate(base.getDate() + (sameDayAllowed ? 0 : 15));
        }
        break;
      }

      default:
        // Monthly frequencies: 30 days out, or the start date itself
        nextDate.setDate(base.getDate() + (sameDayAllowed ? 0 : 30));
    }

    // Never book into the past
    if (nextDate <= now) {
      nextDate.setDate(nextDate.getDate() + 1);
    }

    return nextDate;
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