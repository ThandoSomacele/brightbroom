// src/routes/admin/bookings/[id]/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { booking, service, user, address, payment, cleanerProfile } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  const bookingId = params.id;
  
  if (!bookingId) {
    throw error(404, 'Booking not found');
  }
  
  try {
    // Fetch the booking with all related information
    const bookingResults = await db.select({
      id: booking.id,
      status: booking.status,
      scheduledDate: booking.scheduledDate,
      price: booking.price,
      notes: booking.notes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      service: {
        id: service.id,
        name: service.name,
        description: service.description,
      },
      customer: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      },
      address: {
        id: address.id,
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        instructions: address.instructions,
      },
      cleaner: booking.cleanerId ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        cleanerProfile: {
          id: cleanerProfile.id,
          rating: cleanerProfile.rating,
        }
      } : null,
      payment: {
        id: payment.id,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        amount: payment.amount,
        createdAt: payment.createdAt,
      }
    })
    .from(booking)
    .leftJoin(service, eq(booking.serviceId, service.id))
    .leftJoin(user, eq(booking.userId, user.id))
    .leftJoin(address, eq(booking.addressId, address.id))
    .leftJoin(payment, eq(booking.id, payment.bookingId))
    .leftJoin(
      user, 
      booking.cleanerId ? eq(booking.cleanerId, user.id) : undefined,
      {
        foreignAlias: 'cleaner'
      }
    )
    .leftJoin(
      cleanerProfile, 
      booking.cleanerId ? eq(cleanerProfile.userId, booking.cleanerId) : undefined
    )
    .where(eq(booking.id, bookingId))
    .limit(1);
    
    if (bookingResults.length === 0) {
      throw error(404, 'Booking not found');
    }
    
    // Get all active cleaners for the assignment dropdown
    const availableCleaners = await db.select({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      cleanerProfile: {
        rating: cleanerProfile.rating,
      }
    })
    .from(user)
    .leftJoin(cleanerProfile, eq(user.id, cleanerProfile.userId))
    .where(eq(user.role, 'CLEANER'))
    .orderBy(desc(cleanerProfile.rating));
    
    return {
      booking: bookingResults[0],
      availableCleaners
    };
  } catch (err) {
    console.error('Error loading booking details:', err);
    throw error(500, 'Error loading booking details');
  }
};

export const actions: Actions = {
  // Action to change booking status
  changeStatus: async ({ params, request }) => {
    const bookingId = params.id;
    const formData = await request.formData();
    const status = formData.get('status')?.toString();
    
    if (!bookingId || !status) {
      return fail(400, {
        error: 'Missing booking ID or status'
      });
    }
    
    // Validate status
    const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return fail(400, {
        error: 'Invalid status'
      });
    }
    
    try {
      // Update booking status
      await db.update(booking)
        .set({
          status: status as any, // Type assertion to satisfy TypeScript
          updatedAt: new Date()
        })
        .where(eq(booking.id, bookingId));
      
      return {
        success: true,
        message: `Booking status updated to ${status}`
      };
    } catch (err) {
      console.error('Error updating booking status:', err);
      return fail(500, {
        error: 'Failed to update booking status'
      });
    }
  },
  
  // Action to assign cleaner to booking
  assignCleaner: async ({ params, request }) => {
    const bookingId = params.id;
    const formData = await request.formData();
    const cleanerId = formData.get('cleanerId')?.toString();
    
    if (!bookingId) {
      return fail(400, {
        error: 'Missing booking ID'
      });
    }
    
    try {
      // Either assign a new cleaner or remove the assignment
      const updateData = cleanerId 
        ? { cleanerId, updatedAt: new Date() }
        : { cleanerId: null, updatedAt: new Date() };
      
      // Update booking
      await db.update(booking)
        .set(updateData)
        .where(eq(booking.id, bookingId));
      
      return {
        success: true,
        message: cleanerId 
          ? 'Cleaner assigned successfully' 
          : 'Cleaner assignment removed'
      };
    } catch (err) {
      console.error('Error assigning cleaner:', err);
      return fail(500, {
        error: 'Failed to assign cleaner'
      });
    }
  }
};
