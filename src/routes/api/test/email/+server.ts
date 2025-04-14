// src/routes/api/admin/test/email/+server.ts

import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { booking, service, address, user, payment } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { sendBookingConfirmationEmail } from "$lib/server/email-service";

/**
 * Admin API endpoint to test sending booking confirmation emails directly
 * This helps diagnose email issues without going through the full payment flow
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  // Ensure only admins can use this endpoint
  if (!locals.user || locals.user.role !== "ADMIN") {
    return json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Get booking ID from request body
    const data = await request.json();
    const { bookingId } = data;

    if (!bookingId) {
      return json({ error: "Booking ID is required" }, { status: 400 });
    }

    console.log(`[EMAIL TEST] Testing email for booking: ${bookingId}`);

    // Get booking details
    const results = await db
      .select({
        booking: {
          id: booking.id,
          status: booking.status,
          scheduledDate: booking.scheduledDate,
          price: booking.price,
        },
        user: {
          email: user.email,
        },
        service: {
          name: service.name,
        },
        address: {
          street: address.street,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
        },
      })
      .from(booking)
      .innerJoin(service, eq(booking.serviceId, service.id))
      .innerJoin(address, eq(booking.addressId, address.id))
      .innerJoin(user, eq(booking.userId, user.id))
      .where(eq(booking.id, bookingId))
      .limit(1);

    if (results.length === 0) {
      return json({ error: "Booking not found" }, { status: 404 });
    }

    const bookingData = results[0];

    // Get the payment status if available
    const payments = await db
      .select()
      .from(payment)
      .where(eq(payment.bookingId, bookingId))
      .limit(1);

    const paymentStatus = payments.length > 0 ? payments[0].status : null;

    console.log(`[EMAIL TEST] Booking found, payment status: ${paymentStatus || 'Not found'}`);

    // Force sending confirmation email with COMPLETED status
    const success = await sendBookingConfirmationEmail(
      bookingData.user.email,
      {
        id: bookingData.booking.id,
        status: bookingData.booking.status,
        service: bookingData.service,
        scheduledDate: bookingData.booking.scheduledDate,
        address: bookingData.address,
        price: bookingData.booking.price,
        paymentStatus: "COMPLETED" // Always set to COMPLETED for testing
      }
    );

    if (success) {
      return json({
        success: true,
        message: `Test email sent successfully to ${bookingData.user.email}`
      });
    } else {
      return json({
        success: false,
        message: "Failed to send test email"
      }, { status: 500 });
    }
  } catch (error) {
    console.error("[EMAIL TEST] Error testing email:", error);
    return json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
};
