// src/lib/server/services/payout-config.service.ts
import { db } from "$lib/server/db";
import { pricingConfig } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import {
  DEFAULT_PAYOUT_CONFIG,
  type PayFastFeeRule,
  type PaymentMethodType,
  type PayoutConfig,
} from "$lib/utils/payout-calculator";

const PAYMENT_METHODS: PaymentMethodType[] = [
  "CREDIT_CARD",
  "DEBIT_CARD",
  "EFT",
  "MOBICRED",
  "SNAPSCAN",
  "ZAPPER",
  "OTHER",
];

/**
 * Coerce a stored fee rule (from JSON, values may be strings) into a clean
 * PayFastFeeRule, falling back to the default for that method when missing or
 * malformed so a partial/invalid config can never break payout maths.
 */
function sanitizeRule(
  raw: unknown,
  fallback: PayFastFeeRule,
): PayFastFeeRule {
  if (!raw || typeof raw !== "object") return { ...fallback };
  const r = raw as Record<string, unknown>;

  const percent = Number(r.percent);
  const fixed = Number(r.fixed);
  const min = r.min === undefined || r.min === null ? undefined : Number(r.min);

  return {
    percent: Number.isFinite(percent) && percent >= 0 ? percent : fallback.percent,
    fixed: Number.isFinite(fixed) && fixed >= 0 ? fixed : fallback.fixed,
    min: min !== undefined && Number.isFinite(min) && min >= 0 ? min : fallback.min,
  };
}

/**
 * Build a full, valid PayoutConfig from the persisted pricing_config row.
 * Always returns every payment method (defaults fill any gaps).
 */
function buildConfig(
  commissionPercent: unknown,
  payfastFees: unknown,
): PayoutConfig {
  // Stored as a percentage (e.g. "20.00"); convert to a fraction.
  const pct = Number(commissionPercent);
  const commissionRate =
    Number.isFinite(pct) && pct >= 0 && pct <= 100
      ? pct / 100
      : DEFAULT_PAYOUT_CONFIG.commissionRate;

  const storedFees =
    payfastFees && typeof payfastFees === "object"
      ? (payfastFees as Record<string, unknown>)
      : {};

  const fees = {} as Record<PaymentMethodType, PayFastFeeRule>;
  for (const method of PAYMENT_METHODS) {
    fees[method] = sanitizeRule(
      storedFees[method],
      DEFAULT_PAYOUT_CONFIG.fees[method],
    );
  }

  return { commissionRate, fees };
}

export const payoutConfigService = {
  /**
   * Load the active payout configuration (commission rate + PayFast fees).
   * Falls back to DEFAULT_PAYOUT_CONFIG when no row exists or on error, so
   * payout calculations never fail due to missing/invalid config.
   */
  async getPayoutConfig(): Promise<PayoutConfig> {
    try {
      const [cfg] = await db
        .select({
          platformCommissionRate: pricingConfig.platformCommissionRate,
          payfastFees: pricingConfig.payfastFees,
        })
        .from(pricingConfig)
        .where(eq(pricingConfig.id, "default"))
        .limit(1);

      if (!cfg) return DEFAULT_PAYOUT_CONFIG;
      return buildConfig(cfg.platformCommissionRate, cfg.payfastFees);
    } catch (error) {
      console.error("Error loading payout config, using defaults:", error);
      return DEFAULT_PAYOUT_CONFIG;
    }
  },

  /** Exposed for callers that already hold the raw row values. */
  buildConfig,
};
