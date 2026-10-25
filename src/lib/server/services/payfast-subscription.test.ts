// src/lib/server/services/payfast-subscription.test.ts
import { describe, expect, it, beforeAll } from "vitest";
import crypto from "crypto";

/**
 * ITN (webhook) verification moved to $lib/server/payfast-itn, shared with the
 * booking IPN; its tests are in payfast-signature.test.ts and
 * payfast-itn.test.ts.
 */

// Set in beforeAll from the same env source the service reads. Under vitest,
// $env/dynamic/private is a snapshot of .env taken at startup — assigning
// process.env here does not reach the service — so the test signs with
// whatever passphrase the service actually holds.
let PASSPHRASE = "";

let service: typeof import("./payfast-subscription").payFastSubscriptionService;

beforeAll(async () => {
  // The service's $env/dynamic/private snapshot is loaded from .env at vitest
  // startup, so read the same file to sign with the passphrase the service
  // actually holds. With no .env (CI), both sides sign without a passphrase.
  const { config } = await import("dotenv");
  const parsed = config({ path: ".env", processEnv: {} }).parsed;
  PASSPHRASE = (parsed?.PAYFAST_PASSPHRASE || process.env.PAYFAST_PASSPHRASE || "").trim();
  ({ payFastSubscriptionService: service } = await import(
    "./payfast-subscription"
  ));
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
