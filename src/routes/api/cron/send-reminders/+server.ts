// src/routes/api/cron/send-reminders/+server.ts
import { db } from "$lib/server/db";
import { address, booking, service, user } from "$lib/server/db/schema";
import { sendBookingReminderEmail } from "$lib/server/email-service";
import { json } from "@sveltejs/kit";
import { and, between, eq, sql } from "drizzle-orm";
import { instantToSASTString } from "$lib/utils/date-utils";
import type { RequestHandler } from "./$types";

/**
 * API endpoint to send booking reminders for upcoming bookings
 * This would be called by a cron job in production
 */
export const GET: RequestHandler = async ({ url, request }) => {
  // In production, authenticate this endpoint with a secret token
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1]; // "Bearer <token>"

  // Simple auth check (use a more secure method in production)
  if (
    process.env.NODE_ENV === "production" &&
    token !== process.env.CRON_SECRET
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Calculate time window for reminders (e.g., 18-30 hours in the future)
    const now = new Date();
    const lowerBound = new Date(now.getTime() + 18 * 60 * 60 * 1000); // 18 hours from now
    const upperBound = new Date(now.getTime() + 30 * 60 * 60 * 1000); // 30 hours from now

    // Find bookings in the reminder window
    const bookingsToRemind = await db
      .select({
        id: booking.id,
        scheduledDate: booking.scheduledDate,
        userId: booking.userId,
        user: {
          email: user.email,
          firstName: sql<string>`coalesce(${user.firstName}, 'Guest')`,
          lastName: sql<string>`coalesce(${user.lastName}, '')`,
        },
        service: {
          id: service.id,
          name: service.name,
        },
        address: {
          street: sql<string>`coalesce(${address.street}, ${booking.guestAddress}->>'street', '(guest address)')`,
          city: sql<string>`coalesce(${address.city}, ${booking.guestAddress}->>'city', '')`,
          state: sql<string>`coalesce(${address.state}, ${booking.guestAddress}->>'state', '')`,
          zipCode: sql<string>`coalesce(${address.zipCode}, ${booking.guestAddress}->>'zipCode', '')`,
        },
      })
      .from(booking)
      .leftJoin(user, eq(booking.userId, user.id))
      .innerJoin(service, eq(booking.serviceId, service.id))
      .leftJoin(address, eq(booking.addressId, address.id))
      .where(
        and(
          eq(booking.status, "CONFIRMED"),
          between(booking.scheduledDate, instantToSASTString(lowerBound), instantToSASTString(upperBound)),
        ),
      );

    console.log(
      `Found ${bookingsToRemind.length} bookings to send reminders for`,
    );

    // Send reminders
    const results = await Promise.all(
      bookingsToRemind.map(async (booking) => {
        // Guest bookings may have no account email to remind
        if (!booking.user?.email) {
          return { bookingId: booking.id, email: null, success: false };
        }
        const success = await sendBookingReminderEmail(
          booking.user.email,
          booking,
        );
        return {
          bookingId: booking.id,
          email: booking.user.email,
          success,
        };
      }),
    );

    return json({
      processed: bookingsToRemind.length,
      results,
    });
  } catch (error) {
    console.error("Error sending reminders:", error);
    return json({ error: "Failed to send reminders" }, { status: 500 });
  }
};
