// src/routes/api/admin/bookings/[id]/send-receipt/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { booking, service, address, user, payment } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { sendPaymentReceiptEmail } from '$lib/server/email-service';

export const POST: RequestHandler = async ({ params, request, locals }) => {
  // Check if user is admin
  if (!locals.user || locals.user.role !== 'ADMIN') {
    return json({ error: 'Unauthorized' }, { status: 403 });
  }

  const bookingId = params.id;
  
  try {
    // Parse request body to get optional email override
    const body = await request.json();
    const overrideEmail = body.email; // Optional override for email
    
    // Get booking details along with payment and user info
    const bookingResults = await db.select({
      booking: booking,
      service: {
        name: service.name,
        description: service.description
      },
      address: {
        street: address.street,
        city: address.city, 
        state: address.state,
        zipCode: address.zipCode
      },
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    })
    .from(booking)
    .where(eq(booking.id, bookingId))
    .innerJoin(service, eq(booking.serviceId, service.id))
    .innerJoin(address, eq(booking.addressId, address.id))
    .innerJoin(user, eq(booking.userId, user.id))
    .limit(1);
    
    if (bookingResults.length === 0) {
      return json({ error: 'Booking not found' }, { status: 404 });
    }
    
    const result = bookingResults[0];
    
    // Get payment data if it exists
    const paymentResults = await db.select()
      .from(payment)
      .where(eq(payment.bookingId, bookingId))
      .limit(1);
    
    const paymentData = paymentResults.length > 0 ? paymentResults[0] : null;
    
    // Create payment details object
    const paymentDetails = {
      id: paymentData ? paymentData.id : `manual-${Date.now()}`,
      createdAt: paymentData ? paymentData.createdAt : new Date(),
      amount: result.booking.price,
      booking: {
        id: result.booking.id,
        service: result.service,
        scheduledDate: result.booking.scheduledDate,
        address: result.address,
        duration: result.booking.duration
      },
      user: {
        firstName: result.user.firstName,
        lastName: result.user.lastName
      },
      paymentMethod: paymentData ? paymentData.paymentMethod : 'CREDIT_CARD',
      vatRate: 15 // Default VAT rate for South Africa
    };
    
    // Use override email if provided, otherwise use user's email
    const emailTo = overrideEmail || result.user.email;
    
    // Send receipt email
    const success = await sendPaymentReceiptEmail(emailTo, paymentDetails);
    
    if (!success) {
      return json({ 
        success: false, 
        error: 'Failed to send receipt email' 
      }, { status: 500 });
    }
    
    return json({ 
      success: true,
      message: 'Payment receipt email sent',
      emailTo
    });
  } catch (error) {
    console.error('Error sending payment receipt for booking:', { bookingId, error });
    return json({ 
      success: false, 
      error: 'Failed to send payment receipt email' 
    }, { status: 500 });
  }
};
