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
  /**
   * What the cleaner is owed.
   *
   * On a booking belonging to a cleaning company this is what THAT COMPANY
   * owes its cleaner out of its own share — the platform does not pay it.
   * Only on platform-owner bookings is this a platform liability.
   */
  cleanerPayout: number;
  /**
   * What the cleaning company is owed. Zero on platform-owner bookings, where
   * there is no third party between the platform and the cleaner.
   */
  tenantPayout: number;
}

/**
 * Platform commission rate (20% of net after PayFast fees)
 */
export const PLATFORM_COMMISSION_RATE = 0.20;

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
 * @returns The PayFast fee amount
 */
export function calculatePayFastFee(amount: number, paymentMethod: PaymentMethodType): number {
  switch (paymentMethod) {
    case 'CREDIT_CARD':
    case 'DEBIT_CARD':
      // Credit/Debit cards: 3.5% + R2.00 flat fee
      return roundToTwoDecimals((amount * 0.035) + 2.00);

    case 'EFT':
      // Instant EFT: 2% with minimum R2.00
      const eftFee = amount * 0.02;
      return roundToTwoDecimals(Math.max(eftFee, 2.00));

    case 'MOBICRED':
      // Mobicred: typically 2.5% + R1.50
      return roundToTwoDecimals((amount * 0.025) + 1.50);

    case 'SNAPSCAN':
    case 'ZAPPER':
      // SnapScan/Zapper: typically 2.5%
      return roundToTwoDecimals(amount * 0.025);

    case 'OTHER':
    default:
      // Default to credit card fees as conservative estimate
      return roundToTwoDecimals((amount * 0.035) + 2.00);
  }
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
 * @param customCommissionRate - Optional custom commission rate (defaults to 20%)
 * @returns PayoutBreakdown with all calculated values
 */
export function calculatePayout(
  bookingAmount: number,
  paymentMethod: PaymentMethodType,
  customCommissionRate?: number,
  isPlatformOwnerBooking: boolean = true
): PayoutBreakdown {
  const payFastFee = calculatePayFastFee(bookingAmount, paymentMethod);
  const netAfterFees = roundToTwoDecimals(bookingAmount - payFastFee);

  const commissionRate = customCommissionRate ?? PLATFORM_COMMISSION_RATE;
  const commissionAmount = roundToTwoDecimals(netAfterFees * commissionRate);
  const remainder = roundToTwoDecimals(netAfterFees - commissionAmount);

  return {
    bookingAmount,
    payFastFee,
    netAfterFees,
    commissionRate,
    commissionAmount,
    ...splitRemainder(remainder, isPlatformOwnerBooking)
  };
}

/**
 * Decide who the money left after commission belongs to.
 *
 * On the platform's own bookings it goes straight to the cleaner, as it always
 * has. On a cleaning company's booking it goes to the company, which pays its
 * own cleaner from it — so the same figure is reported as the cleaner's due for
 * the company's records, but it is the company's liability rather than ours.
 *
 * Defaults to the platform-owner shape so any caller that has not been taught
 * about tenants keeps producing today's numbers.
 */
function splitRemainder(
  remainder: number,
  isPlatformOwnerBooking: boolean
): { cleanerPayout: number; tenantPayout: number } {
  return isPlatformOwnerBooking
    ? { cleanerPayout: remainder, tenantPayout: 0 }
    : { cleanerPayout: 0, tenantPayout: remainder };
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
  customCommissionRate?: number,
  isPlatformOwnerBooking: boolean = true
): PayoutBreakdown {
  const netAfterFees = roundToTwoDecimals(bookingAmount - payFastFee);

  const commissionRate = customCommissionRate ?? PLATFORM_COMMISSION_RATE;
  const commissionAmount = roundToTwoDecimals(netAfterFees * commissionRate);
  const remainder = roundToTwoDecimals(netAfterFees - commissionAmount);

  return {
    bookingAmount,
    payFastFee,
    netAfterFees,
    commissionRate,
    commissionAmount,
    ...splitRemainder(remainder, isPlatformOwnerBooking)
  };
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

  const recipient = breakdown.tenantPayout > 0
    ? `Company Payout:      ${formatCurrency(breakdown.tenantPayout)}`
    : `Cleaner Payout:      ${formatCurrency(breakdown.cleanerPayout)}`;

  return [
    `Booking Amount:      ${formatCurrency(breakdown.bookingAmount)}`,
    `PayFast Fee:        -${formatCurrency(breakdown.payFastFee)}`,
    `Net After Fees:      ${formatCurrency(breakdown.netAfterFees)}`,
    `Commission (${(breakdown.commissionRate * 100).toFixed(0)}%): -${formatCurrency(breakdown.commissionAmount)}`,
    recipient
  ].join('\n');
}
