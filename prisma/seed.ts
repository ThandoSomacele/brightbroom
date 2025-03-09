// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Clean up existing data
    console.log('Cleaning existing data...');
    await prisma.payment.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.cleanerSpecialization.deleteMany({});
    await prisma.cleanerProfile.deleteMany({});
    await prisma.address.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('Creating services...');
    // Create services
    const regularCleaning = await prisma.service.create({
      data: {
        name: 'Regular Cleaning',
        description: 'Standard cleaning service for homes and apartments',
        basePrice: 350.00,
        durationHours: 2,
      },
    });

    const deepCleaning = await prisma.service.create({
      data: {
        name: 'Deep Cleaning',
        description: 'Thorough cleaning including hard-to-reach areas',
        basePrice: 550.00,
        durationHours: 4,
      },
    });

    const officeCleaning = await prisma.service.create({
      data: {
        name: 'Office Cleaning',
        description: 'Professional cleaning for office spaces',
        basePrice: 450.00,
        durationHours: 3,
      },
    });

    console.log('Creating admin...');
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@brightbroom.com',
        passwordHash: 'hashed_password_placeholder',
        role: 'ADMIN',
        phone: '+27 12 345 6789',
      },
    });

    console.log('Creating cleaners...');
    // Create first cleaner with profile
    const johnCleaner = await prisma.user.create({
      data: {
        firstName: 'John',
        lastName: 'Cleaner',
        email: 'john@brightbroom.com',
        passwordHash: 'hashed_password_placeholder',
        role: 'CLEANER',
        phone: '+27 11 222 3333',
      },
      include: {
        cleanerProfile: true
      }
    });

    const johnProfile = await prisma.cleanerProfile.create({
      data: {
        userId: johnCleaner.id,
        idType: 'SOUTH_AFRICAN_ID',
        idNumber: '8901015026082',
        workAddress: '123 Cleaner St, Cape Town',
        workLocationLat: -33.925,
        workLocationLng: 18.423,
        workRadius: 15.0,
        petCompatibility: 'DOGS',
        availableDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
        bio: 'Experienced cleaner with 5 years of professional experience.',
        rating: 4.8,
      }
    });

    // Create second cleaner with profile
    const sarahCleaner = await prisma.user.create({
      data: {
        firstName: 'Sarah',
        lastName: 'Cleaner',
        email: 'sarah@brightbroom.com',
        passwordHash: 'hashed_password_placeholder',
        role: 'CLEANER',
        phone: '+27 11 444 5555',
      },
      include: {
        cleanerProfile: true
      }
    });

    const sarahProfile = await prisma.cleanerProfile.create({
      data: {
        userId: sarahCleaner.id,
        idType: 'PASSPORT',
        idNumber: 'A12345678',
        workAddress: '456 Helper Ave, Cape Town',
        workLocationLat: -33.906,
        workLocationLng: 18.417,
        workRadius: 10.0,
        petCompatibility: 'BOTH',
        availableDays: ['TUESDAY', 'THURSDAY', 'SATURDAY', 'SUNDAY'],
        bio: 'Detail-oriented and efficient. Specialized in deep cleaning.',
        rating: 4.9,
      }
    });

    console.log('Creating specializations...');
    // Add specializations
    await prisma.cleanerSpecialization.create({
      data: {
        cleanerProfileId: johnProfile.id,
        serviceId: regularCleaning.id,
        experience: 60,
      }
    });

    await prisma.cleanerSpecialization.create({
      data: {
        cleanerProfileId: sarahProfile.id,
        serviceId: deepCleaning.id,
        experience: 48,
      }
    });

    await prisma.cleanerSpecialization.create({
      data: {
        cleanerProfileId: sarahProfile.id,
        serviceId: officeCleaning.id,
        experience: 36,
      }
    });

    console.log('Creating customer...');
    // Create customer with addresses
    const customer = await prisma.user.create({
      data: {
        firstName: 'Test',
        lastName: 'Customer',
        email: 'customer@example.com',
        passwordHash: 'hashed_password_placeholder',
        role: 'CUSTOMER',
        phone: '+27 12 987 6543',
      }
    });

    const address1 = await prisma.address.create({
      data: {
        userId: customer.id,
        street: '123 Main Street',
        city: 'Cape Town',
        state: 'Western Cape',
        zipCode: '8001',
        isDefault: true,
      }
    });

    const address2 = await prisma.address.create({
      data: {
        userId: customer.id,
        street: '456 Beach Road',
        city: 'Cape Town',
        state: 'Western Cape',
        zipCode: '8005',
        isDefault: false,
      }
    });

    console.log('Creating bookings...');
    // Create bookings
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    const booking1 = await prisma.booking.create({
      data: {
        userId: customer.id,
        addressId: address1.id,
        serviceId: regularCleaning.id,
        cleanerId: johnCleaner.id,
        status: 'CONFIRMED',
        scheduledDate: oneWeekFromNow,
        duration: regularCleaning.durationHours * 60,
        price: regularCleaning.basePrice,
        notes: 'Please bring eco-friendly cleaning products',
      }
    });

    await prisma.payment.create({
      data: {
        bookingId: booking1.id,
        userId: customer.id,
        amount: regularCleaning.basePrice,
        status: 'COMPLETED',
        paymentMethod: 'CREDIT_CARD',
        payFastId: 'pf_' + Math.random().toString(36).substring(2, 15),
        merchantReference: 'BB-' + Math.random().toString(36).substring(2, 10),
      }
    });

    await prisma.booking.create({
      data: {
        userId: customer.id,
        addressId: address2.id,
        serviceId: deepCleaning.id,
        status: 'PENDING',
        scheduledDate: twoWeeksFromNow,
        duration: deepCleaning.durationHours * 60,
        price: deepCleaning.basePrice,
        notes: 'Front door code: 1234',
      }
    });

    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
