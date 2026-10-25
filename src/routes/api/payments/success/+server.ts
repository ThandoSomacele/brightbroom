// src/routes/api/payments/success/+server.ts
import { error, redirect } from "@sveltejs/kit";

/**
 * Old payment-success callback, kept so existing links still land somewhere.
 *
 * It used to mark the booking's payment COMPLETED and confirm the booking for
 * any signed-in visitor, with no proof that PayFast took any money - so anyone
 * could confirm a booking (theirs or, knowing its id, anyone's) by opening
 * this URL. Only a verified ITN (/api/payments/ipn) records a payment now;
 * this just forwards to the page that shows the booking's real status.
 */
export function GET({ url }) {
  const bookingId = url.searchParams.get("booking_id");
  if (!bookingId) {
    throw error(400, "Missing booking ID");
  }
  throw redirect(302, `/payment/success?booking_id=${encodeURIComponent(bookingId)}`);
}
