// src/lib/server/services/coupon.service.ts
import { db } from "$lib/server/db";
import {
  coupon,
  couponUsage,
  booking,
  type Coupon,
  type CouponUsage,
} from "$lib/server/db/schema";
import { and, eq, gte, lte, or, sql, isNull, inArray } from "drizzle-orm";

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discountAmount?: number;
  error?: string;
}

export interface ApplyCouponResult {
  success: boolean;
  error?: string;
  usageId?: string;
}

/**
 * Service for managing coupons and discount codes
 */
export const couponService = {
  /**
   * Validate a coupon code against booking details
   */
  async validateCoupon(
    code: string,
    userId: string,
    bookingAmount: number
  ): Promise<CouponValidationResult> {
    try {
      // Normalize coupon code (uppercase, trim)
      const normalizedCode = code.trim().toUpperCase();

      // Find the coupon by code
      const [couponData] = await db
        .select()
        .from(coupon)
        .where(eq(coupon.code, normalizedCode))
        .limit(1);

      if (!couponData) {
        return { valid: false, error: "Invalid coupon code" };
      }

      // Check if coupon is active
      if (!couponData.isActive) {
        return { valid: false, error: "This coupon is no longer active" };
      }

      // Check valid date range
      const now = new Date();
      if (couponData.validFrom > now) {
        return { valid: false, error: "This coupon is not yet valid" };
      }

      if (couponData.validUntil && couponData.validUntil < now) {
        return { valid: false, error: "This coupon has expired" };
      }

      // Check minimum booking amount
      const minimumAmount = parseFloat(couponData.minimumBookingAmount as unknown as string);
      if (bookingAmount < minimumAmount) {
        return {
          valid: false,
          error: `Minimum booking amount of R${minimumAmount.toFixed(2)} required for this coupon`,
        };
      }

      // Check global usage limit
      if (
        couponData.maxUsesTotal !== null &&
        couponData.usedCount >= couponData.maxUsesTotal
      ) {
        return { valid: false, error: "This coupon has reached its usage limit" };
      }

      // Check if user has already used this coupon (single-use per customer)
      const [existingUsage] = await db
        .select()
        .from(couponUsage)
        .where(
          and(
            eq(couponUsage.couponId, couponData.id),
            eq(couponUsage.userId, userId)
          )
        )
        .limit(1);

      if (existingUsage) {
        return {
          valid: false,
          error: "You have already used this coupon",
        };
      }

      // Check first-time booking requirement
      if (couponData.requiresFirstBooking) {
        const isFirstTime = await this.isFirstTimeBooker(userId);
        if (!isFirstTime) {
          return {
            valid: false,
            error: "This coupon is only valid for first-time bookings",
          };
        }
      }

      // Calculate discount amount
      const discountAmount = this.calculateDiscount(couponData, bookingAmount);

      return {
        valid: true,
        coupon: couponData,
        discountAmount,
      };
    } catch (error) {
      console.error("Error validating coupon:", error);
      return { valid: false, error: "Failed to validate coupon" };
    }
  },

  /**
   * Apply a coupon to a booking (record usage)
   */
  async applyCoupon(
    couponId: string,
    userId: string,
    bookingId: string,
    discountAmount: number
  ): Promise<ApplyCouponResult> {
    try {
      // Create usage record
      const usageId = crypto.randomUUID();
      await db.insert(couponUsage).values({
        id: usageId,
        couponId,
        userId,
        bookingId,
        discountAmount: discountAmount.toFixed(2),
        usedAt: new Date(),
      });

      // Increment the coupon's usedCount
      await db
        .update(coupon)
        .set({
          usedCount: sql`${coupon.usedCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(coupon.id, couponId));

      return { success: true, usageId };
    } catch (error) {
      console.error("Error applying coupon:", error);
      return { success: false, error: "Failed to apply coupon" };
    }
  },

  /**
   * Check if a user is a first-time booker (no completed bookings)
   */
  async isFirstTimeBooker(userId: string): Promise<boolean> {
    try {
      const [existingBooking] = await db
        .select({ id: booking.id })
        .from(booking)
        .where(
          and(
            eq(booking.userId, userId),
            inArray(booking.status, ["COMPLETED", "CONFIRMED", "IN_PROGRESS"])
          )
        )
        .limit(1);

      return !existingBooking;
    } catch (error) {
      console.error("Error checking first-time booker status:", error);
      return false;
    }
  },

  /**
   * Calculate the discount amount for a coupon
   */
  calculateDiscount(couponData: Coupon, bookingAmount: number): number {
    const discountValue = parseFloat(couponData.discountValue as unknown as string);

    if (couponData.discountType === "PERCENTAGE") {
      // Percentage discount
      return Math.round((bookingAmount * discountValue) / 100 * 100) / 100;
    } else {
      // Fixed amount discount (cap at booking amount)
      return Math.min(discountValue, bookingAmount);
    }
  },

  /**
   * Generate a unique coupon code with an optional prefix
   */
  generateCouponCode(prefix: string = ""): string {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars like 0, O, I, 1, L
    const randomLength = prefix ? 6 : 8;
    let code = prefix.toUpperCase();

    for (let i = 0; i < randomLength; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return code;
  },

  /**
   * Get a coupon by its code
   */
  async getCouponByCode(code: string): Promise<Coupon | null> {
    try {
      const normalizedCode = code.trim().toUpperCase();
      const [couponData] = await db
        .select()
        .from(coupon)
        .where(eq(coupon.code, normalizedCode))
        .limit(1);

      return couponData || null;
    } catch (error) {
      console.error("Error getting coupon by code:", error);
      return null;
    }
  },

  /**
   * Get a coupon by its ID
   */
  async getCouponById(id: string): Promise<Coupon | null> {
    try {
      const [couponData] = await db
        .select()
        .from(coupon)
        .where(eq(coupon.id, id))
        .limit(1);

      return couponData || null;
    } catch (error) {
      console.error("Error getting coupon by ID:", error);
      return null;
    }
  },

  /**
   * Get all coupons (for admin)
   */
  async getAllCoupons(includeInactive: boolean = false): Promise<Coupon[]> {
    try {
      if (includeInactive) {
        return await db.select().from(coupon).orderBy(coupon.createdAt);
      }

      return await db
        .select()
        .from(coupon)
        .where(eq(coupon.isActive, true))
        .orderBy(coupon.createdAt);
    } catch (error) {
      console.error("Error getting all coupons:", error);
      return [];
    }
  },

  /**
   * Create a new coupon
   */
  async createCoupon(data: {
    code?: string;
    name: string;
    description?: string;
    discountType: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue: number;
    minimumBookingAmount: number;
    requiresFirstBooking?: boolean;
    maxUsesTotal?: number | null;
    validFrom: Date;
    validUntil?: Date | null;
    isActive?: boolean;
  }): Promise<Coupon | null> {
    try {
      // Generate code if not provided
      const code = data.code?.trim().toUpperCase() || this.generateCouponCode();

      // Check if code already exists
      const existing = await this.getCouponByCode(code);
      if (existing) {
        throw new Error(`Coupon code "${code}" already exists`);
      }

      const couponId = crypto.randomUUID();
      const [newCoupon] = await db
        .insert(coupon)
        .values({
          id: couponId,
          code,
          name: data.name,
          description: data.description || null,
          discountType: data.discountType,
          discountValue: data.discountValue.toFixed(2),
          minimumBookingAmount: data.minimumBookingAmount.toFixed(2),
          requiresFirstBooking: data.requiresFirstBooking || false,
          maxUsesTotal: data.maxUsesTotal || null,
          usedCount: 0,
          validFrom: data.validFrom,
          validUntil: data.validUntil || null,
          isActive: data.isActive ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return newCoupon;
    } catch (error) {
      console.error("Error creating coupon:", error);
      throw error;
    }
  },

  /**
   * Update an existing coupon
   */
  async updateCoupon(
    id: string,
    data: Partial<{
      code: string;
      name: string;
      description: string | null;
      discountType: "PERCENTAGE" | "FIXED_AMOUNT";
      discountValue: number;
      minimumBookingAmount: number;
      requiresFirstBooking: boolean;
      maxUsesTotal: number | null;
      validFrom: Date;
      validUntil: Date | null;
      isActive: boolean;
    }>
  ): Promise<Coupon | null> {
    try {
      const updateData: Record<string, any> = {
        updatedAt: new Date(),
      };

      if (data.code !== undefined) {
        const normalizedCode = data.code.trim().toUpperCase();
        // Check if new code already exists (excluding current coupon)
        const existing = await this.getCouponByCode(normalizedCode);
        if (existing && existing.id !== id) {
          throw new Error(`Coupon code "${normalizedCode}" already exists`);
        }
        updateData.code = normalizedCode;
      }

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.discountType !== undefined) updateData.discountType = data.discountType;
      if (data.discountValue !== undefined)
        updateData.discountValue = data.discountValue.toFixed(2);
      if (data.minimumBookingAmount !== undefined)
        updateData.minimumBookingAmount = data.minimumBookingAmount.toFixed(2);
      if (data.requiresFirstBooking !== undefined)
        updateData.requiresFirstBooking = data.requiresFirstBooking;
      if (data.maxUsesTotal !== undefined) updateData.maxUsesTotal = data.maxUsesTotal;
      if (data.validFrom !== undefined) updateData.validFrom = data.validFrom;
      if (data.validUntil !== undefined) updateData.validUntil = data.validUntil;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const [updatedCoupon] = await db
        .update(coupon)
        .set(updateData)
        .where(eq(coupon.id, id))
        .returning();

      return updatedCoupon || null;
    } catch (error) {
      console.error("Error updating coupon:", error);
      throw error;
    }
  },

  /**
   * Delete a coupon (soft delete by deactivating)
   */
  async deleteCoupon(id: string): Promise<boolean> {
    try {
      await db
        .update(coupon)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(coupon.id, id));

      return true;
    } catch (error) {
      console.error("Error deleting coupon:", error);
      return false;
    }
  },

  /**
   * Get coupon usage statistics
   */
  async getCouponUsageStats(
    couponId: string
  ): Promise<{ totalUses: number; totalDiscountAmount: number }> {
    try {
      const result = await db
        .select({
          totalUses: sql<number>`count(*)`,
          totalDiscountAmount: sql<number>`coalesce(sum(${couponUsage.discountAmount}::numeric), 0)`,
        })
        .from(couponUsage)
        .where(eq(couponUsage.couponId, couponId));

      return {
        totalUses: Number(result[0]?.totalUses) || 0,
        totalDiscountAmount: Number(result[0]?.totalDiscountAmount) || 0,
      };
    } catch (error) {
      console.error("Error getting coupon usage stats:", error);
      return { totalUses: 0, totalDiscountAmount: 0 };
    }
  },

  /**
   * Get recent coupon usages (for admin)
   */
  async getRecentUsages(
    couponId: string,
    limit: number = 10
  ): Promise<CouponUsage[]> {
    try {
      return await db
        .select()
        .from(couponUsage)
        .where(eq(couponUsage.couponId, couponId))
        .orderBy(couponUsage.usedAt)
        .limit(limit);
    } catch (error) {
      console.error("Error getting recent coupon usages:", error);
      return [];
    }
  },
};
