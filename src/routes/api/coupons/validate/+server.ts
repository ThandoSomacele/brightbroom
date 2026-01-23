// src/routes/api/coupons/validate/+server.ts
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { couponService } from "$lib/server/services/coupon.service";

export const POST: RequestHandler = async ({ request, locals }) => {
  // Check authentication - coupons require a logged-in user
  if (!locals.user) {
    return json(
      { valid: false, error: "Please log in to use coupon codes" },
      { status: 401 }
    );
  }

  try {
    const data = await request.json();
    const { code, bookingAmount } = data;

    // Validate input
    if (!code || typeof code !== "string") {
      return json(
        { valid: false, error: "Coupon code is required" },
        { status: 400 }
      );
    }

    if (typeof bookingAmount !== "number" || bookingAmount <= 0) {
      return json(
        { valid: false, error: "Valid booking amount is required" },
        { status: 400 }
      );
    }

    // Validate the coupon
    const result = await couponService.validateCoupon(
      code,
      locals.user.id,
      bookingAmount
    );

    if (!result.valid) {
      return json({
        valid: false,
        error: result.error,
      });
    }

    // Return coupon details on successful validation
    return json({
      valid: true,
      coupon: {
        id: result.coupon!.id,
        code: result.coupon!.code,
        name: result.coupon!.name,
        discountType: result.coupon!.discountType,
        discountValue: parseFloat(result.coupon!.discountValue as unknown as string),
      },
      discountAmount: result.discountAmount,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return json(
      { valid: false, error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
};
