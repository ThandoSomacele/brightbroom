// src/lib/utils/payout-calculator.ts

/**
 * PayFast Fee Structure (as of implementation):
 * - Credit Cards: 3.5% + R2.00
 * - Instant EFT: 2% (min R2.00)
 * - Payout Fee: R10.01 incl. VAT (handled separately during payout)
 */

export type PaymentMethodType =
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'EFT'
  | 'MOBICRED'
  | 'SNAPSCAN'
  | 'ZAPPER'
  | 'OTHER';

export interface PayoutBreakdown {
  bookingAmount: number;
  payFastFee: number;
  netAfterFees: number;
  commissionRate: number;
  commissionAmount: number;
  cleanerPayout: number;
}

/**
 * Fee rule for a single payment method.
 * fee = (amount * percent) + fixed, clamped to a minimum of `min` when set.
 */
export interface PayFastFeeRule {
  percent: number; // fraction, e.g. 0.035 for 3.5%
  fixed: number;   // flat amount in Rands, e.g. 2.00
  min?: number;    // minimum fee in Rands, e.g. 2.00 for EFT
}

/**
 * Resolved payout configuration used to compute breakdowns.
 * Loaded from the pricing_config row server-side (see payout-config.service.ts);
 * defaults to DEFAULT_PAYOUT_CONFIG when no config has been saved.
 */
export interface PayoutConfig {
  commissionRate: number; // fraction, e.g. 0.20 for 20%
  fees: Record<PaymentMethodType, PayFastFeeRule>;
}

/**
 * Platform commission rate (20% of net after PayFast fees)
 */
export const PLATFORM_COMMISSION_RATE = 0.20;

/**
 * Default payout configuration — mirrors the historical hardcoded values so
 * behaviour is unchanged until an admin saves overrides in /admin/pricing.
 */
export const DEFAULT_PAYOUT_CONFIG: PayoutConfig = {
  commissionRate: PLATFORM_COMMISSION_RATE,
  fees: {
    CREDIT_CARD: { percent: 0.035, fixed: 2.0 },
    DEBIT_CARD: { percent: 0.035, fixed: 2.0 },
    EFT: { percent: 0.02, fixed: 0, min: 2.0 },
    MOBICRED: { percent: 0.025, fixed: 1.5 },
    SNAPSCAN: { percent: 0.025, fixed: 0 },
    ZAPPER: { percent: 0.025, fixed: 0 },
    OTHER: { percent: 0.035, fixed: 2.0 },
  },
};

/**
 * PayFast payout fee (R10.01 incl. VAT per payout)
 * This is deducted from the cleaner's payout during batch processing
 */
export const PAYFAST_PAYOUT_FEE = 10.01;

/**
 * Calculate PayFast transaction fee based on payment method
 *
 * @param amount - The transaction amount in Rands
 * @param paymentMethod - The payment method used
 * @param config - Optional payout config; defaults to DEFAULT_PAYOUT_CONFIG
 * @returns The PayFast fee amount
 */
export function calculatePayFastFee(
  amount: number,
  paymentMethod: PaymentMethodType,
  config: PayoutConfig = DEFAULT_PAYOUT_CONFIG
): number {
  const rule = config.fees[paymentMethod] ?? config.fees.OTHER ?? DEFAULT_PAYOUT_CONFIG.fees.OTHER;
  let fee = amount * rule.percent + rule.fixed;
  if (rule.min != null) {
    fee = Math.max(fee, rule.min);
  }
  return roundToTwoDecimals(fee);
}

/**
 * Calculate the full payout breakdown for a booking
 *
 * Formula:
 * 1. Customer pays booking amount
 * 2. PayFast deducts transaction fee
 * 3. Net after fees = booking amount - PayFast fee
 * 4. BrightBroom commission = 20% of net after fees
 * 5. Cleaner payout = net after fees - commission
 *
 * Example with R500 credit card payment:
 *   Booking amount:                  R500.00
 *   PayFast fee (3.5% + R2):        -R19.50
 *   Net after fees:                  R480.50
 *   BrightBroom commission (20%):   -R96.10
 *   Cleaner payout:                  R384.40
 *
 * @param bookingAmount - The booking amount in Rands
 * @param paymentMethod - The payment method used
 * @param config - Optional payout config (commission rate + PayFast fees).
 *                 For backward compatibility a bare number is treated as a
 *                 custom commission rate. Defaults to DEFAULT_PAYOUT_CONFIG.
 * @returns PayoutBreakdown with all calculated values
 */
export function calculatePayout(
  bookingAmount: number,
  paymentMethod: PaymentMethodType,
  config?: number | PayoutConfig
): PayoutBreakdown {
  // Backward-compat: a number means "override just the commission rate".
  const resolved: PayoutConfig =
    typeof config === "number"
      ? { ...DEFAULT_PAYOUT_CONFIG, commissionRate: config }
      : config ?? DEFAULT_PAYOUT_CONFIG;

  const payFastFee = calculatePayFastFee(bookingAmount, paymentMethod, resolved);
  const netAfterFees = roundToTwoDecimals(bookingAmount - payFastFee);

  const commissionRate = resolved.commissionRate;
  const commissionAmount = roundToTwoDecimals(netAfterFees * commissionRate);
  const cleanerPayout = roundToTwoDecimals(netAfterFees - commissionAmount);

  return {
    bookingAmount,
    payFastFee,
    netAfterFees,
    commissionRate,
    commissionAmount,
    cleanerPayout
  };
}

/**
 * Calculate payout from stored payment data (when fee is already known)
 *
 * @param bookingAmount - The booking amount
 * @param payFastFee - The already-calculated PayFast fee
 * @param customCommissionRate - Optional custom commission rate (defaults to 20%)
 * @returns PayoutBreakdown with all calculated values
 */
export function calculatePayoutFromStoredFee(
  bookingAmount: number,
  payFastFee: number,
  customCommissionRate?: number
): PayoutBreakdown {
  const netAfterFees = roundToTwoDecimals(bookingAmount - payFastFee);

  const commissionRate = customCommissionRate ?? PLATFORM_COMMISSION_RATE;
  const commissionAmount = roundToTwoDecimals(netAfterFees * commissionRate);
  const cleanerPayout = roundToTwoDecimals(netAfterFees - commissionAmount);

  return {
    bookingAmount,
    payFastFee,
    netAfterFees,
    commissionRate,
    commissionAmount,
    cleanerPayout
  };
}

/**
 * Resolve the cleaner payout for a booking.
 *
 * Prefers the actual amount captured on the payment record at payment time;
 * if that hasn't been populated yet, it estimates from the booking price and
 * payment method (defaulting to credit card). Money fields are stored as
 * strings in the DB, so inputs are coerced with Number().
 */
export function resolveCleanerPayout(
  bookingPrice: number | string,
  paymentMethod?: string | null,
  storedPayout?: number | string | null,
): number {
  if (storedPayout !== null && storedPayout !== undefined && storedPayout !== "") {
    const stored = Number(storedPayout);
    if (!Number.isNaN(stored)) return stored;
  }

  const price = Number(bookingPrice) || 0;
  const method = (paymentMethod as PaymentMethodType) || "CREDIT_CARD";
  return calculatePayout(price, method).cleanerPayout;
}

/**
 * Round a number to two decimal places
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Format a payout breakdown as a readable summary
 */
export function formatPayoutSummary(breakdown: PayoutBreakdown): string {
  const formatCurrency = (amount: number) =>
    `R${amount.toFixed(2)}`;

  return [
    `Booking Amount:      ${formatCurrency(breakdown.bookingAmount)}`,
    `PayFast Fee:        -${formatCurrency(breakdown.payFastFee)}`,
    `Net After Fees:      ${formatCurrency(breakdown.netAfterFees)}`,
    `Commission (${(breakdown.commissionRate * 100).toFixed(0)}%): -${formatCurrency(breakdown.commissionAmount)}`,
    `Cleaner Payout:      ${formatCurrency(breakdown.cleanerPayout)}`
  ].join('\n');
}
