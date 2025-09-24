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
      guestAddress
    });
    
    return { success: true };
  },
  
  createBooking: async ({ request, locals, ...event }) => {
    const formData = await request.formData();
    const serviceId = formData.get('serviceId')?.toString();
    const scheduledDate = formData.get('scheduledDate')?.toString();
    const notes = formData.get('notes')?.toString();
    const cleanerId = formData.get('cleanerId')?.toString() || null;

    // Check if this is a recurring booking
    const isRecurring = formData.get('isRecurring') === 'true';
    const recurringFrequency = formData.get('recurringFrequency')?.toString();
    const recurringDays = formData.get('recurringDays')?.toString();
    const recurringMonthlyDates = formData.get('recurringMonthlyDates')?.toString();
    const recurringTimeSlot = formData.get('recurringTimeSlot')?.toString();
    const discountPercentage = formData.get('discountPercentage')?.toString();
    const finalPrice = formData.get('finalPrice')?.toString();
    const startDate = formData.get('startDate')?.toString();

    // Guest booking data (contact info will be obtained during authentication)
    const guestAddressData = formData.get('guestAddress')?.toString();

    // Authenticated user booking data
    const addressId = formData.get('addressId')?.toString();

    // Validate required fields based on booking type
    if (!serviceId) {
      return { success: false, error: 'Missing service information' };
    }

    if (isRecurring) {
      if (!recurringFrequency || !recurringTimeSlot) {
        return { success: false, error: 'Missing recurring booking information' };
      }
    } else {
      if (!scheduledDate) {
        return { success: false, error: 'Missing booking date information' };
      }
    }
    
    // Validate based on user type
    if (locals.user) {
      // Authenticated user - require addressId
      if (!addressId) {
        return { success: false, error: 'Address selection is required' };
      }
    } else {
      // Guest user - only require address data (contact info will be collected during authentication)
      if (!guestAddressData) {
        return { success: false, error: 'Address information is required' };
      }
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
          guestAddress = JSON.parse(guestAddressData!);
          
          // Check if guest address is null or missing required fields
          if (!guestAddress) {
            return { success: false, error: 'Guest address information is missing' };
          }
          
          // For South African addresses, validate required fields
          // Street can be empty for estates/complexes as long as we have other identifying info
          if (!guestAddress.city || !guestAddress.state || !guestAddress.zipCode) {
            return { success: false, error: 'Complete address information is required (city, province, and postal code)' };
          }
        } catch (error) {
          return { success: false, error: 'Invalid address format' };
        }
      }
      
      // Handle recurring booking differently
      if (isRecurring) {
        // Recurring bookings require authentication
        if (!locals.user) {
          // Store recurring booking data for after authentication
          storeGuestBookingData(event, {
            serviceId,
            serviceName: serviceData.name,
            servicePrice: serviceData.basePrice,
            isRecurring: true,
            recurringFrequency,
            recurringDays: recurringDays ? JSON.parse(recurringDays) : [],
            recurringMonthlyDates: recurringMonthlyDates ? JSON.parse(recurringMonthlyDates) : [],
            recurringTimeSlot,
            discountPercentage: parseFloat(discountPercentage || '0'),
            finalPrice: parseFloat(finalPrice || serviceData.basePrice.toString()),
            startDate,
            notes: notes || undefined,
            guestAddress
          });

          // Redirect guest users to login/register for recurring bookings
          return {
            success: true,
            requiresAuth: true,
            redirectTo: '/book/payment'
          };
        }

        // For authenticated users, redirect to subscription creation
        // Store the recurring booking data in session for the subscription API
        storeGuestBookingData(event, {
          serviceId,
          serviceName: serviceData.name,
          addressId,
          cleanerId,
          isRecurring: true,
          recurringFrequency,
          recurringDays: recurringDays ? JSON.parse(recurringDays) : [],
          recurringMonthlyDates: recurringMonthlyDates ? JSON.parse(recurringMonthlyDates) : [],
          recurringTimeSlot,
          discountPercentage: parseFloat(discountPercentage || '0'),
          finalPrice: parseFloat(finalPrice || serviceData.basePrice.toString()),
          basePrice: serviceData.basePrice,
          startDate: startDate || new Date().toISOString(),
          notes: notes || undefined
        });

        // Return success with subscription flag
        return {
          success: true,
          isSubscription: true,
          redirectTo: '/api/subscription/create-redirect'
        };
      }

      // One-time booking logic (existing code)
      const scheduledDateObj = new Date(parseDateTimeString(scheduledDate));

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
        cleanerId: cleanerId,
        status: 'PENDING' as const,
        scheduledDate: scheduledDateObj,
        duration: durationMinutes,
        price: serviceData.basePrice,
        notes: notes || null,
        // Guest booking fields - only address data (contact info obtained during authentication)
        guestAddress: locals.user ? null : guestAddress,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Insert the booking into the database
      const [newBooking] = await db.insert(booking).values(bookingData).returning();
      
      console.log(`Created new booking: ${newBooking.id} for ${locals.user ? 'user: ' + locals.user.id : 'guest (contact info to be collected during authentication)'}`);
      
      // Store guest booking data in session for potential future use
      if (!locals.user) {
        storeGuestBookingData(event, {
          serviceId,
          serviceName: serviceData.name,
          servicePrice: serviceData.basePrice,
          scheduledDate,
          duration: durationMinutes,
          notes: notes || undefined,
          guestAddress
        });
      }
      
      // Send booking confirmation email only for authenticated users
      // Guest users will receive confirmation after authentication during payment
      if (locals.user) {
        const emailAddress = {
          street: addressData!.street,
          city: addressData!.city,
          state: addressData!.state,
          zipCode: addressData!.zipCode
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
        
        sendBookingConfirmationEmail(locals.user.email, bookingDataForEmail)
          .then(success => {
            console.log(`Booking confirmation email ${success ? 'sent' : 'failed to send'} to ${locals.user!.email}`);
          })
          .catch(err => {
            console.error('Error sending booking confirmation email:', err);
          });
      } else {
        console.log(`Created guest booking: ${newBooking.id}, confirmation email will be sent after authentication`);
      }
      
      return { 
        success: true,
        bookingId: newBooking.id,
        message: 'Booking created successfully',
        isGuest: !locals.user
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
