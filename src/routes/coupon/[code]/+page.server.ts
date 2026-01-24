// src/routes/coupon/[code]/+page.server.ts
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { couponService } from "$lib/server/services/coupon.service";

export const load: PageServerLoad = async ({ params }) => {
  const { code } = params;

  if (!code) {
    throw error(404, "Coupon not found");
  }

  try {
    const coupon = await couponService.getCouponByCode(code.toUpperCase());

    if (!coupon) {
      throw error(404, "Coupon not found");
    }

    // Check if coupon is active and not expired
    const now = new Date();
    const isExpired = coupon.validUntil && new Date(coupon.validUntil) < now;
    const isNotYetValid = new Date(coupon.validFrom) > now;

    return {
      coupon: {
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minimumBookingAmount: coupon.minimumBookingAmount,
        requiresFirstBooking: coupon.requiresFirstBooking,
        validFrom: coupon.validFrom,
        validUntil: coupon.validUntil,
        isActive: coupon.isActive,
      },
      isExpired,
      isNotYetValid,
      isValid: coupon.isActive && !isExpired && !isNotYetValid,
    };
  } catch (err) {
    if ((err as any)?.status === 404) {
      throw err;
    }
    console.error("Error loading coupon:", err);
    throw error(404, "Coupon not found");
  }
};
