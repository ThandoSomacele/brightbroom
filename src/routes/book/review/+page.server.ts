// src/routes/book/review/+page.server.ts
import { db } from '$lib/server/db';
import { service, address, booking, user } from '$lib/server/db/schema';
import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { sendBookingConfirmationEmail } from '$lib/server/email-service';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  // Check if the user is logged in
  if (!locals.user) {
    throw redirect(302, '/auth/login?redirectTo=/book/review');
  }
  
  // In a real application, we would validate booking data from a session or database
  // For this example, we'll use client-side localStorage but validate it server-side
  
  try {
    // Get the user's addresses and services for validation
    const addresses = await db.select()
      .from(address)
      .where(eq(address.userId, locals.user.id));
    
    const services = await db.select()
      .from(service);
    
    return {
      user: locals.user,
      addresses,
      services
    };
  } catch (err) {
    console.error('Error loading booking data:', err);
    throw error(500, 'Failed to load booking data');
  }
};

export const actions: Actions = {
  createBooking: async ({ request, locals }) => {
    // Check if the user is logged in
    if (!locals.user) {
      return { success: false, error: 'You must be logged in to create a booking' };
    }
    
    const formData = await request.formData();
    const serviceId = formData.get('serviceId')?.toString();
    const addressId = formData.get('addressId')?.toString();
    const scheduledDate = formData.get('scheduledDate')?.toString();
    const notes = formData.get('notes')?.toString();
    
    if (!serviceId || !addressId || !scheduledDate) {
      return { success: false, error: 'Missing required booking information' };
    }
    
    try {
      // Validate service exists
      const serviceResult = await db.select()
        .from(service)
        .where(eq(service.id, serviceId))
        .limit(1);
      
      if (serviceResult.length === 0) {
        return { success: false, error: 'Selected service not found' };
      }
      
      // Validate address exists and belongs to user
      const addressResult = await db.select()
        .from(address)
        .where(eq(address.id, addressId))
        .limit(1);
      
      if (addressResult.length === 0 || addressResult[0].userId !== locals.user.id) {
        return { success: false, error: 'Selected address not found or invalid' };
      }
      
      // Get service price and details
      const serviceData = serviceResult[0];
      const addressData = addressResult[0];
      
      // Parse the scheduled date
      const scheduledDateObj = new Date(scheduledDate);
      
      // Calculate duration in minutes based on the service
      const durationMinutes = serviceData.durationHours * 60;
      
      // Create booking ID
      const bookingId = crypto.randomUUID();
      
      // Insert the booking into the database
      const [newBooking] = await db.insert(booking).values({
        id: bookingId,
        userId: locals.user.id,
        serviceId: serviceId,
        addressId: addressId,
        status: 'PENDING',
        scheduledDate: scheduledDateObj,
        duration: durationMinutes,
        price: serviceData.basePrice,
        notes: notes || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      console.log(`Created new booking: ${newBooking.id} for user: ${locals.user.id}`);
      
      // Get user's email for sending confirmation
      const userData = locals.user;
      
      // Prepare booking data for email
      const bookingDataForEmail = {
        id: newBooking.id,
        service: {
          name: serviceData.name,
          description: serviceData.description
        },
        scheduledDate: scheduledDateObj.toISOString(),
        price: newBooking.price,
        address: {
          street: addressData.street,
          city: addressData.city,
          state: addressData.state,
          zipCode: addressData.zipCode
        }
      };
      
      // Send booking confirmation email
      // Note: We're not waiting for this to complete since we don't want 
      // to block the user's flow if email sending has issues
      sendBookingConfirmationEmail(userData.email, bookingDataForEmail)
        .then(success => {
          console.log(`Booking confirmation email ${success ? 'sent' : 'failed to send'} to ${userData.email}`);
        })
        .catch(err => {
          console.error('Error sending booking confirmation email:', err);
        });
      
      return { 
        success: true,
        bookingId: newBooking.id,
        message: 'Booking created successfully' 
      };
    } catch (err) {
      console.error('Error creating booking:', err);
      return { 
        success: false, 
        error: 'Failed to create booking. Please try again.' 
      };
    }
  }
};
