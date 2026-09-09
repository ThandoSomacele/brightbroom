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
