// src/lib/server/payfast-itn.ts
//
// PayFast ITN (notify_url) checks shared by the booking and subscription
// handlers. PayFast's own SDK runs four checks before trusting an ITN; we run
// the signature, the data (merchant and amount) and the server confirmation.
// Nothing here depends on NODE_ENV: an ITN that fails is refused everywhere,
// because Netlify functions do not reliably see the NODE_ENV a build used.
import { env } from "$env/dynamic/private";
import { itnSignatureMatches, parseItn, type ParsedItn } from "./payfast-signature";

/** The account passphrase, or "" when the PayFast account has none */
export function payFastPassphrase(): string {
  return (env.PAYFAST_PASSPHRASE ?? "").trim();
}

/** Sandbox unless PAYFAST_SANDBOX_MODE is "false" - the checkout's rule */
export function payFastSandbox(): boolean {
  return env.PAYFAST_SANDBOX_MODE !== "false";
}

export type ItnCheck =
  | { ok: true; itn: ParsedItn }
  | { ok: false; reason: string };

/**
 * Signature and merchant checks, no network. Run this before reading
 * anything from the post.
 */
export function checkItn(rawBody: string): ItnCheck {
  const itn = parseItn(rawBody);
  if (!itn) return { ok: false, reason: "malformed or repeated fields" };
  if (!itnSignatureMatches(itn, payFastPassphrase())) {
    return { ok: false, reason: "signature mismatch" };
  }

  const merchantId = (env.PAYFAST_MERCHANT_ID ?? "").trim();
  if (!merchantId || itn.fields.merchant_id !== merchantId) {
    return { ok: false, reason: "merchant_id is not ours" };
  }

  return { ok: true, itn };
}

/**
 * Ask PayFast whether it really sent this ITN. Posts the signed fields
 * without the signature, as PayFast's SDK does; anything but "VALID" (or no
 * answer) is a refusal.
 */
export async function confirmWithPayFast(
  itn: ParsedItn,
  fetchFn: typeof fetch = fetch,
): Promise<boolean> {
  const host = payFastSandbox() ? "sandbox.payfast.co.za" : "www.payfast.co.za";
  try {
    const response = await fetchFn(`https://${host}/eng/query/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: itn.paramString,
      signal: AbortSignal.timeout(10_000),
    });
    return (await response.text()).trim() === "VALID";
  } catch {
    return false;
  }
}

/** amount_gross is within R0.01 of what we charged */
export function amountMatches(
  amountGross: string | undefined,
  expected: string | number,
): boolean {
  const gross = amountGross?.trim() ?? "";
  if (!/^\d+(\.\d{1,2})?$/.test(gross)) return false;
  const cents = (value: string | number) => Math.round(Number(value) * 100);
  return Math.abs(cents(gross) - cents(expected)) <= 1;
}

export type BookingItnAction =
  /** First COMPLETE for a booking still waiting on payment */
  | "confirm"
  /** COMPLETE for a booking that moved on without it (confirmed by hand) */
  | "record-payment"
  /** A repeat COMPLETE (PayFast retry, dashboard resend): nothing to do */
  | "already-paid"
  /** Money arrived for a cancelled booking: record it and flag a refund */
  | "paid-but-cancelled"
  | "record-failure"
  | "ignore";

/** What a verified ITN should do to a booking payment */
export function bookingItnAction(
  itnStatus: string | undefined,
  paymentStatus: string,
  bookingStatus: string,
): BookingItnAction {
  if (itnStatus === "COMPLETE") {
    if (paymentStatus === "COMPLETED" || paymentStatus === "REFUNDED") return "already-paid";
    if (bookingStatus === "CANCELLED") return "paid-but-cancelled";
    if (bookingStatus === "PENDING") return "confirm";
    return "record-payment";
  }
  if (itnStatus === "FAILED") {
    // Never undo a payment we already recorded
    return paymentStatus === "PENDING" ? "record-failure" : "ignore";
  }
  return "ignore";
}
