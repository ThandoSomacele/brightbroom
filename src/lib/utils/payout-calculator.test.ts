// src/lib/utils/payout-calculator.test.ts
import { describe, expect, it } from "vitest";
import { calculatePayout, calculatePayoutFromStoredFee, parseItnFee } from "./payout-calculator";

describe("parseItnFee", () => {
  it("reads PayFast's negative fee as the amount deducted", () => {
    expect(parseItnFee("-2.80", 123)).toBe(2.8);
    expect(parseItnFee("4.6", 230)).toBe(4.6);
  });

  it("falls back (null) when the fee is missing or not believable", () => {
    expect(parseItnFee(undefined, 100)).toBeNull();
    expect(parseItnFee("", 100)).toBeNull();
    expect(parseItnFee("abc", 100)).toBeNull();
    expect(parseItnFee("-150.00", 100)).toBeNull();
  });
});

describe("payout from the actual fee", () => {
  it("splits what is left after PayFast's real fee", () => {
    const b = calculatePayoutFromStoredFee(400, 10, 0.15, true);
    expect(b.netAfterFees).toBe(390);
    expect(b.commissionAmount).toBe(58.5);
    expect(b.cleanerPayout).toBe(331.5);
    expect(b.tenantPayout).toBe(0);
  });

  it("gives a cleaning company's share to the company, not the platform's cleaner", () => {
    const b = calculatePayoutFromStoredFee(400, 10, 0.1, false);
    expect(b.commissionAmount).toBe(39);
    expect(b.cleanerPayout).toBe(0);
    expect(b.tenantPayout).toBe(351);
  });

  it("differs from the card-rate estimate when PayFast charged less (e.g. EFT)", () => {
    const estimate = calculatePayout(400, "CREDIT_CARD", 0.15);
    const actual = calculatePayoutFromStoredFee(400, 8, 0.15, true);
    expect(actual.payFastFee).toBeLessThan(estimate.payFastFee);
    expect(actual.cleanerPayout).toBeGreaterThan(estimate.cleanerPayout);
  });
});
