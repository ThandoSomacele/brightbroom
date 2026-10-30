// src/lib/server/receipt-vat.test.ts
import { describe, expect, it } from "vitest";
import { getPaymentReceiptTemplate } from "./email-templates";

const payment = {
  id: "pay-1",
  createdAt: "2026-10-30T08:00:00Z",
  amount: 115,
  booking: {
    id: "booking-1",
    service: { name: "General Clean" },
    scheduledDate: "2026-11-02T08:00:00Z",
    address: { street: "1 Main Rd", city: "Cape Town", state: "WC", zipCode: "8005" },
  },
  user: { firstName: "Thandi", lastName: "M" },
};
const base = { appUrl: "https://sparkle.co.za", brandName: "Sparkle", primaryColor: "#000000", secondaryColor: "#ffffff" };

describe("receipt VAT", () => {
  it("mentions no VAT for a business that isn't VAT-registered", () => {
    const { html, text } = getPaymentReceiptTemplate("a@b.co.za", payment, base);
    expect(html).not.toContain("VAT");
    expect(text).not.toContain("VAT");
    expect(text).toMatch(/Total: R\s?115[.,]00/);
  });

  it("shows the VAT included in the price, with the VAT number, when registered", () => {
    const { html, text } = getPaymentReceiptTemplate("a@b.co.za", payment, { ...base, vatNumber: "4123456789" });
    // R115 including 15% VAT holds R15 VAT (not R17.25)
    expect(text).toMatch(/VAT \(15%, included\), VAT no\. 4123456789: R\s?15[.,]00/);
    expect(html).toContain("4123456789");
  });
});
