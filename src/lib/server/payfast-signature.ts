// src/lib/server/payfast-signature.ts
//
// Every PayFast signature in one place: checkout (payments and subscriptions),
// ITN verification, and the REST API (subscription charges, refunds). Pure
// functions, no environment access, so they can be tested against real
// PayFast payloads.
import crypto from "crypto";

/**
 * PHP's urlencode(), which every PayFast signature is defined against: each
 * byte outside A-Z a-z 0-9 - _ . is percent-encoded in upper case, and a space
 * becomes "+".
 *
 * encodeURIComponent is not a substitute: it leaves ! ' ( ) * ~ bare, so a
 * customer called O'Brien or an item name with brackets got "Generated
 * signature does not match submitted signature" from PayFast (verified against
 * the sandbox).
 */
export function phpUrlencode(value: string | Uint8Array): string {
  const bytes = typeof value === "string" ? Buffer.from(value, "utf8") : value;
  let out = "";
  for (const b of bytes) {
    const unreserved =
      (b >= 0x30 && b <= 0x39) || // 0-9
      (b >= 0x41 && b <= 0x5a) || // A-Z
      (b >= 0x61 && b <= 0x7a) || // a-z
      b === 0x2d || // -
      b === 0x5f || // _
      b === 0x2e; // .
    if (unreserved) out += String.fromCharCode(b);
    else if (b === 0x20) out += "+";
    else out += "%" + b.toString(16).toUpperCase().padStart(2, "0");
  }
  return out;
}

function md5(value: string): string {
  return crypto.createHash("md5").update(value).digest("hex");
}

function withPassphrase(paramString: string, passphrase: string): string {
  return passphrase ? `${paramString}&passphrase=${phpUrlencode(passphrase)}` : paramString;
}

/**
 * Checkout fields in the order PayFast signs them (its attribute documentation
 * and SDK). Not alphabetical: custom_int1-5 come before custom_str1-5, which
 * the sandbox enforces.
 */
export const CHECKOUT_FIELD_ORDER = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "notify_method",
  "name_first",
  "name_last",
  "email_address",
  "cell_number",
  "m_payment_id",
  "amount",
  "item_name",
  "item_description",
  "custom_int1",
  "custom_int2",
  "custom_int3",
  "custom_int4",
  "custom_int5",
  "custom_str1",
  "custom_str2",
  "custom_str3",
  "custom_str4",
  "custom_str5",
  "email_confirmation",
  "confirmation_address",
  "currency",
  "payment_method",
  "subscription_type",
  "billing_date",
  "recurring_amount",
  "frequency",
  "cycles",
  "subscription_notify_email",
  "subscription_notify_webhook",
  "subscription_notify_buyer",
] as const;

export type CheckoutField = (typeof CHECKOUT_FIELD_ORDER)[number];
export type CheckoutData = Partial<Record<CheckoutField, string | number | null | undefined>>;

/**
 * The query string for a PayFast checkout: the non-blank fields in PayFast's
 * order, values trimmed, then the signature. The string sent is the string
 * signed, so the two cannot drift apart.
 */
export function signedCheckoutQuery(data: CheckoutData, passphrase: string): string {
  const known = new Set<string>(CHECKOUT_FIELD_ORDER);
  for (const key of Object.keys(data)) {
    // PayFast would not sign an unknown field the way we do; fail loudly
    if (!known.has(key)) throw new Error(`Unknown PayFast checkout field: ${key}`);
  }

  const pairs: string[] = [];
  for (const key of CHECKOUT_FIELD_ORDER) {
    const raw = data[key];
    if (raw === undefined || raw === null) continue;
    const value = String(raw).trim();
    if (value !== "") pairs.push(`${key}=${phpUrlencode(value)}`);
  }

  const paramString = pairs.join("&");
  return `${paramString}&signature=${md5(withPassphrase(paramString, passphrase))}`;
}

/** An ITN post, split into what PayFast signed and the signature it sent */
export interface ParsedItn {
  /** Decoded values of the signed fields (everything before "signature") */
  fields: Record<string, string>;
  /**
   * What PayFast signed: every field before "signature", in posted order,
   * empty values included, each value PHP-urlencoded. Also the exact body
   * PayFast's /eng/query/validate expects.
   */
  paramString: string;
  signature: string | null;
}

/** Form-decode one component to bytes: "+" is a space, %XX a byte */
function formDecodeBytes(component: string): Buffer {
  const src = Buffer.from(component.replace(/\+/g, " "), "utf8");
  const out: number[] = [];
  for (let i = 0; i < src.length; i++) {
    const hex = src[i] === 0x25 ? src.subarray(i + 1, i + 3).toString("latin1") : "";
    if (/^[0-9a-fA-F]{2}$/.test(hex)) {
      out.push(parseInt(hex, 16));
      i += 2;
    } else {
      out.push(src[i]);
    }
  }
  return Buffer.from(out);
}

/**
 * Parse a raw ITN body the way PayFast's own SDK verifies it: walk the fields
 * in posted order and stop at "signature". Values are re-encoded from their
 * decoded bytes, as PHP's urlencode($_POST[...]) would, so the result does not
 * depend on how the body happened to be percent-encoded in transit.
 *
 * Anything posted after the signature is unsigned and is dropped. A body that
 * repeats a field is refused (null): which copy would we believe?
 */
export function parseItn(rawBody: string): ParsedItn | null {
  const fields: Record<string, string> = {};
  const signed: string[] = [];
  let signature: string | null = null;

  for (const pair of rawBody.split("&")) {
    if (pair === "") continue;
    const eq = pair.indexOf("=");
    const key = formDecodeBytes(eq === -1 ? pair : pair.slice(0, eq)).toString("utf8");
    const value = formDecodeBytes(eq === -1 ? "" : pair.slice(eq + 1));

    if (key === "signature") {
      signature = value.toString("utf8");
      break;
    }
    if (Object.hasOwn(fields, key)) return null;

    fields[key] = value.toString("utf8");
    signed.push(`${key}=${phpUrlencode(value)}`);
  }

  return { fields, paramString: signed.join("&"), signature };
}

/** Whether the ITN's signature is PayFast's, compared in constant time */
export function itnSignatureMatches(itn: ParsedItn, passphrase: string): boolean {
  const received = itn.signature?.toLowerCase() ?? "";
  // An md5 digest is 32 hex characters; anything else cannot match
  if (!/^[0-9a-f]{32}$/.test(received)) return false;
  const expected = md5(withPassphrase(itn.paramString, passphrase));
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

/**
 * The PayFast REST API signature (subscriptions, refunds, transaction
 * history): every header and body value plus the passphrase, sorted by key,
 * PHP-urlencoded, MD5 - PayFast's SDK Auth::generateApiSignature.
 */
export function apiSignature(params: Record<string, string>, passphrase: string): string {
  const data: Record<string, string> = { ...params };
  delete data.signature;
  if (passphrase) data.passphrase = passphrase;

  return md5(
    Object.keys(data)
      .sort()
      .map((key) => `${key}=${phpUrlencode(data[key])}`)
      .join("&"),
  );
}
