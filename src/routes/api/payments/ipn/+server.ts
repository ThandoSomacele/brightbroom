// src/routes/api/payments/ipn/+server.ts
import { db } from "$lib/server/db";
import { adminNote, booking, payment, address, user } from "$lib/server/db/schema";
import { sendBookingConfirmationEmail } from "$lib/server/email-service";
import { postPaymentHooks } from "$lib/server/hooks/post-payment-hooks";
import { paymentProcessorService } from "$lib/server/services/payment-processor.service";
import {
  amountMatches,
  bookingItnAction,
  checkItn,
  confirmWithPayFast,
} from "$lib/server/payfast-itn";
import { json } from "@sveltejs/kit";
import { and, eq, inArray, sql } from "drizzle-orm";

type Db = typeof db;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

async function addNote(bookingId: string, content: string, conn: Db | Tx = db) {
  await conn.insert(adminNote).values({
    id: crypto.randomUUID(),
    bookingId,
    content,
    addedBy: "System (PayFast IPN)",
    createdAt: new Date(),
  });
}

/**
 * Mark the payment COMPLETED unless it already is. The status condition makes
 * this the one place a payment is claimed, so two concurrent deliveries of the
 * same ITN cannot both run the post-payment hooks.
 */
async function claimPayment(tx: Tx, paymentId: string, pfPaymentId: string | undefined) {
  const [claimed] = await tx
    .update(payment)
    .set({
      status: "COMPLETED",
      ...(pfPaymentId ? { payFastId: pfPaymentId } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(payment.id, paymentId), inArray(payment.status, ["PENDING", "FAILED"])))
    .returning({ id: payment.id });
  return Boolean(claimed);
}

/**
 * IPN (Instant Payment Notification) handler for PayFast
 * This endpoint receives payment confirmations from PayFast
 */
export async function POST({ request }) {
  try {
    const rawBody = await request.text();

    // Signature and merchant first: nothing in an unverified post is trusted
    const check = checkItn(rawBody);
    if (!check.ok) {
      console.error(`[IPN] Refused: ${check.reason}`);
      return json({ status: "error", message: "Invalid IPN request" }, { status: 400 });
    }
    const { itn } = check;
    const {
      m_payment_id: paymentId,
      pf_payment_id: pfPaymentId,
      payment_status: paymentStatus,
      amount_gross: amountGross,
    } = itn.fields;

    console.log(
      `[IPN] Payment ${paymentId}, PayFast ${pfPaymentId}, status ${paymentStatus}`,
    );

    const [paymentRecord] = paymentId
      ? await db.select().from(payment).where(eq(payment.id, paymentId)).limit(1)
      : [];
    if (!paymentRecord) {
      console.error(`[IPN] Payment record not found: ${paymentId}`);
      return json({ status: "error", message: "Payment record not found" }, { status: 404 });
    }

    // The booking comes from our own record, not from the post
    const bookingId = paymentRecord.bookingId;
    if (itn.fields.custom_str1 && itn.fields.custom_str1 !== bookingId) {
      console.warn(`[IPN] custom_str1 does not match payment ${paymentId}'s booking; using the stored booking`);
    }

    if (!(await confirmWithPayFast(itn))) {
      console.error(`[IPN] PayFast did not confirm the ITN for payment ${paymentId}`);
      return json({ status: "error", message: "Invalid IPN request" }, { status: 400 });
    }

    if (paymentStatus === "COMPLETE" && !amountMatches(amountGross, paymentRecord.amount)) {
      console.error(
        `[IPN] Amount mismatch for payment ${paymentId}: PayFast R${amountGross}, expected R${paymentRecord.amount}`,
      );
      await addNote(
        bookingId,
        `PayFast reported R${amountGross} for payment ${paymentId} (PayFast ${pfPaymentId}), but R${paymentRecord.amount} was charged. Not confirmed; check the payment in PayFast.`,
      );
      return json({ status: "error", message: "Amount mismatch" }, { status: 400 });
    }

    const [bookingRecord] = await db
      .select({ status: booking.status })
      .from(booking)
      .where(eq(booking.id, bookingId))
      .limit(1);
    if (!bookingRecord) {
      console.error(`[IPN] Booking ${bookingId} for payment ${paymentId} not found`);
      return json({ status: "error", message: "Booking not found" }, { status: 404 });
    }

    const action = bookingItnAction(paymentStatus, paymentRecord.status, bookingRecord.status);

    if (action === "already-paid" || action === "ignore") {
      console.log(`[IPN] No action for payment ${paymentId} (${action})`);
      return json({ status: "success", message: "IPN received, no action taken" });
    }

    if (action === "record-failure") {
      await db
        .update(payment)
        .set({ status: "FAILED", updatedAt: new Date() })
        .where(and(eq(payment.id, paymentId), eq(payment.status, "PENDING")));
      await addNote(bookingId, `Payment failed via PayFast (ID: ${paymentId})`);
      return json({ status: "success", message: "Payment failure recorded" });
    }

    // COMPLETE from here on
    try {
      // The payment, the booking and the note commit together, so a failure
      // part-way leaves everything as it was for PayFast's retry
      const claimed = await db.transaction(async (tx) => {
        if (!(await claimPayment(tx, paymentId, pfPaymentId))) return false;

        if (action === "paid-but-cancelled") {
          // The customer paid, but the booking was cancelled first. Keep it
          // cancelled - no cleaner, no confirmation email - and make sure a
          // person sees that the money has to go back.
          await addNote(
            bookingId,
            `REFUND NEEDED: PayFast payment ${pfPaymentId} of R${amountGross} completed (ID: ${paymentId}) after this booking was cancelled. The booking stays cancelled; refund the customer in PayFast and mark the payment refunded.`,
            tx,
          );
          return true;
        }

        // "record-payment": already confirmed (or done) without us, so only
        // the money is recorded
        if (action === "confirm") {
          await tx
            .update(booking)
            .set({ status: "CONFIRMED", updatedAt: new Date() })
            .where(and(eq(booking.id, bookingId), eq(booking.status, "PENDING")));
        }
        await addNote(bookingId, `Payment completed via PayFast IPN (ID: ${paymentId})`, tx);
        return true;
      });

      if (!claimed) {
        console.log(`[IPN] Payment ${paymentId} was already recorded`);
        return json({ status: "success", message: "IPN received, no action taken" });
      }

      if (action === "paid-but-cancelled") {
        console.warn(`[IPN] Payment ${paymentId} completed for cancelled booking ${bookingId}; refund needed`);
        return json({ status: "success", message: "Payment recorded for cancelled booking" });
      }

      // Persist the payout breakdown (PayFast fee, commission, cleaner payout)
      await paymentProcessorService.ensurePayoutFields(paymentId);

      if (action === "record-payment") {
        return json({ status: "success", message: "Payment recorded" });
      }
      console.log(`[IPN] Booking ${bookingId} confirmed`);

      // Run post-payment hooks directly in the same process (more reliable)
      try {
        await postPaymentHooks.runAll(bookingId, "COMPLETED");
        console.log(`[IPN] Post-payment hooks ran for booking ${bookingId}`);
      } catch (hooksError) {
        console.error(`[IPN] Error running post-payment hooks: ${hooksError}`);

        // Fallback: send the confirmation email directly
        try {
          const bookingDetails = await db
            .select({
              booking: {
                id: booking.id,
                status: booking.status,
                scheduledDate: booking.scheduledDate,
                price: booking.price,
                bedroomCount: booking.bedroomCount,
                bathroomCount: booking.bathroomCount,
              },
              user: {
                email: user.email,
              },
              address: {
                street: sql<string>`coalesce(${address.street}, ${booking.guestAddress}->>'street', '(guest address)')`,
                city: sql<string>`coalesce(${address.city}, ${booking.guestAddress}->>'city', '')`,
                state: sql<string>`coalesce(${address.state}, ${booking.guestAddress}->>'state', '')`,
                zipCode: sql<string>`coalesce(${address.zipCode}, ${booking.guestAddress}->>'zipCode', '')`,
              },
            })
            .from(booking)
            .leftJoin(address, eq(booking.addressId, address.id))
            .leftJoin(user, eq(booking.userId, user.id))
            .where(eq(booking.id, bookingId))
            .limit(1);

          if (bookingDetails.length > 0 && bookingDetails[0].user?.email) {
            const emailResult = await sendBookingConfirmationEmail(
              bookingDetails[0].user.email,
              {
                id: bookingDetails[0].booking.id,
                status: bookingDetails[0].booking.status,
                service: { name: "General Clean" },
                scheduledDate: bookingDetails[0].booking.scheduledDate,
                address: bookingDetails[0].address,
                price: bookingDetails[0].booking.price,
                bedroomCount: bookingDetails[0].booking.bedroomCount || undefined,
                bathroomCount: bookingDetails[0].booking.bathroomCount || undefined,
                paymentStatus: "COMPLETED", // Explicitly set
              },
            );
            console.log(`[IPN] Direct email fallback result: ${emailResult ? "Success" : "Failed"}`);
          }
        } catch (emailError) {
          console.error(`[IPN] Fallback email sending failed: ${emailError}`);
        }
      }

      return json({ status: "success", message: "Payment processed successfully" });
    } catch (dbError) {
      console.error("[IPN] Database error processing payment:", dbError);
      return json(
        { status: "error", message: "Database error processing payment" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[IPN] Error processing:", error);
    return json(
      { status: "error", message: "Server error processing IPN" },
      { status: 500 },
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// Add GET handler for testing the endpoint
export async function GET() {
  return new Response(
    "PayFast IPN endpoint is operational. POST requests are required for IPN processing.",
    {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    },
  );
}
