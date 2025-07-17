// src/routes/book/review/+page.server.ts
import { db } from '$lib/server/db';
import { service, address, booking, user } from '$lib/server/db/schema';
import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { sendBookingConfirmationEmail } from '$lib/server/email-service';
import { addressService } from '$lib/server/services/address.service';
import { parseDateTimeString } from '$lib/utils/date-utils';
import { getGuestBookingData, storeGuestBookingData } from '$lib/server/guest-booking';

export const load: PageServerLoad = async ({ locals, ...event }) => {
  // Load guest booking data from session
  const guestBookingData = getGuestBookingData(event);
  
  try {
    // Get services for validation
    const services = await db.select().from(service);
    
    // For authenticated users, also load their addresses
    if (locals.user) {
      const addresses = await addressService.getUserAddresses(locals.user.id);
      
      return {
        user: locals.user,
        addresses,
        services,
        guestBookingData,
        isAuthenticated: true
      };
    }
    
    // For guest users, return guest booking data
    return {
      user: null,
      addresses: [],
      services,
      guestBookingData,
      isAuthenticated: false
    };
  } catch (err) {
    console.error('Error loading booking data:', err);
    throw error(500, 'Failed to load booking data');
  }
};

export const actions: Actions = {
  storeGuestData: async ({ request, ...event }) => {
    const formData = await request.formData();
    const guestName = formData.get('guestName')?.toString();
    const guestEmail = formData.get('guestEmail')?.toString();
    const guestPhone = formData.get('guestPhone')?.toString();
    const guestAddressData = formData.get('guestAddress')?.toString();
    
    let guestAddress = null;
    if (guestAddressData) {
      try {
        guestAddress = JSON.parse(guestAddressData);
      } catch (error) {
        return { success: false, error: 'Invalid address format' };
      }
    }
    
    // Store guest data in session
    storeGuestBookingData(event, {
      guestName,
      guestEmail,
      guestPhone,
      guestAddress
    });
    
    return { success: true };
  },
  
  createBooking: async ({ request, locals, ...event }) => {
    const formData = await request.formData();
    const serviceId = formData.get('serviceId')?.toString();
    const scheduledDate = formData.get('scheduledDate')?.toString();
    const notes = formData.get('notes')?.toString();
    
    // Guest booking data
    const guestName = formData.get('guestName')?.toString();
    const guestEmail = formData.get('guestEmail')?.toString();
    const guestPhone = formData.get('guestPhone')?.toString();
    const guestAddressData = formData.get('guestAddress')?.toString();
    
    // Authenticated user booking data
    const addressId = formData.get('addressId')?.toString();
    
    console.log('Booking creation attempt with data:', {
      serviceId,
      scheduledDate,
      notes,
      guestName,
      guestEmail,
      guestPhone,
      guestAddressData,
      addressId,
      isAuthenticated: !!locals.user
    });
    
    if (!serviceId || !scheduledDate) {
      console.log('Missing required booking information:', { serviceId, scheduledDate });
      return { success: false, error: 'Missing required booking information' };
    }
    
    // Validate based on user type
    if (locals.user) {
      // Authenticated user - require addressId
      if (!addressId) {
        return { success: false, error: 'Address selection is required' };
      }
    } else {
      // Guest user - require guest information
      if (!guestName || !guestEmail || !guestPhone || !guestAddressData) {
        return { success: false, error: 'Guest contact information and address are required' };
      }
    }
    
    try {
      // Validate service exists
      console.log('Looking for service with ID:', serviceId);
      const serviceResult = await db.select()
        .from(service)
        .where(eq(service.id, serviceId))
        .limit(1);
      
      if (serviceResult.length === 0) {
        console.log('Service not found, available services:', await db.select().from(service));
        return { success: false, error: 'Selected service not found' };
      }
      
      const serviceData = serviceResult[0];
      let addressData = null;
      let guestAddress = null;
      
      // Handle address validation based on user type
      if (locals.user) {
        // Authenticated user - validate address exists and belongs to user
        const addressResult = await db.select()
          .from(address)
          .where(eq(address.id, addressId!))
          .limit(1);
        
        if (addressResult.length === 0 || addressResult[0].userId !== locals.user.id) {
          return { success: false, error: 'Selected address not found or invalid' };
        }
        
        addressData = addressResult[0];
      } else {
        // Guest user - parse and validate guest address
        try {
          console.log('Attempting to parse guest address data:', guestAddressData);
          guestAddress = JSON.parse(guestAddressData!);
          console.log('Parsed guest address:', guestAddress);
          
          // Check if guest address is null or missing required fields
          if (!guestAddress) {
            return { success: false, error: 'Guest address information is missing' };
          }
          
          // For South African addresses, validate required fields
          // Street can be empty for estates/complexes as long as we have other identifying info
          if (!guestAddress.city || !guestAddress.state || !guestAddress.zipCode) {
            console.log('Guest address missing required fields:', { 
              city: guestAddress.city, 
              state: guestAddress.state, 
              zipCode: guestAddress.zipCode 
            });
            return { success: false, error: 'Complete address information is required (city, province, and postal code)' };
          }
        } catch (error) {
          console.log('Error parsing guest address:', error);
          return { success: false, error: 'Invalid address format' };
        }
      }
      
      // Parse the scheduled date
      console.log('Parsing scheduled date:', scheduledDate);
      const scheduledDateObj = new Date(parseDateTimeString(scheduledDate));
      console.log('Parsed scheduled date:', scheduledDateObj);
      
      // Calculate duration in minutes based on the service
      const durationMinutes = serviceData.durationHours * 60;
      
      // Create booking ID
      const bookingId = crypto.randomUUID();
      
      // Prepare booking data
      const bookingData = {
        id: bookingId,
        userId: locals.user?.id || null,
        serviceId: serviceId,
        addressId: locals.user ? addressId : null,
        status: 'PENDING' as const,
        scheduledDate: scheduledDateObj,
        duration: durationMinutes,
        price: serviceData.basePrice,
        notes: notes || null,
        // Guest booking fields
        guestName: locals.user ? null : guestName,
        guestEmail: locals.user ? null : guestEmail,
        guestPhone: locals.user ? null : guestPhone,
        guestAddress: locals.user ? null : guestAddress,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Insert the booking into the database
      console.log('About to insert booking with data:', bookingData);
      const [newBooking] = await db.insert(booking).values(bookingData).returning();
      console.log('Booking inserted successfully:', newBooking.id);
      
      console.log(`Created new booking: ${newBooking.id} for ${locals.user ? 'user: ' + locals.user.id : 'guest: ' + guestEmail}`);
      
      // Store guest booking data in session for potential future use
      if (!locals.user) {
        storeGuestBookingData(event, {
          serviceId,
          serviceName: serviceData.name,
          servicePrice: serviceData.basePrice,
          scheduledDate,
          duration: durationMinutes,
          notes: notes || undefined,
          guestName,
          guestEmail,
          guestPhone,
          guestAddress
        });
      }
      
      // Prepare booking data for email
      const emailAddress = locals.user ? 
        {
          street: addressData!.street,
          city: addressData!.city,
          state: addressData!.state,
          zipCode: addressData!.zipCode
        } : 
        {
          street: guestAddress!.street,
          city: guestAddress!.city,
          state: guestAddress!.state,
          zipCode: guestAddress!.zipCode
        };
      
      const bookingDataForEmail = {
        id: newBooking.id,
        service: {
          name: serviceData.name,
          description: serviceData.description
        },
        scheduledDate: scheduledDateObj.toISOString(),
        price: newBooking.price,
        address: emailAddress
      };
      
      // Send booking confirmation email
      const recipientEmail = locals.user ? locals.user.email : guestEmail!;
      sendBookingConfirmationEmail(recipientEmail, bookingDataForEmail)
        .then(success => {
          console.log(`Booking confirmation email ${success ? 'sent' : 'failed to send'} to ${recipientEmail}`);
        })
        .catch(err => {
          console.error('Error sending booking confirmation email:', err);
        });
      
      return { 
        success: true,
        bookingId: newBooking.id,
        message: 'Booking created successfully',
        isGuest: !locals.user,
        guestEmail: locals.user ? null : guestEmail
      };
    } catch (err) {
      console.error('Error creating booking:', err);
      console.error('Full error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        cause: err.cause
      });
      return { 
        success: false, 
        error: 'Failed to create booking. Please try again.' 
      };
    }
  }
};
