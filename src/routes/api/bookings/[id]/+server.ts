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
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
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
      cleaner: booking.cleanerId ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
      } : null
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
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          guestPhone: booking.guestPhone,
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
          cleaner: booking.cleanerId ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
          } : null
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
    
    // If user is logged in, check authorization
    if (locals.user && bookingData.userId !== locals.user.id) {
      // Only check auth for logged-in users to allow payment callbacks to work
      console.error(`Unauthorized access to booking: ${bookingId}`);
      return json({ error: 'Unauthorized access to booking' }, { status: 403 });
    }
    
    console.log(`Successfully retrieved booking: ${bookingData.id}`);
    return json(bookingData);
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return json({ 
      error: 'Failed to fetch booking details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
