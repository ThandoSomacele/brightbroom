// src/lib/server/payfast-itn.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

// A fixed environment, so the result does not depend on the local .env
const env: Record<string, string | undefined> = {};
vi.mock("$env/dynamic/private", () => ({ env }));

const { amountMatches, bookingItnAction, checkItn, confirmWithPayFast } = await import(
  "./payfast-itn"
);

// Real PayFast sandbox ITN, signed without a passphrase (see payfast-signature.test.ts)
const SANDBOX_ITN =
  "m_payment_id=&pf_payment_id=46591&payment_status=COMPLETE&item_name=Name&item_description=&amount_gross=123.00&amount_fee=-2.80&amount_net=120.20&custom_str1=&custom_str2=&custom_str3=&custom_str4=&custom_str5=&custom_int1=&custom_int2=&custom_int3=&custom_int4=&custom_int5=&name_first=Test&name_last=User+01&email_address=sbtu01%40payfast.co.za&merchant_id=10000100&signature=bae21e96d4dc7bf36bd1a6bb1a103f5f";

beforeEach(() => {
  for (const key of Object.keys(env)) delete env[key];
  env.PAYFAST_MERCHANT_ID = "10000100";
  env.PAYFAST_PASSPHRASE = "";
  env.PAYFAST_SANDBOX_MODE = "true";
});

describe("checkItn", () => {
  it("accepts a genuine ITN for our merchant", () => {
    const check = checkItn(SANDBOX_ITN);
    expect(check.ok).toBe(true);
    if (check.ok) expect(check.itn.fields.pf_payment_id).toBe("46591");
  });

  it("refuses a tampered ITN", () => {
    const check = checkItn(SANDBOX_ITN.replace("amount_gross=123.00", "amount_gross=1.00"));
    expect(check).toEqual({ ok: false, reason: "signature mismatch" });
  });

  it("refuses a correctly signed ITN for another merchant", () => {
    env.PAYFAST_MERCHANT_ID = "10009999";
    expect(checkItn(SANDBOX_ITN)).toEqual({ ok: false, reason: "merchant_id is not ours" });
  });

  it("refuses everything when no merchant is configured", () => {
    env.PAYFAST_MERCHANT_ID = "";
    expect(checkItn(SANDBOX_ITN).ok).toBe(false);
  });

  it("refuses an ITN signed without the passphrase we hold", () => {
    env.PAYFAST_PASSPHRASE = "jt7NOE43FZPn";
    expect(checkItn(SANDBOX_ITN)).toEqual({ ok: false, reason: "signature mismatch" });
  });

  it("refuses a body that repeats a field", () => {
    expect(checkItn(`amount_gross=1.00&${SANDBOX_ITN}`).ok).toBe(false);
  });

  it("does not care what NODE_ENV says", () => {
    const before = process.env.NODE_ENV;
    try {
      for (const mode of ["development", "production", "test"]) {
        process.env.NODE_ENV = mode;
        expect(checkItn(SANDBOX_ITN.replace("123.00", "1.00")).ok).toBe(false);
      }
    } finally {
      process.env.NODE_ENV = before;
    }
  });
});

describe("confirmWithPayFast", () => {
  const itn = () => {
    const check = checkItn(SANDBOX_ITN);
    if (!check.ok) throw new Error("fixture should verify");
    return check.itn;
  };

  function fakeFetch(answer: string | Error) {
    const calls: { url: string; init: RequestInit }[] = [];
    const fn = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      if (answer instanceof Error) throw answer;
      return new Response(answer);
    }) as unknown as typeof fetch;
    return { fn, calls };
  }

  it("posts the signed fields without the signature to PayFast's validate endpoint", async () => {
    const { fn, calls } = fakeFetch("VALID");
    expect(await confirmWithPayFast(itn(), fn)).toBe(true);

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://sandbox.payfast.co.za/eng/query/validate");
    expect(calls[0].init.method).toBe("POST");
    expect(calls[0].init.body).toBe(SANDBOX_ITN.split("&signature=")[0]);
    expect(String(calls[0].init.body)).not.toContain("signature");
  });

  it("uses the live host outside sandbox mode", async () => {
    env.PAYFAST_SANDBOX_MODE = "false";
    const { fn, calls } = fakeFetch("VALID");
    await confirmWithPayFast(itn(), fn);
    expect(calls[0].url).toBe("https://www.payfast.co.za/eng/query/validate");
  });

  it("treats anything but VALID, or no answer, as a refusal", async () => {
    expect(await confirmWithPayFast(itn(), fakeFetch("INVALID").fn)).toBe(false);
    expect(await confirmWithPayFast(itn(), fakeFetch("").fn)).toBe(false);
    expect(await confirmWithPayFast(itn(), fakeFetch(new Error("timeout")).fn)).toBe(false);
  });
});

describe("amountMatches", () => {
  it("allows at most R0.01 difference", () => {
    expect(amountMatches("230.00", "230.00")).toBe(true);
    expect(amountMatches("230", "230.00")).toBe(true);
    expect(amountMatches("230.01", "230.00")).toBe(true);
    expect(amountMatches("229.99", 230)).toBe(true);
    expect(amountMatches("230.02", "230.00")).toBe(false);
    expect(amountMatches("1.00", "230.00")).toBe(false);
  });

  it("refuses an amount that is missing or not a plain amount", () => {
    expect(amountMatches(undefined, "230.00")).toBe(false);
    expect(amountMatches("", "230.00")).toBe(false);
    expect(amountMatches("-230.00", "230.00")).toBe(false);
    expect(amountMatches("230.00abc", "230.00")).toBe(false);
    expect(amountMatches("2.3e2", "230.00")).toBe(false);
  });
});

describe("bookingItnAction", () => {
  it("confirms a pending booking on its first COMPLETE", () => {
    expect(bookingItnAction("COMPLETE", "PENDING", "PENDING")).toBe("confirm");
    expect(bookingItnAction("COMPLETE", "FAILED", "PENDING")).toBe("confirm");
  });

  it("does nothing for a payment already recorded", () => {
    expect(bookingItnAction("COMPLETE", "COMPLETED", "CONFIRMED")).toBe("already-paid");
    expect(bookingItnAction("COMPLETE", "REFUNDED", "CANCELLED")).toBe("already-paid");
  });

  it("keeps a cancelled booking cancelled and flags the refund", () => {
    expect(bookingItnAction("COMPLETE", "PENDING", "CANCELLED")).toBe("paid-but-cancelled");
    expect(bookingItnAction("COMPLETE", "FAILED", "CANCELLED")).toBe("paid-but-cancelled");
  });

  it("records late money without moving a booking that has moved on", () => {
    expect(bookingItnAction("COMPLETE", "PENDING", "CONFIRMED")).toBe("record-payment");
    expect(bookingItnAction("COMPLETE", "PENDING", "COMPLETED")).toBe("record-payment");
  });

  it("never turns a recorded payment into a failure", () => {
    expect(bookingItnAction("FAILED", "PENDING", "PENDING")).toBe("record-failure");
    expect(bookingItnAction("FAILED", "COMPLETED", "CONFIRMED")).toBe("ignore");
    expect(bookingItnAction("PENDING", "PENDING", "PENDING")).toBe("ignore");
    expect(bookingItnAction(undefined, "PENDING", "PENDING")).toBe("ignore");
  });
});
