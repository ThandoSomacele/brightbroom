// src/routes/admin/bookings/[id]/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { booking, service, user, address, payment, cleanerProfile, adminNote, communicationLog } from '$lib/server/db/schema';
import { eq, and, desc, lt } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
  const bookingId = params.id;
  
  // Make sure the current user is an admin
  if (!locals.user || locals.user.role !== 'ADMIN') {
    throw redirect(302, '/auth/login?redirectTo=/admin');
  }
  
  if (!bookingId) {
    throw error(404, 'Booking not found');
  }
  
  try {
    // Fetch the booking with all related information
    const bookingResults = await db.select({
      id: booking.id,
      status: booking.status,
      scheduledDate: booking.scheduledDate,
      duration: booking.duration,
      price: booking.price,
      notes: booking.notes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      userId: booking.userId,
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
        createdAt: user.createdAt,
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
        payFastId: payment.payFastId,
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
    
    const bookingDetail = bookingResults[0];
    
    // Get all active cleaners for the assignment dropdown
    const availableCleaners = await db.select({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      cleanerProfile: {
        rating: cleanerProfile.rating,
      },
      // Add a fake availability field for the demo 
      // In a real app, this would be calculated based on cleaner schedule
      availability: db.sql<string>`
        CASE 
          WHEN ${cleanerProfile.isAvailable} = true THEN 'AVAILABLE'
          ELSE 'UNAVAILABLE'
        END
      `.as('availability')
    })
    .from(user)
    .leftJoin(cleanerProfile, eq(user.id, cleanerProfile.userId))
    .where(eq(user.role, 'CLEANER'))
    .orderBy(desc(cleanerProfile.rating));
    
    // Fetch admin notes for this booking
    const adminNotes = await db.select()
      .from(adminNote)
      .where(eq(adminNote.bookingId, bookingId))
      .orderBy(desc(adminNote.createdAt));
    
    // Fetch communication logs
    const communications = await db.select()
      .from(communicationLog)
      .where(eq(communicationLog.bookingId, bookingId))
      .orderBy(desc(communicationLog.createdAt));
    
    // Get related bookings from the same customer
    const relatedBookings = await db.select({
      id: booking.id,
      status: booking.status,
      scheduledDate: booking.scheduledDate,
      service: {
        id: service.id,
        name: service.name,
      }
    })
    .from(booking)
    .innerJoin(service, eq(booking.serviceId, service.id))
    .where(
      and(
        eq(booking.userId, bookingDetail.userId),
        booking.id !== bookingId // Exclude current booking
      )
    )
    .orderBy(desc(booking.scheduledDate))
    .limit(5);
    
    // Get customer booking count
    const bookingCountResult = await db.select({
      count: db.fn.count()
    })
    .from(booking)
    .where(eq(booking.userId, bookingDetail.userId));
    
    // Add bookings count to customer data
    const customerWithCount = {
      ...bookingDetail.customer,
      bookingsCount: Number(bookingCountResult[0]?.count || 0)
    };
    
    return {
      booking: {
        ...bookingDetail,
        customer: customerWithCount
      },
      availableCleaners,
      adminNotes,
      communicationLog: communications,
      relatedBookings
    };
  } catch (err) {
    console.error('Error loading booking details:', err);
    throw error(500, 'Error loading booking details');
  }
};

export const actions: Actions = {
  // Action to change booking status
  changeStatus: async ({ params, request, locals }) => {
    // Verify admin role
    if (!locals.user || locals.user.role !== 'ADMIN') {
      return fail(403, { error: 'Unauthorized' });
    }
    
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
      
      // Add an admin note about the status change
      await db.insert(adminNote).values({
        id: crypto.randomUUID(),
        bookingId: bookingId,
        content: `Status changed to ${status}`,
        addedBy: `${locals.user.firstName} ${locals.user.lastName}`,
        createdAt: new Date()
      });
      
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
  assignCleaner: async ({ params, request, locals }) => {
    // Verify admin role
    if (!locals.user || locals.user.role !== 'ADMIN') {
      return fail(403, { error: 'Unauthorized' });
    }
    
    const bookingId = params.id;
    const formData = await request.formData();
    const cleanerId = formData.get('cleanerId')?.toString();
    
    if (!bookingId) {
      return fail(400, {
        error: 'Missing booking ID'
      });
    }
    
    try {
      // Get current booking to check if cleaner is changing
      const currentBooking = await db.select()
        .from(booking)
        .where(eq(booking.id, bookingId))
        .limit(1);
      
      if (currentBooking.length === 0) {
        return fail(404, {
          error: 'Booking not found'
        });
      }
      
      const previousCleanerId = currentBooking[0].cleanerId;
      
      // Either assign a new cleaner or remove the assignment
      const updateData = cleanerId 
        ? { cleanerId, updatedAt: new Date() }
        : { cleanerId: null, updatedAt: new Date() };
      
      // Update booking
      await db.update(booking)
        .set(updateData)
        .where(eq(booking.id, bookingId));
      
      // Add an admin note about the cleaner assignment
      let noteContent = '';
      
      if (!previousCleanerId && cleanerId) {
        // New assignment
        const cleanerData = await db.select()
          .from(user)
          .where(eq(user.id, cleanerId))
          .limit(1);
        
        if (cleanerData.length > 0) {
          const cleaner = cleanerData[0];
          noteContent = `Cleaner assigned: ${cleaner.firstName} ${cleaner.lastName}`;
        } else {
          noteContent = 'New cleaner assigned';
        }
      } else if (previousCleanerId && !cleanerId) {
        // Cleaner removed
        noteContent = 'Cleaner assignment removed';
      } else if (previousCleanerId && cleanerId && previousCleanerId !== cleanerId) {
        // Cleaner changed
        const cleanerData = await db.select()
          .from(user)
          .where(eq(user.id, cleanerId))
          .limit(1);
        
        if (cleanerData.length > 0) {
          const cleaner = cleanerData[0];
          noteContent = `Cleaner reassigned to: ${cleaner.firstName} ${cleaner.lastName}`;
        } else {
          noteContent = 'Cleaner reassigned';
        }
      }
      
      if (noteContent) {
        await db.insert(adminNote).values({
          id: crypto.randomUUID(),
          bookingId: bookingId,
          content: noteContent,
          addedBy: `${locals.user.firstName} ${locals.user.lastName}`,
          createdAt: new Date()
        });
      }
      
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
  },
  
  // Action to add admin note
  addNote: async ({ params, request, locals }) => {
    // Verify admin role
    if (!locals.user || locals.user.role !== 'ADMIN') {
      return fail(403, { error: 'Unauthorized' });
    }
    
    const bookingId = params.id;
    const formData = await request.formData();
    const content = formData.get('content')?.toString();
    
    if (!bookingId || !content) {
      return fail(400, {
        error: 'Missing booking ID or note content'
      });
    }
    
    try {
      // Insert admin note
      await db.insert(adminNote).values({
        id: crypto.randomUUID(),
        bookingId: bookingId,
        content: content,
        addedBy: `${locals.user.firstName} ${locals.user.lastName}`,
        createdAt: new Date()
      });
      
      return {
        success: true,
        message: 'Note added successfully'
      };
    } catch (err) {
      console.error('Error adding admin note:', err);
      return fail(500, {
        error: 'Failed to add note'
      });
    }
  },
  
  // Action to add communication
  addCommunication: async ({ params, request, locals }) => {
    // Verify admin role
    if (!locals.user || locals.user.role !== 'ADMIN') {
      return fail(403, { error: 'Unauthorized' });
    }
    
    const bookingId = params.id;
    const formData = await request.formData();
    const method = formData.get('method')?.toString();
    const content = formData.get('content')?.toString();
    const subject = formData.get('subject')?.toString();
    
    if (!bookingId || !method || !content) {
      return fail(400, {
        error: 'Missing required fields'
      });
    }
    
    try {
      // Get booking to verify it exists and get customer info
      const bookingData = await db.select({
        id: booking.id,
        customer: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone
        }
      })
      .from(booking)
      .leftJoin(user, eq(booking.userId, user.id))
      .where(eq(booking.id, bookingId))
      .limit(1);
      
      if (bookingData.length === 0) {
        return fail(404, {
          error: 'Booking not found'
        });
      }
      
      const customerInfo = bookingData[0].customer;
      let communicationType = 'NOTE';
      let communicationSent = false;
      
      // Handle different communication methods
      if (method === 'email' && customerInfo.email) {
        // In a real app, this would send an actual email
        communicationType = 'EMAIL';
        
        // Record the communication
        await db.insert(communicationLog).values({
          id: crypto.randomUUID(),
          bookingId: bookingId,
          type: communicationType,
          content: content,
          subject: subject || 'Regarding your booking',
          sentTo: customerInfo.email,
          sentBy: `${locals.user.firstName} ${locals.user.lastName}`,
          direction: 'OUTGOING',
          createdAt: new Date()
        });
        
        communicationSent = true;
      } else if (method === 'sms' && customerInfo.phone) {
        // In a real app, this would send an actual SMS
        communicationType = 'SMS';
        
        // Record the communication
        await db.insert(communicationLog).values({
          id: crypto.randomUUID(),
          bookingId: bookingId,
          type: communicationType,
          content: content,
          sentTo: customerInfo.phone,
          sentBy: `${locals.user.firstName} ${locals.user.lastName}`,
          direction: 'OUTGOING',
          createdAt: new Date()
        });
        
        communicationSent = true;
      } else if (method === 'note') {
        // Just record as internal note
        await db.insert(adminNote).values({
          id: crypto.randomUUID(),
          bookingId: bookingId,
          content: content,
          addedBy: `${locals.user.firstName} ${locals.user.lastName}`,
          createdAt: new Date()
        });
        
        communicationSent = true;
      }
      
      if (!communicationSent) {
        return fail(400, {
          error: 'Failed to send communication'
        });
      }
      
      return {
        success: true,
        message: `${communicationType === 'NOTE' ? 'Note' : communicationType} sent successfully`
      };
    } catch (err) {
      console.error('Error sending communication:', err);
      return fail(500, {
        error: 'Failed to send communication'
      });
    }
  }
};
