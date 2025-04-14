// src/routes/api/bookings/execute-webhook/+server.ts
import { db } from "$lib/server/db";
import { adminNote, booking, payment } from "$lib/server/db/schema";
import { postPaymentHooks } from "$lib/server/hooks/post-payment-hooks";
import { json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

/**
 * Special webhook executor to handle retries and catch missed emails
 * This endpoint is designed to be called from the client after successful redirection
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    // Parse request
    const data = await request.json();
    const { bookingId } = data;

    if (!bookingId) {
      return json({ error: "Booking ID is required" }, { status: 400 });
    }

    console.log(`[WEBHOOK EXECUTOR] Processing request for booking: ${bookingId}`);

    // Check if the booking exists and is confirmed
    const bookings = await db
      .select()
      .from(booking)
      .where(eq(booking.id, bookingId))
      .limit(1);

    if (bookings.length === 0) {
      console.log(`[WEBHOOK EXECUTOR] Booking not found: ${bookingId}`);
      return json({ error: "Booking not found" }, { status: 404 });
    }

    const bookingData = bookings[0];

    // Only proceed for confirmed bookings
    if (bookingData.status !== "CONFIRMED") {
      console.log(`[WEBHOOK EXECUTOR] Booking ${bookingId} is not confirmed (status: ${bookingData.status})`);
      return json({ 
        success: false, 
        message: `Booking is not confirmed (status: ${bookingData.status})` 
      });
    }

    // Check if an email has already been sent
    const emailNotes = await db
      .select()
      .from(adminNote)
      .where(eq(adminNote.bookingId, bookingId))
      .limit(100);

    const emailAlreadySent = emailNotes.some(note => 
      note.content.includes("confirmation email sent successfully") ||
      note.content.includes("EMAIL_SENT:") ||
      note.content.includes("DIRECT_EMAIL:")
    );

    if (emailAlreadySent) {
      console.log(`[WEBHOOK EXECUTOR] Email already sent for booking ${bookingId}`);
      return json({ 
        success: true, 
        message: "Email already sent" 
      });
    }

    // Check payment status
    const payments = await db
      .select()
      .from(payment)
      .where(eq(payment.bookingId, bookingId))
      .limit(1);

    let paymentStatus = "UNKNOWN";
    if (payments.length > 0) {
      paymentStatus = payments[0].status;
    } else {
      // If no payment record but booking is CONFIRMED, treat as COMPLETED
      paymentStatus = "COMPLETED";
    }

    console.log(`[WEBHOOK EXECUTOR] Booking ${bookingId} payment status: ${paymentStatus}`);

    // Execute the post-payment hooks
    if (paymentStatus === "COMPLETED" || paymentStatus === "UNKNOWN") {
      console.log(`[WEBHOOK EXECUTOR] Running post-payment hooks for booking ${bookingId}`);
      await postPaymentHooks.runAll(bookingId, "COMPLETED");
      
      // Record the execution
      await db.insert(adminNote).values({
        id: crypto.randomUUID(),
        bookingId,
        content: `Webhook executor ran post-payment hooks for booking`,
        addedBy: "System (Webhook Executor)",
        createdAt: new Date(),
      });
      
      return json({ 
        success: true, 
        message: "Post-payment hooks executed successfully" 
      });
    } else {
      console.log(`[WEBHOOK EXECUTOR] Not executing hooks for payment status: ${paymentStatus}`);
      return json({ 
        success: false, 
        message: `Payment status not suitable for hooks: ${paymentStatus}` 
      });
    }
  } catch (error) {
    console.error("[WEBHOOK EXECUTOR] Error:", error);
    
    return json({ 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
};
