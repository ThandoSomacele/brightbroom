// src/routes/admin/coupons/+page.server.ts
import { error, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { couponService } from "$lib/server/services/coupon.service";
import type { Coupon } from "$lib/server/db/schema";

interface CouponWithStats extends Coupon {
  totalDiscountAmount?: number;
}

// Helper function to fetch coupons
async function getCoupons(): Promise<CouponWithStats[]> {
  try {
    const coupons = await couponService.getAllCoupons(true);

    // Get usage stats for each coupon
    const couponsWithStats = await Promise.all(
      coupons.map(async (coupon) => {
        const stats = await couponService.getCouponUsageStats(coupon.id);
        return {
          ...coupon,
          totalDiscountAmount: stats.totalDiscountAmount,
        };
      })
    );

    return couponsWithStats;
  } catch (err) {
    console.error("Error loading coupons:", err);
    return [];
  }
}

export const load: PageServerLoad = async ({ locals }) => {
  // Check if user is authenticated and is an admin
  if (!locals.user || locals.user.role !== "ADMIN") {
    throw error(403, "Unauthorized");
  }

  // Return streamed data
  return {
    streamed: {
      coupons: getCoupons(),
    },
  };
};

export const actions: Actions = {
  // Create a new coupon
  create: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== "ADMIN") {
      return fail(403, { error: "Unauthorized" });
    }

    const formData = await request.formData();
    const code = formData.get("code")?.toString();
    const name = formData.get("name")?.toString();
    const description = formData.get("description")?.toString();
    const discountType = formData.get("discountType")?.toString() as "PERCENTAGE" | "FIXED_AMOUNT";
    const discountValue = formData.get("discountValue")?.toString();
    const minimumBookingAmount = formData.get("minimumBookingAmount")?.toString();
    const requiresFirstBooking = formData.get("requiresFirstBooking") === "true";
    const maxUsesTotal = formData.get("maxUsesTotal")?.toString();
    const validFrom = formData.get("validFrom")?.toString();
    const validUntil = formData.get("validUntil")?.toString();
    const isActive = formData.get("isActive") !== "false";

    if (!name || !discountType || !discountValue || !minimumBookingAmount || !validFrom) {
      return fail(400, {
        error: "Required fields are missing",
        data: { code, name, discountType, discountValue, minimumBookingAmount, validFrom },
      });
    }

    try {
      const parsedDiscountValue = parseFloat(discountValue);
      const parsedMinimumBookingAmount = parseFloat(minimumBookingAmount);
      const parsedMaxUsesTotal = maxUsesTotal ? parseInt(maxUsesTotal) : null;

      if (isNaN(parsedDiscountValue) || isNaN(parsedMinimumBookingAmount)) {
        return fail(400, {
          error: "Discount value and minimum booking amount must be valid numbers",
          data: { code, name, discountType, discountValue, minimumBookingAmount, validFrom },
        });
      }

      // Validate percentage discount doesn't exceed 100%
      if (discountType === "PERCENTAGE" && parsedDiscountValue > 100) {
        return fail(400, {
          error: "Percentage discount cannot exceed 100%",
          data: { code, name, discountType, discountValue, minimumBookingAmount, validFrom },
        });
      }

      const newCoupon = await couponService.createCoupon({
        code: code || undefined,
        name,
        description: description || undefined,
        discountType,
        discountValue: parsedDiscountValue,
        minimumBookingAmount: parsedMinimumBookingAmount,
        requiresFirstBooking,
        maxUsesTotal: parsedMaxUsesTotal,
        validFrom: new Date(validFrom),
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive,
      });

      return {
        success: true,
        message: `Coupon "${newCoupon?.code}" created successfully`,
      };
    } catch (err) {
      console.error("Error creating coupon:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create coupon";
      return fail(500, {
        error: errorMessage,
        data: { code, name, discountType, discountValue, minimumBookingAmount, validFrom },
      });
    }
  },

  // Update an existing coupon
  update: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== "ADMIN") {
      return fail(403, { error: "Unauthorized" });
    }

    const formData = await request.formData();
    const id = formData.get("id")?.toString();
    const code = formData.get("code")?.toString();
    const name = formData.get("name")?.toString();
    const description = formData.get("description")?.toString();
    const discountType = formData.get("discountType")?.toString() as "PERCENTAGE" | "FIXED_AMOUNT";
    const discountValue = formData.get("discountValue")?.toString();
    const minimumBookingAmount = formData.get("minimumBookingAmount")?.toString();
    const requiresFirstBooking = formData.get("requiresFirstBooking") === "true";
    const maxUsesTotal = formData.get("maxUsesTotal")?.toString();
    const validFrom = formData.get("validFrom")?.toString();
    const validUntil = formData.get("validUntil")?.toString();
    const isActive = formData.get("isActive") === "true";

    if (!id || !name || !discountType || !discountValue || !minimumBookingAmount || !validFrom) {
      return fail(400, {
        error: "Required fields are missing",
        data: { id, code, name, discountType, discountValue, minimumBookingAmount, validFrom },
      });
    }

    try {
      const parsedDiscountValue = parseFloat(discountValue);
      const parsedMinimumBookingAmount = parseFloat(minimumBookingAmount);
      const parsedMaxUsesTotal = maxUsesTotal ? parseInt(maxUsesTotal) : null;

      if (isNaN(parsedDiscountValue) || isNaN(parsedMinimumBookingAmount)) {
        return fail(400, {
          error: "Discount value and minimum booking amount must be valid numbers",
          data: { id, code, name, discountType, discountValue, minimumBookingAmount, validFrom },
        });
      }

      // Validate percentage discount doesn't exceed 100%
      if (discountType === "PERCENTAGE" && parsedDiscountValue > 100) {
        return fail(400, {
          error: "Percentage discount cannot exceed 100%",
          data: { id, code, name, discountType, discountValue, minimumBookingAmount, validFrom },
        });
      }

      await couponService.updateCoupon(id, {
        code,
        name,
        description: description || null,
        discountType,
        discountValue: parsedDiscountValue,
        minimumBookingAmount: parsedMinimumBookingAmount,
        requiresFirstBooking,
        maxUsesTotal: parsedMaxUsesTotal,
        validFrom: new Date(validFrom),
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive,
      });

      return {
        success: true,
        message: "Coupon updated successfully",
      };
    } catch (err) {
      console.error("Error updating coupon:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update coupon";
      return fail(500, {
        error: errorMessage,
        data: { id, code, name, discountType, discountValue, minimumBookingAmount, validFrom },
      });
    }
  },

  // Toggle coupon active status
  toggleActive: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== "ADMIN") {
      return fail(403, { error: "Unauthorized" });
    }

    const formData = await request.formData();
    const id = formData.get("id")?.toString();
    const isActive = formData.get("isActive") === "true";

    if (!id) {
      return fail(400, { error: "Coupon ID is required" });
    }

    try {
      await couponService.updateCoupon(id, { isActive });

      return {
        success: true,
        message: `Coupon ${isActive ? "activated" : "deactivated"} successfully`,
      };
    } catch (err) {
      console.error("Error toggling coupon status:", err);
      return fail(500, {
        error: "Failed to update coupon status",
      });
    }
  },

  // Delete a coupon (soft delete)
  delete: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== "ADMIN") {
      return fail(403, { error: "Unauthorized" });
    }

    const formData = await request.formData();
    const id = formData.get("id")?.toString();

    if (!id) {
      return fail(400, { error: "Coupon ID is required" });
    }

    try {
      await couponService.deleteCoupon(id);

      return {
        success: true,
        message: "Coupon deleted successfully",
      };
    } catch (err) {
      console.error("Error deleting coupon:", err);
      return fail(500, {
        error: "Failed to delete coupon",
      });
    }
  },

  // Generate a new coupon code
  generateCode: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== "ADMIN") {
      return fail(403, { error: "Unauthorized" });
    }

    const formData = await request.formData();
    const prefix = formData.get("prefix")?.toString() || "";

    try {
      const code = couponService.generateCouponCode(prefix);
      return { success: true, code };
    } catch (err) {
      console.error("Error generating coupon code:", err);
      return fail(500, { error: "Failed to generate coupon code" });
    }
  },
};
