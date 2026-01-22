// src/routes/cleaner/bookings/[id]/+page.server.ts
import { db } from '$lib/server/db';
import { booking, address, user, adminNote, communicationLog, bookingAddon, addon } from '$lib/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const bookingId = params.id;
  const cleanerId = locals.user?.id;
  
  try {
    // Get detailed booking info
    const bookingDetails = await db
      .select({
        booking: {
          id: booking.id,
          status: booking.status,
          scheduledDate: booking.scheduledDate,
          price: booking.price,
          notes: booking.notes,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
          bedroomCount: booking.bedroomCount,
          bathroomCount: booking.bathroomCount,
        },
        address: {
          street: address.street,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
        },
        customer: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
        }
      })
      .from(booking)
      .innerJoin(address, eq(booking.addressId, address.id))
      .innerJoin(user, eq(booking.userId, user.id))
      .where(
        and(
          eq(booking.id, bookingId),
          eq(booking.cleanerId, cleanerId!) // Ensure cleaner can only view their own bookings
        )
      )
      .limit(1);
    
    if (bookingDetails.length === 0) {
      throw error(404, 'Booking not found');
    }

    // Get booking addons
    const bookingAddons = await db
      .select({
        id: bookingAddon.id,
        priceAtBooking: bookingAddon.priceAtBooking,
        durationAtBooking: bookingAddon.durationAtBooking,
        addon: {
          id: addon.id,
          name: addon.name,
          description: addon.description,
        },
      })
      .from(bookingAddon)
      .leftJoin(addon, eq(bookingAddon.addonId, addon.id))
      .where(eq(bookingAddon.bookingId, bookingId));

    // Get communication history
    const communications = await db
      .select()
      .from(communicationLog)
      .where(eq(communicationLog.bookingId, bookingId))
      .orderBy(desc(communicationLog.createdAt));

    return {
      bookingDetails: {
        ...bookingDetails[0],
        addons: bookingAddons,
      },
      communications
    };
  } catch (err) {
    console.error('Error loading booking details:', err);
    throw error(500, 'Error loading booking details');
  }
};

export const actions: Actions = {
  // Action to update booking status (e.g., mark as in-progress or completed)
  updateStatus: async ({ params, request, locals }) => {
    const bookingId = params.id;
    const formData = await request.formData();
    const status = formData.get('status')?.toString();
    const cleanerId = locals.user?.id;
    
    if (!bookingId || !status || !cleanerId) {
      return { success: false, error: 'Missing required data' };
    }
    
    // Validate new status (cleaners can only set specific statuses)
    const allowedStatuses = ['IN_PROGRESS', 'COMPLETED'];
    if (!allowedStatuses.includes(status)) {
      return { success: false, error: 'Invalid status' };
    }
    
    try {
      // Verify cleaner is assigned to this booking
      const bookingCheck = await db
        .select({ cleanerId: booking.cleanerId })
        .from(booking)
        .where(eq(booking.id, bookingId))
        .limit(1);
      
      if (bookingCheck.length === 0 || bookingCheck[0].cleanerId !== cleanerId) {
        return { success: false, error: 'Not authorized to update this booking' };
      }
      
      // Update booking status
      await db.update(booking)
        .set({ 
          status: status as any, 
          updatedAt: new Date() 
        })
        .where(eq(booking.id, bookingId));
      
      // Add a system note about the status change
      await db.insert(adminNote).values({
        id: crypto.randomUUID(),
        bookingId,
        content: `Status changed to ${status} by cleaner`,
        addedBy: 'Cleaner App',
        createdAt: new Date()
      });
      
      return { success: true, message: `Booking status updated to ${status}` };
    } catch (err) {
      console.error('Error updating booking status:', err);
      return { success: false, error: 'Failed to update booking status' };
    }
  },
  
  // Action to add a message/note about the booking
  addNote: async ({ params, request, locals }) => {
    const bookingId = params.id;
    const formData = await request.formData();
    const content = formData.get('content')?.toString();
    const cleanerId = locals.user?.id;
    
    if (!bookingId || !content || !cleanerId) {
      return { success: false, error: 'Missing required data' };
    }
    
    try {
      // Verify cleaner is assigned to this booking
      const bookingCheck = await db
        .select({ cleanerId: booking.cleanerId })
        .from(booking)
        .where(eq(booking.id, bookingId))
        .limit(1);
      
      if (bookingCheck.length === 0 || bookingCheck[0].cleanerId !== cleanerId) {
        return { success: false, error: 'Not authorized to add notes to this booking' };
      }
      
      // Get cleaner info for the name
      const cleanerInfo = await db
        .select({
          firstName: user.firstName,
          lastName: user.lastName
        })
        .from(user)
        .where(eq(user.id, cleanerId))
        .limit(1);
      
      const cleanerName = cleanerInfo.length > 0 
        ? `${cleanerInfo[0].firstName} ${cleanerInfo[0].lastName} (Cleaner)`
        : 'Cleaner';
      
      // Add the communication log entry
      await db.insert(communicationLog).values({
        id: crypto.randomUUID(),
        bookingId,
        type: 'NOTE',
        content,
        sentBy: cleanerName,
        direction: 'INCOMING',
        createdAt: new Date()
      });
      
      return { success: true, message: 'Note added successfully' };
    } catch (err) {
      console.error('Error adding note:', err);
      return { success: false, error: 'Failed to add note' };
    }
  }
};
