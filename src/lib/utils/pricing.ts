// src/lib/utils/pricing.ts
// Utility functions for room-based pricing calculations

import type { PricingConfig, Addon } from "$lib/server/db/schema";

// Maximum booking duration: 10 hours = 600 minutes
export const MAX_BOOKING_DURATION_MINUTES = 600;
export const MAX_BOOKING_DURATION_HOURS = 10;

export interface RoomSelection {
  bedroomCount: number;
  bathroomCount: number;
}

export interface SelectedAddon {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
}

export interface PriceBreakdown {
  // Base pricing (Living Room + Kitchen)
  basePrice: number;
  baseDurationMinutes: number;
  // Bedroom pricing
  bedroomCount: number;
  bedroomPricePerRoom: number;
  bedroomTotal: number;
  bedroomDurationMinutes: number;
  // Bathroom pricing
  bathroomCount: number;
  bathroomPricePerRoom: number;
  bathroomTotal: number;
  bathroomDurationMinutes: number;
  // Addons
  addons: SelectedAddon[];
  addonsTotal: number;
  addonsDurationMinutes: number;
  // Totals
  totalPrice: number;
  totalDurationMinutes: number;
  totalDurationHours: number;
  // Duration cap info
  durationCapped: boolean;
  uncappedDurationMinutes: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Calculate the full price breakdown for a cleaning based on room selection and addons
 */
export function calculateCleaningPrice(
  config: PricingConfig,
  rooms: RoomSelection,
  selectedAddons: Addon[] = []
): PriceBreakdown {
  // Parse prices from config (they come as strings from the database)
  const basePrice = parseFloat(config.basePrice as unknown as string) || 130;
  const bedroomPrice =
    parseFloat(config.bedroomPrice as unknown as string) || 50;
  const bathroomPrice =
    parseFloat(config.bathroomPrice as unknown as string) || 50;

  // Parse durations
  const baseDuration = config.baseDurationMinutes || 120;
  const bedroomDuration = config.bedroomDurationMinutes || 60;
  const bathroomDuration = config.bathroomDurationMinutes || 60;

  // Calculate room totals
  const bedroomTotal = rooms.bedroomCount * bedroomPrice;
  const bathroomTotal = rooms.bathroomCount * bathroomPrice;
  const bedroomDurationTotal = rooms.bedroomCount * bedroomDuration;
  const bathroomDurationTotal = rooms.bathroomCount * bathroomDuration;

  // Calculate addon totals
  const addons: SelectedAddon[] = selectedAddons.map((addon) => ({
    id: addon.id,
    name: addon.name,
    price: parseFloat(addon.price as unknown as string) || 0,
    durationMinutes: addon.durationMinutes || 0,
  }));

  const addonsTotal = addons.reduce((sum, addon) => sum + addon.price, 0);
  const addonsDurationTotal = addons.reduce(
    (sum, addon) => sum + addon.durationMinutes,
    0
  );

  // Calculate grand totals
  const totalPrice = basePrice + bedroomTotal + bathroomTotal + addonsTotal;
  const uncappedDurationMinutes =
    baseDuration +
    bedroomDurationTotal +
    bathroomDurationTotal +
    addonsDurationTotal;

  // Apply 10-hour cap to duration
  const durationCapped = uncappedDurationMinutes > MAX_BOOKING_DURATION_MINUTES;
  const totalDurationMinutes = Math.min(uncappedDurationMinutes, MAX_BOOKING_DURATION_MINUTES);
  const totalDurationHours = totalDurationMinutes / 60;

  return {
    basePrice,
    baseDurationMinutes: baseDuration,
    bedroomCount: rooms.bedroomCount,
    bedroomPricePerRoom: bedroomPrice,
    bedroomTotal,
    bedroomDurationMinutes: bedroomDurationTotal,
    bathroomCount: rooms.bathroomCount,
    bathroomPricePerRoom: bathroomPrice,
    bathroomTotal,
    bathroomDurationMinutes: bathroomDurationTotal,
    addons,
    addonsTotal,
    addonsDurationMinutes: addonsDurationTotal,
    totalPrice,
    totalDurationMinutes,
    totalDurationHours,
    durationCapped,
    uncappedDurationMinutes,
  };
}

/**
 * Calculate just the total duration for a cleaning
 */
export function calculateCleaningDuration(
  config: PricingConfig,
  rooms: RoomSelection,
  selectedAddons: Addon[] = []
): number {
  const breakdown = calculateCleaningPrice(config, rooms, selectedAddons);
  return breakdown.totalDurationMinutes;
}

/**
 * Validate room selection against config limits
 */
export function validateRoomSelection(
  config: PricingConfig,
  rooms: RoomSelection
): ValidationResult {
  const bedroomMin = config.bedroomMin || 1;
  const bedroomMax = config.bedroomMax || 10;
  const bathroomMin = config.bathroomMin || 1;
  const bathroomMax = config.bathroomMax || 6;

  if (rooms.bedroomCount < bedroomMin) {
    return {
      valid: false,
      error: `Minimum ${bedroomMin} bedroom${bedroomMin > 1 ? "s" : ""} required`,
    };
  }

  if (rooms.bedroomCount > bedroomMax) {
    return {
      valid: false,
      error: `Maximum ${bedroomMax} bedrooms allowed`,
    };
  }

  if (rooms.bathroomCount < bathroomMin) {
    return {
      valid: false,
      error: `Minimum ${bathroomMin} bathroom${bathroomMin > 1 ? "s" : ""} required`,
    };
  }

  if (rooms.bathroomCount > bathroomMax) {
    return {
      valid: false,
      error: `Maximum ${bathroomMax} bathrooms allowed`,
    };
  }

  return { valid: true };
}

/**
 * Format price for display (South African Rand)
 */
export function formatPrice(amount: number): string {
  return `R${amount.toFixed(2)}`;
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  } else if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  } else {
    return `${hours}h ${remainingMinutes}m`;
  }
}

/**
 * Apply a discount percentage to a price breakdown
 */
export function applyDiscount(
  breakdown: PriceBreakdown,
  discountPercentage: number
): {
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  discountPercentage: number;
} {
  const discountAmount = (breakdown.totalPrice * discountPercentage) / 100;
  const finalPrice = breakdown.totalPrice - discountAmount;

  return {
    originalPrice: breakdown.totalPrice,
    discountAmount,
    finalPrice,
    discountPercentage,
  };
}

/**
 * Get recurring discount percentage based on frequency
 */
export function getRecurringDiscount(
  frequency: "WEEKLY" | "BIWEEKLY" | "TWICE_WEEKLY" | "TWICE_MONTHLY"
): number {
  const discounts: Record<string, number> = {
    WEEKLY: 10,
    BIWEEKLY: 8,
    TWICE_WEEKLY: 15,
    TWICE_MONTHLY: 7,
  };
  return discounts[frequency] || 0;
}

/**
 * Create a simple price breakdown object for storage
 */
export function createPriceRecord(breakdown: PriceBreakdown): {
  basePrice: string;
  bedroomCount: number;
  bathroomCount: number;
  addons: { id: string; name: string; price: string }[];
  totalPrice: string;
  totalDurationMinutes: number;
} {
  return {
    basePrice: breakdown.basePrice.toFixed(2),
    bedroomCount: breakdown.bedroomCount,
    bathroomCount: breakdown.bathroomCount,
    addons: breakdown.addons.map((a) => ({
      id: a.id,
      name: a.name,
      price: a.price.toFixed(2),
    })),
    totalPrice: breakdown.totalPrice.toFixed(2),
    totalDurationMinutes: breakdown.totalDurationMinutes,
  };
}

/**
 * Apply a coupon discount to a price breakdown
 */
export function applyCouponDiscount(
  breakdown: PriceBreakdown,
  coupon: { discountType: "PERCENTAGE" | "FIXED_AMOUNT"; discountValue: number }
): {
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
} {
  const originalPrice = breakdown.totalPrice;
  let discountAmount: number;

  if (coupon.discountType === "PERCENTAGE") {
    // Percentage discount
    discountAmount = Math.round((originalPrice * coupon.discountValue) / 100 * 100) / 100;
  } else {
    // Fixed amount discount (cap at original price)
    discountAmount = Math.min(coupon.discountValue, originalPrice);
  }

  const finalPrice = originalPrice - discountAmount;

  return {
    originalPrice,
    discountAmount,
    finalPrice,
  };
}
