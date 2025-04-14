// src/routes/api/payments/direct-email/+server.ts
import { db } from "$lib/server/db";
import { address, booking, service, user, adminNote } from "$lib/server/db/schema";
import { sendBookingConfirmationEmail } from "$lib/server/email-service";
import { json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

/**
 * Dedicated endpoint for direct email sending as a last resort fallback
 * This can be called directly from the Netlify function when other methods fail
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    // Parse request body
    const data = await request.json();
    const { bookingId, forceEmail = false } = data;
    
    if (!bookingId) {
      return json({ error: "Booking ID is required" }, { status: 400 });
    }
    
    console.log(`[DIRECT EMAIL] Request received for booking: ${bookingId}, force: ${forceEmail}`);
    
    // Check if we've already sent this email
    if (!forceEmail) {
      const existingEmailNotes = await db
        .select()
        .from(adminNote)
        .where(eq(adminNote.bookingId, bookingId))
        .limit(100);
      
      const alreadySent = existingEmailNotes.some(note => 
        note.content.includes("confirmation email sent successfully") ||
        note.content.includes("EMAIL_SENT:")
      );
      
      if (alreadySent) {
        console.log(`[DIRECT EMAIL] Email already sent for booking ${bookingId}, skipping`);
        return json({ 
          success: true, 
          message: "Email already sent previously" 
        });
      }
    }
    
    // Get booking details with all required info for the email
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
          firstName: user.firstName,
          lastName: user.lastName,
        },
        service: {
          name: service.name,
          description: service.description,
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
      console.error(`[DIRECT EMAIL] Booking not found: ${bookingId}`);
      return json({ error: "Booking not found" }, { status: 404 });
    }
    
    const bookingData = results[0];
    
    // Don't send if booking is cancelled
    if (bookingData.booking.status === "CANCELLED") {
      console.log(`[DIRECT EMAIL] Skipping email for cancelled booking: ${bookingId}`);
      return json({ 
        success: true, 
        message: "Booking is cancelled, no email sent" 
      });
    }
    
    console.log(`[DIRECT EMAIL] Sending confirmation email to ${bookingData.user.email}`);
    
    // Force payment status to COMPLETED (this is crucial)
    const success = await sendBookingConfirmationEmail(
      bookingData.user.email,
      {
        id: bookingData.booking.id,
        status: bookingData.booking.status,
        service: bookingData.service,
        scheduledDate: bookingData.booking.scheduledDate,
        address: bookingData.address,
        price: bookingData.booking.price,
        paymentStatus: "COMPLETED" // Force status to COMPLETED
      }
    );
    
    // Record the result in admin notes
    await db.insert(adminNote).values({
      id: crypto.randomUUID(),
      bookingId,
      content: success
        ? `DIRECT_EMAIL: Booking confirmation email sent via direct endpoint`
        : `DIRECT_EMAIL: Failed to send booking confirmation email`,
      addedBy: "System (Direct Email)",
      createdAt: new Date(),
    });
    
    return json({
      success,
      message: success ? "Confirmation email sent successfully" : "Failed to send email"
    });
  } catch (error) {
    console.error("[DIRECT EMAIL] Error sending email:", error);
    
    return json({ 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
};

// Allow OPTIONS for CORS preflight
export const OPTIONS: RequestHandler = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
};
