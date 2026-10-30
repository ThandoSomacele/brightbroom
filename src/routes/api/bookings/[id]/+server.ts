// src/routes/api/bookings/[id]/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { booking, service, address, payment, user } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET endpoint to fetch booking details by ID
 * This is used by the payment success page to display booking information
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  const bookingId = params.id;
  
  if (!bookingId) {
    return json({ error: 'Booking ID is required' }, { status: 400 });
  }

  // A booking holds the customer's address and notes, so only the customer
  // who booked it (or a platform admin) may read it. Paying requires signing
  // in, and moves a guest booking onto the payer's account, so the payer is
  // always signed in when the payment success page asks for their booking.
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    console.log(`Fetching booking details for ID: ${bookingId}`);
    
    // First try to find by booking ID
    let results = await db.select({
      id: booking.id,
      status: booking.status,
      scheduledDate: booking.scheduledDate,
      duration: booking.duration,
      price: booking.price,
      notes: booking.notes,
      createdAt: booking.createdAt,
      userId: booking.userId,
      guestAddress: booking.guestAddress,
      service: {
        id: service.id,
        name: service.name,
        description: service.description,
      },
      address: {
        id: address.id,
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
      },
      payment: {
        id: payment.id,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        createdAt: payment.createdAt,
      },
      // A column object is always truthy, so the old `booking.cleanerId ? … : null`
      // always picked this branch; Drizzle returns null here when no cleaner joins.
      cleaner: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
      }
    })
    .from(booking)
    .innerJoin(service, eq(booking.serviceId, service.id))
    .leftJoin(address, eq(booking.addressId, address.id)) // Changed to leftJoin for guest bookings
    .leftJoin(payment, eq(booking.id, payment.bookingId))
    .leftJoin(user, booking.cleanerId ? eq(booking.cleanerId, user.id) : undefined)
    .where(eq(booking.id, bookingId))
    .limit(1);
    
    // If no booking found by ID, try to find by payment ID
    // This is important for handling PayFast returns which may use payment ID
    if (results.length === 0) {
      console.log(`No booking found with ID: ${bookingId}, trying payment ID lookup`);
      
      const paymentResult = await db.select()
        .from(payment)
        .where(eq(payment.id, bookingId))
        .limit(1);
      
      if (paymentResult.length > 0) {
        const paymentData = paymentResult[0];
        
        // Retry with the booking ID from the payment
        results = await db.select({
          id: booking.id,
          status: booking.status,
          scheduledDate: booking.scheduledDate,
          duration: booking.duration,
          price: booking.price,
          notes: booking.notes,
          createdAt: booking.createdAt,
          userId: booking.userId,
          guestAddress: booking.guestAddress,
          service: {
            id: service.id,
            name: service.name,
            description: service.description,
          },
          address: {
            id: address.id,
            street: address.street,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
          },
          payment: {
            id: payment.id,
            status: payment.status,
            paymentMethod: payment.paymentMethod,
            createdAt: payment.createdAt,
          },
          // A column object is always truthy, so the old `booking.cleanerId ? … : null`
          // always picked this branch; Drizzle returns null here when no cleaner joins.
          cleaner: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
          }
        })
        .from(booking)
        .innerJoin(service, eq(booking.serviceId, service.id))
        .leftJoin(address, eq(booking.addressId, address.id)) // Changed to leftJoin for guest bookings
        .leftJoin(payment, eq(booking.id, payment.bookingId))
        .leftJoin(user, booking.cleanerId ? eq(booking.cleanerId, user.id) : undefined)
        .where(eq(booking.id, paymentData.bookingId))
        .limit(1);
      }
    }
    
    if (results.length === 0) {
      console.error(`Booking not found for ID: ${bookingId}`);
      return json({ error: 'Booking not found' }, { status: 404 });
    }
    
    const bookingData = results[0];
    
    // Someone else's booking answers like a missing one, so ids can't be probed
    if (bookingData.userId !== locals.user.id && locals.user.role !== 'ADMIN') {
      console.warn(`Refused booking ${bookingId} to user ${locals.user.id}`);
      return json({ error: 'Booking not found' }, { status: 404 });
    }
    
    console.log(`Successfully retrieved booking: ${bookingData.id}`);
    return json(bookingData);
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return json({ error: 'Failed to fetch booking details' }, { status: 500 });
  }
};
