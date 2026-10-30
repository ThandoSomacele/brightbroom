// src/lib/server/payfast-demo.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const env: Record<string, string | undefined> = {};
const publicEnv: Record<string, string | undefined> = {};
vi.mock("$env/dynamic/private", () => ({ env }));
vi.mock("$env/dynamic/public", () => ({ env: publicEnv }));

const { payFastDemo, payFastMerchant, payFastPassphrase, payFastSandbox } = await import("./payfast-itn");

beforeEach(() => {
  for (const o of [env, publicEnv]) for (const k of Object.keys(o)) delete o[k];
  Object.assign(env, {
    PAYFAST_MERCHANT_ID: "live-id",
    PAYFAST_MERCHANT_KEY: "live-key",
    PAYFAST_PASSPHRASE: "live-pass",
    PAYFAST_SANDBOX_MODE: "false",
    PAYFAST_SANDBOX_MERCHANT_ID: "sandbox-id",
    PAYFAST_SANDBOX_MERCHANT_KEY: "sandbox-key",
    PAYFAST_SANDBOX_PASSPHRASE: "sandbox-pass",
  });
});

describe("PayFast in demo mode", () => {
  it("uses the live merchant normally", () => {
    expect(payFastDemo()).toBe(false);
    expect(payFastSandbox()).toBe(false);
    expect(payFastMerchant()).toEqual({ merchantId: "live-id", merchantKey: "live-key" });
    expect(payFastPassphrase()).toBe("live-pass");
  });

  it("forces the sandbox and the sandbox merchant, whatever PAYFAST_SANDBOX_MODE says", () => {
    publicEnv.PUBLIC_DEMO_MODE = "true";
    expect(payFastSandbox()).toBe(true);
    expect(payFastMerchant()).toEqual({ merchantId: "sandbox-id", merchantKey: "sandbox-key" });
    expect(payFastPassphrase()).toBe("sandbox-pass");
  });

  it("never falls back to the live merchant when sandbox credentials are missing", () => {
    publicEnv.PUBLIC_DEMO_MODE = "true";
    delete env.PAYFAST_SANDBOX_MERCHANT_ID;
    delete env.PAYFAST_SANDBOX_MERCHANT_KEY;
    expect(payFastMerchant()).toEqual({ merchantId: "", merchantKey: "" });
  });

  it("is never on for a company's own site", () => {
    publicEnv.PUBLIC_DEMO_MODE = "true";
    publicEnv.PUBLIC_PLATFORM_MODE = "single";
    expect(payFastDemo()).toBe(false);
    expect(payFastMerchant().merchantId).toBe("live-id");
  });
});
