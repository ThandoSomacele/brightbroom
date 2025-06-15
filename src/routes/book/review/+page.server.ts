// src/routes/book/review/+page.server.ts
import { db } from '$lib/server/db';
import { service, address, booking, user } from '$lib/server/db/schema';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { sendBookingConfirmationEmail } from '$lib/server/email-service';
import { addressService } from '$lib/server/services/address.service';
import { parseDateTimeString } from '$lib/utils/date-utils';
import { hash } from '@node-rs/argon2';

export const load: PageServerLoad = async ({ locals }) => {
  try {
    // Get all services for validation (both guests and authenticated users need this)
    const services = await db.select()
      .from(service);
    
    // For authenticated users, also get their addresses
    let addresses = [];
    if (locals.user) {
      addresses = await addressService.getUserAddresses(locals.user.id);
    }
    
    return {
      user: locals.user,
      isGuest: !locals.user,
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
    const formData = await request.formData();
    const serviceId = formData.get('serviceId')?.toString();
    const scheduledDate = formData.get('scheduledDate')?.toString();
    const notes = formData.get('notes')?.toString();
    
    // Guest user fields
    const isGuest = !locals.user;
    const guestEmail = formData.get('guestEmail')?.toString();
    const guestFirstName = formData.get('guestFirstName')?.toString();
    const guestLastName = formData.get('guestLastName')?.toString();
    const guestPhone = formData.get('guestPhone')?.toString();
    
    // Address fields (for guests)
    const addressStreet = formData.get('addressStreet')?.toString();
    const addressCity = formData.get('addressCity')?.toString();
    const addressState = formData.get('addressState')?.toString();
    const addressZipCode = formData.get('addressZipCode')?.toString();
    const addressCountry = formData.get('addressCountry')?.toString() || 'South Africa';
    const addressFormatted = formData.get('addressFormatted')?.toString();
    const addressInstructions = formData.get('addressInstructions')?.toString();
    
    // For authenticated users
    const addressId = formData.get('addressId')?.toString();
    
    // Validate required fields
    if (!serviceId || !scheduledDate) {
      return { success: false, error: 'Missing required booking information' };
    }
    
    // Validate guest information if not authenticated
    if (isGuest) {
      if (!guestEmail || !guestFirstName || !guestLastName) {
        return { success: false, error: 'Please provide your contact information' };
      }
      
      if (!addressStreet || !addressCity || !addressFormatted) {
        return { success: false, error: 'Please provide a valid address' };
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guestEmail)) {
        return { success: false, error: 'Please provide a valid email address' };
      }
    }
    
    // For authenticated users, validate address
    if (!isGuest && !addressId) {
      return { success: false, error: 'Please select an address' };
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
      let finalUserId = locals.user?.id;
      let finalAddressId = addressId;
      
      // Handle guest user booking
      if (isGuest) {
        // Check if user already exists with this email
        const existingUsers = await db.select()
          .from(user)
          .where(eq(user.email, guestEmail))
          .limit(1);
        
        if (existingUsers.length > 0) {
          return { 
            success: false, 
            error: 'An account with this email already exists. Please sign in to continue.',
            shouldRedirectToLogin: true
          };
        }
        
        // Create a temporary user account (they'll set password later)
        const tempPassword = crypto.randomUUID(); // Temporary password
        const hashedPassword = await hash(tempPassword);
        
        console.log('Creating user with data:', {
          email: guestEmail,
          firstName: guestFirstName,
          lastName: guestLastName,
          phone: guestPhone,
          hasPasswordHash: !!hashedPassword
        });
        
        const [newUser] = await db.insert(user).values({
          id: crypto.randomUUID(),
          email: guestEmail,
          passwordHash: hashedPassword, // ✅ Fixed: Use correct field name
          firstName: guestFirstName,
          lastName: guestLastName,
          phone: guestPhone || null,
          role: 'CUSTOMER',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();
        
        finalUserId = newUser.id;
        
        // Create address for the guest user
        const [newAddress] = await db.insert(address).values({
          id: crypto.randomUUID(),
          userId: finalUserId,
          street: addressStreet,
          city: addressCity,
          state: addressState,
          zipCode: addressZipCode,
          country: addressCountry,
          instructions: addressInstructions || null,
          isDefault: true, // First address is default
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();
        
        finalAddressId = newAddress.id;
        
        console.log(`✅ Created guest user: ${newUser.id} with address: ${newAddress.id}`);
      } else {
        // Validate address belongs to authenticated user
        const addressResult = await db.select()
          .from(address)
          .where(eq(address.id, addressId))
          .limit(1);
        
        if (addressResult.length === 0 || addressResult[0].userId !== locals.user.id) {
          return { success: false, error: 'Selected address not found or invalid' };
        }
      }
      
      // Parse the scheduled date
      const scheduledDateObj = new Date(parseDateTimeString(scheduledDate));
      
      // Calculate duration in minutes based on the service
      const durationMinutes = serviceData.durationHours * 60;
      
      // Create booking ID
      const bookingId = crypto.randomUUID();
      
      // Insert the booking into the database
      const [newBooking] = await db.insert(booking).values({
        id: bookingId,
        userId: finalUserId,
        serviceId: serviceId,
        addressId: finalAddressId,
        status: 'PENDING',
        scheduledDate: scheduledDateObj,
        duration: durationMinutes,
        price: serviceData.basePrice,
        notes: notes || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      console.log(`✅ Created new booking: ${newBooking.id} for user: ${finalUserId} (guest: ${isGuest})`);
      
      // Get user's email for sending confirmation
      const userEmail = isGuest ? guestEmail : locals.user.email;
      
      // Get address data for email
      const addressData = await db.select()
        .from(address)
        .where(eq(address.id, finalAddressId))
        .limit(1);
      
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
          street: addressData[0].street,
          city: addressData[0].city,
          state: addressData[0].state,
          zipCode: addressData[0].zipCode
        },
        isGuestBooking: isGuest
      };
      
      // Send booking confirmation email
      sendBookingConfirmationEmail(userEmail, bookingDataForEmail)
        .then(success => {
          console.log(`📧 Booking confirmation email ${success ? 'sent' : 'failed to send'} to ${userEmail}`);
        })
        .catch(err => {
          console.error('❌ Error sending booking confirmation email:', err);
        });
      
      return { 
        success: true,
        bookingId: newBooking.id,
        isGuestBooking: isGuest,
        message: 'Booking created successfully' 
      };
    } catch (err) {
      console.error('❌ Error creating booking:', err);
      return { 
        success: false, 
        error: 'Failed to create booking. Please try again.' 
      };
    }
  }
};
