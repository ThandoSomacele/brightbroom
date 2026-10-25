// src/lib/server/payfast-signature.test.ts
import crypto from "crypto";
import { describe, expect, it } from "vitest";
import {
  itnSignatureMatches,
  parseItn,
  phpUrlencode,
  signedCheckoutQuery,
} from "./payfast-signature";

const md5 = (s: string) => crypto.createHash("md5").update(s).digest("hex");

/**
 * A real PayFast sandbox ITN (sandbox merchant 10000100, sandbox buyer
 * sbtu01@payfast.co.za), from the activemerchant/offsite_payments test suite
 * (test/unit/integrations/pay_fast/pay_fast_notification_test.rb). PayFast
 * signed it with no passphrase. The old validator, which rebuilt the
 * signature with the checkout signer, computed 0c73e245... for it and
 * rejected it.
 */
const SANDBOX_ITN =
  "m_payment_id=&pf_payment_id=46591&payment_status=COMPLETE&item_name=Name&item_description=&amount_gross=123.00&amount_fee=-2.80&amount_net=120.20&custom_str1=&custom_str2=&custom_str3=&custom_str4=&custom_str5=&custom_int1=&custom_int2=&custom_int3=&custom_int4=&custom_int5=&name_first=Test&name_last=User+01&email_address=sbtu01%40payfast.co.za&merchant_id=10000100&signature=bae21e96d4dc7bf36bd1a6bb1a103f5f";

/**
 * The same fields signed with PayFast's documented sandbox passphrase
 * "jt7NOE43FZPn" (signature computed separately, not with this module).
 */
const PASSPHRASE = "jt7NOE43FZPn";
const SANDBOX_ITN_WITH_PASSPHRASE = SANDBOX_ITN.replace(
  "bae21e96d4dc7bf36bd1a6bb1a103f5f",
  "e3d1d67ef6e75ac79dcc70a0ad016bec",
);

describe("phpUrlencode", () => {
  it("encodes like PHP urlencode, not encodeURIComponent", () => {
    expect(phpUrlencode("O'Brien")).toBe("O%27Brien");
    expect(phpUrlencode("Deep Clean (3 bedrooms)!")).toBe("Deep+Clean+%283+bedrooms%29%21");
    expect(phpUrlencode("a~b*c")).toBe("a%7Eb%2Ac");
    expect(phpUrlencode("sbtu01@payfast.co.za")).toBe("sbtu01%40payfast.co.za");
    expect(phpUrlencode("https://x.co/a?b=1&c=2")).toBe("https%3A%2F%2Fx.co%2Fa%3Fb%3D1%26c%3D2");
    expect(phpUrlencode("Zoë")).toBe("Zo%C3%AB");
    expect(phpUrlencode("A-Z_a.z09")).toBe("A-Z_a.z09");
  });
});

describe("ITN signature", () => {
  it("verifies a real PayFast sandbox ITN", () => {
    const itn = parseItn(SANDBOX_ITN)!;
    expect(itnSignatureMatches(itn, "")).toBe(true);
  });

  it("keeps every posted field, empty ones included, in posted order", () => {
    const itn = parseItn(SANDBOX_ITN)!;
    expect(itn.paramString).toBe(SANDBOX_ITN.split("&signature=")[0]);
    expect(itn.fields.amount_gross).toBe("123.00");
    expect(itn.fields.name_last).toBe("User 01");
    expect(itn.fields.email_address).toBe("sbtu01@payfast.co.za");
  });

  it("rejects a tampered copy", () => {
    const tampered = SANDBOX_ITN.replace("amount_gross=123.00", "amount_gross=1.00");
    expect(itnSignatureMatches(parseItn(tampered)!, "")).toBe(false);

    const reordered = SANDBOX_ITN.replace(
      "name_first=Test&name_last=User+01",
      "name_last=User+01&name_first=Test",
    );
    expect(itnSignatureMatches(parseItn(reordered)!, "")).toBe(false);
  });

  it("checks the passphrase", () => {
    expect(itnSignatureMatches(parseItn(SANDBOX_ITN_WITH_PASSPHRASE)!, PASSPHRASE)).toBe(true);
    expect(itnSignatureMatches(parseItn(SANDBOX_ITN_WITH_PASSPHRASE)!, "")).toBe(false);
    expect(itnSignatureMatches(parseItn(SANDBOX_ITN)!, PASSPHRASE)).toBe(false);
    expect(itnSignatureMatches(parseItn(SANDBOX_ITN_WITH_PASSPHRASE)!, `${PASSPHRASE}x`)).toBe(false);
  });

  it("accepts the signature in either case, and nothing that is not an md5", () => {
    const upper = SANDBOX_ITN.replace(/signature=(\w+)$/, (_, s) => `signature=${s.toUpperCase()}`);
    expect(itnSignatureMatches(parseItn(upper)!, "")).toBe(true);
    expect(itnSignatureMatches(parseItn(SANDBOX_ITN.replace(/&signature=\w+$/, ""))!, "")).toBe(false);
    expect(itnSignatureMatches(parseItn(SANDBOX_ITN.replace(/signature=\w+$/, "signature=zz"))!, "")).toBe(false);
  });

  it("does not trust fields posted after the signature", () => {
    const itn = parseItn(`${SANDBOX_ITN}&amount_gross=1.00&custom_str9=x`)!;
    expect(itnSignatureMatches(itn, "")).toBe(true);
    expect(itn.fields.amount_gross).toBe("123.00");
    expect(itn.fields).not.toHaveProperty("custom_str9");
  });

  it("refuses a body that repeats a field", () => {
    expect(parseItn(`amount_gross=1.00&${SANDBOX_ITN}`)).toBeNull();
  });

  it("re-encodes values PHP-style, whatever the transport encoding", () => {
    // PayFast hashes urlencode() of the decoded value, so "'" and "%27", or
    // "%7e" and "~", must give the same string to hash
    const a = parseItn("name_last=O'Brien&item_name=a~b&signature=x")!;
    const b = parseItn("name_last=O%27Brien&item_name=a%7eb&signature=x")!;
    expect(a.paramString).toBe("name_last=O%27Brien&item_name=a%7Eb");
    expect(b.paramString).toBe(a.paramString);
  });

  it("hashes non-UTF-8 bytes as posted, as PHP would", () => {
    const itn = parseItn("name_first=Ren%E9&signature=x")!;
    expect(itn.paramString).toBe("name_first=Ren%E9");
  });
});

describe("signedCheckoutQuery", () => {
  const base = {
    merchant_id: "10000100",
    merchant_key: "46f0cd694581a",
    return_url: "https://example.com/payment/success?booking_id=b1",
    notify_url: "https://example.com/api/payments/ipn",
    name_first: " Sean ",
    name_last: "O'Brien",
    email_address: "sean@example.com",
    m_payment_id: "p1",
    amount: "100.00",
    item_name: "Deep Clean (3 bedrooms)!",
  };

  it("signs and sends the fields in PayFast's order, PHP-encoded and trimmed", () => {
    const query = signedCheckoutQuery(base, "pass phrase");
    const paramString =
      "merchant_id=10000100&merchant_key=46f0cd694581a" +
      "&return_url=https%3A%2F%2Fexample.com%2Fpayment%2Fsuccess%3Fbooking_id%3Db1" +
      "&notify_url=https%3A%2F%2Fexample.com%2Fapi%2Fpayments%2Fipn" +
      "&name_first=Sean&name_last=O%27Brien&email_address=sean%40example.com" +
      "&m_payment_id=p1&amount=100.00&item_name=Deep+Clean+%283+bedrooms%29%21";
    expect(query).toBe(
      `${paramString}&signature=${md5(`${paramString}&passphrase=pass+phrase`)}`,
    );
  });

  it("orders custom_int before custom_str, as PayFast does", () => {
    // Insertion order deliberately reversed; the sandbox rejects str-before-int
    const query = signedCheckoutQuery({ custom_str1: "b1", custom_int1: 7, ...base }, "");
    expect(query.indexOf("custom_int1=7")).toBeLessThan(query.indexOf("custom_str1=b1"));
    expect(query.indexOf("item_name=")).toBeLessThan(query.indexOf("custom_int1=7"));
  });

  it("leaves out blank values and signs without a passphrase when there is none", () => {
    const query = signedCheckoutQuery({ ...base, item_description: "  ", cell_number: undefined }, "");
    expect(query).not.toContain("item_description");
    expect(query).not.toContain("cell_number");
    const [paramString, signature] = query.split("&signature=");
    expect(signature).toBe(md5(paramString));
  });

  it("refuses a field PayFast would not sign", () => {
    expect(() => signedCheckoutQuery({ ...base, passphrase: "x" } as never, "")).toThrow(
      /Unknown PayFast checkout field/,
    );
  });
});
