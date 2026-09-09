// src/lib/server/services/payfast-subscription.test.ts
import { describe, expect, it, beforeAll } from "vitest";
import crypto from "crypto";

/**
 * PayFast signs an ITN (webhook) post over the fields in the order they were
 * posted, stopping at the signature field, with the passphrase appended.
 * That is a different scheme from the checkout signature, which uses PayFast's
 * documented attribute order. Validating an ITN with the checkout scheme
 * rejects every genuine webhook — which is how a paid subscription could sit
 * PENDING with no booking ever created.
 *
 * The payload below is a faithful ITN shape: PayFast's field order, PayFast's
 * encoding (urlencoded, spaces as +), signature computed the way PayFast
 * computes it.
 */

// Set in beforeAll from the same env source the service reads. Under vitest,
// $env/dynamic/private is a snapshot of .env taken at startup — assigning
// process.env here does not reach the service — so the test signs with
// whatever passphrase the service actually holds.
let PASSPHRASE = "";

// PayFast's own encoding: urlencode with spaces as +
const enc = (v: string) => encodeURIComponent(v).replace(/%20/g, "+");

/** Build a raw ITN body exactly as PayFast would post and sign it. */
function buildItnBody(fields: [string, string][], passphrase: string): string {
  const paramString = fields.map(([k, v]) => `${k}=${enc(v)}`).join("&");
  const signed = passphrase
    ? `${paramString}&passphrase=${enc(passphrase)}`
    : paramString;
  const signature = crypto.createHash("md5").update(signed).digest("hex");
  return `${paramString}&signature=${signature}`;
}

// Standard ITN field order for a subscription payment
const ITN_FIELDS: [string, string][] = [
  ["m_payment_id", "sub_8c1f2b9d4e"],
  ["pf_payment_id", "324512059"],
  ["payment_status", "COMPLETE"],
  ["item_name", "Recurring Cleaning Service"],
  ["item_description", "Recurring Cleaning Service - WEEKLY"],
  ["amount_gross", "252.00"],
  ["amount_fee", "-11.57"],
  ["amount_net", "240.43"],
  ["custom_str1", ""],
  ["custom_str2", ""],
  ["custom_str3", ""],
  ["custom_str4", ""],
  ["custom_str5", ""],
  ["custom_int1", ""],
  ["custom_int2", ""],
  ["custom_int3", ""],
  ["custom_int4", ""],
  ["custom_int5", ""],
  ["name_first", "Maike"],
  ["name_last", "Zorkot"],
  ["email_address", "maikezorkot@outlook.com"],
  ["merchant_id", "10000100"],
  ["token", "a3b8e2d1-9f47-4c6a-b0d5-1234567890ab"],
  ["billing_date", "2026-08-31"],
];

let service: typeof import("./payfast-subscription").payFastSubscriptionService;

beforeAll(async () => {
  // The service's $env/dynamic/private snapshot is loaded from .env at vitest
  // startup, so read the same file to sign with the passphrase the service
  // actually holds. With no .env (CI), both sides sign without a passphrase.
  const { config } = await import("dotenv");
  const parsed = config({ path: ".env", processEnv: {} }).parsed;
  PASSPHRASE = parsed?.PAYFAST_PASSPHRASE || process.env.PAYFAST_PASSPHRASE || "";
  ({ payFastSubscriptionService: service } = await import(
    "./payfast-subscription"
  ));
});

describe("ITN signature validation", () => {
  it("accepts a genuine PayFast ITN post", () => {
    const body = buildItnBody(ITN_FIELDS, PASSPHRASE);
    expect(service.validateItnSignature(body)).toBe(true);
  });

  it("rejects a tampered amount", () => {
    const body = buildItnBody(ITN_FIELDS, PASSPHRASE).replace(
      "amount_gross=252.00",
      "amount_gross=1.00",
    );
    expect(service.validateItnSignature(body)).toBe(false);
  });

  it("rejects a body with no signature at all", () => {
    const body = ITN_FIELDS.map(([k, v]) => `${k}=${enc(v)}`).join("&");
    expect(service.validateItnSignature(body)).toBe(false);
  });

  it("rejects a signature made with the wrong passphrase", () => {
    const body = buildItnBody(ITN_FIELDS, `${PASSPHRASE}-attacker-guess`);
    expect(service.validateItnSignature(body)).toBe(false);
  });

  it("still accepts the post when custom fields are populated", () => {
    const fields = ITN_FIELDS.map(([k, v]): [string, string] =>
      k === "custom_str1" ? [k, "some value with spaces & symbols"] : [k, v],
    );
    const body = buildItnBody(fields, PASSPHRASE);
    expect(service.validateItnSignature(body)).toBe(true);
  });
});

describe("calculateNextCleaningDate", () => {
  // Payment 324512059: paid Monday 31 Aug, start date Monday 7 Sep,
  // Fridays at 09:00. The old code ignored the start date and would have
  // booked Friday 4 Sep — before the start the customer chose.
  const paidAt = new Date("2026-08-31T12:05:22");

  it("books the first matching day on or after a future start date", () => {
    const next = service.calculateNextCleaningDate(
      "WEEKLY", ["FRIDAY"], [], "09:00",
      new Date("2026-09-07T07:39:50"), paidAt,
    );
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(8); // September
    expect(next.getDate()).toBe(11);
    expect(next.getHours()).toBe(9);
    expect(next.getMinutes()).toBe(0);
  });

  it("books the start date itself when it falls on the preferred day", () => {
    const next = service.calculateNextCleaningDate(
      "WEEKLY", ["FRIDAY"], [], "09:00",
      new Date("2026-09-11T00:00:00"), paidAt,
    );
    expect(next.getDate()).toBe(11);
    expect(next.getHours()).toBe(9);
  });

  it("counts from the payment when the start date has already passed", () => {
    const next = service.calculateNextCleaningDate(
      "WEEKLY", ["FRIDAY"], [], "09:00",
      new Date("2026-08-24T00:00:00"), paidAt,
    );
    // Monday 31 Aug -> next Friday is 4 Sep
    expect(next.getMonth()).toBe(8);
    expect(next.getDate()).toBe(4);
  });

  it("counts from the payment when there is no start date at all", () => {
    const next = service.calculateNextCleaningDate(
      "WEEKLY", ["FRIDAY"], [], "09:00", null, paidAt,
    );
    expect(next.getDate()).toBe(4);
  });

  it("with no preferred days, a future start date is the first cleaning day", () => {
    const next = service.calculateNextCleaningDate(
      "WEEKLY", [], [], "09:00-12:00",
      new Date("2026-09-07T07:39:50"), paidAt,
    );
    expect(next.getDate()).toBe(7);
    expect(next.getHours()).toBe(9);
  });

  it("TWICE_MONTHLY picks the next configured date of the month", () => {
    // Paid on the 31st with cleaning dates on the 1st and 15th: this month's
    // dates are behind us, so the next cleaning is the 1st of next month.
    const next = service.calculateNextCleaningDate(
      "TWICE_MONTHLY", [], [1, 15], "09:00", null, paidAt,
    );
    expect(next.getMonth()).toBe(8); // September
    expect(next.getDate()).toBe(1);
  });

  it("TWICE_MONTHLY honours a future start date, inclusive", () => {
    // Start on the 7th with dates on the 1st and 15th: first clean is the 15th
    const next = service.calculateNextCleaningDate(
      "TWICE_MONTHLY", [], [1, 15], "09:00",
      new Date("2026-09-07T07:39:50"), paidAt,
    );
    expect(next.getMonth()).toBe(8);
    expect(next.getDate()).toBe(15);
  });

  it("TWICE_WEEKLY picks the nearest preferred day on or after the start", () => {
    const next = service.calculateNextCleaningDate(
      "TWICE_WEEKLY", ["MONDAY", "THURSDAY"], [], "09:00",
      new Date("2026-09-08T00:00:00"), paidAt, // a Tuesday
    );
    // Nearest of Mon/Thu on or after Tue 8 Sep is Thu 10 Sep
    expect(next.getDate()).toBe(10);
  });
});

describe("apiSignature", () => {
  // The PayFast API signature: headers + body + passphrase, alphabetised,
  // PHP-urlencoded, MD5 (mirrors PayFast's SDK Auth::generateApiSignature).
  const phpEnc = (v: string) =>
    encodeURIComponent(v)
      .replace(/%20/g, "+")
      .replace(/[!'()*~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());

  it("sorts alphabetically, includes the passphrase, and encodes PHP-style", () => {
    const params = {
      "merchant-id": "10000100",
      version: "v1",
      timestamp: "2026-09-09T14:30:00+0200",
      amount: "25200",
      item_name: "Recurring Cleaning Service",
      m_payment_id: "rc-20260914-sub1",
    };

    const parts = [
      ...Object.entries(params).map(([k, v]) => [k, phpEnc(v)] as const),
      ...(PASSPHRASE ? [["passphrase", phpEnc(PASSPHRASE)] as const] : []),
    ].sort(([a], [b]) => (a < b ? -1 : 1));
    const expected = crypto
      .createHash("md5")
      .update(parts.map(([k, v]) => `${k}=${v}`).join("&"))
      .digest("hex");

    expect(service.apiSignature(params)).toBe(expected);
  });

  it("never signs an incoming signature field", () => {
    const base = { "merchant-id": "10000100", version: "v1", timestamp: "t" };
    expect(service.apiSignature({ ...base, signature: "deadbeef" })).toBe(
      service.apiSignature(base),
    );
  });
});

describe("why validateItnSignature exists", () => {
  it("the checkout-order signature does NOT match a genuine ITN — the bug that dropped paid subscription bookings", () => {
    // Decode the ITN body into an object, exactly as the webhook used to
    // before handing it to the checkout-order validator.
    const body = buildItnBody(ITN_FIELDS, PASSPHRASE);
    const params = new URLSearchParams(body);
    const obj: Record<string, string> = {};
    params.forEach((v, k) => (obj[k] = v));
    const signature = obj.signature;
    delete obj.signature;

    // The old path: checkout-order validation of an ITN payload. If this ever
    // starts passing, PayFast has changed their scheme — revisit both paths.
    expect(service.validateWebhookSignature(obj, signature)).toBe(false);
  });
});
