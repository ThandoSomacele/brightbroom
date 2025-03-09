import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data if needed
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.address.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding database...');

  // Create services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Regular Cleaning',
        description: 'Standard cleaning service for homes and apartments',
        basePrice: 350.00,
        durationHours: 2,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Deep Cleaning',
        description: 'Thorough cleaning including hard-to-reach areas',
        basePrice: 550.00,
        durationHours: 4,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Office Cleaning',
        description: 'Professional cleaning for office spaces',
        basePrice: 450.00,
        durationHours: 3,
      },
    }),
  ]);

  console.log('Created services:', services);

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@brightbroom.com',
      passwordHash: 'hashed_password_placeholder', // Will be replaced with secure hash when auth is implemented
      role: 'ADMIN',
      phone: '+27 12 345 6789',
    },
  });

  console.log('Created admin user:', adminUser);

  // Create cleaner users
  const cleaners = await Promise.all([
    prisma.user.create({
      data: {
        firstName: 'John',
        lastName: 'Cleaner',
        email: 'john@brightbroom.com',
        passwordHash: 'hashed_password_placeholder',
        role: 'CLEANER',
        phone: '+27 11 222 3333',
      },
    }),
    prisma.user.create({
      data: {
        firstName: 'Sarah',
        lastName: 'Cleaner',
        email: 'sarah@brightbroom.com',
        passwordHash: 'hashed_password_placeholder',
        role: 'CLEANER',
        phone: '+27 11 444 5555',
      },
    }),
  ]);

  console.log('Created cleaners:', cleaners);

  // Create customer user with address
  const customer = await prisma.user.create({
    data: {
      firstName: 'Test',
      lastName: 'Customer',
      email: 'customer@example.com',
      passwordHash: 'hashed_password_placeholder',
      role: 'CUSTOMER',
      phone: '+27 12 987 6543',
      addresses: {
        create: [
          {
            street: '123 Main Street',
            city: 'Cape Town',
            state: 'Western Cape',
            zipCode: '8001',
            isDefault: true,
          },
          {
            street: '456 Beach Road',
            city: 'Cape Town',
            state: 'Western Cape',
            zipCode: '8005',
            isDefault: false,
          },
        ],
      },
    },
    include: {
      addresses: true,
    },
  });

  console.log('Created customer with addresses:', customer);

  // Create some bookings
  const oneWeekFromNow = new Date();
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
  
  const twoWeeksFromNow = new Date();
  twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        userId: customer.id,
        addressId: customer.addresses[0].id,
        serviceId: services[0].id,
        cleanerId: cleaners[0].id,
        status: 'CONFIRMED',
        scheduledDate: oneWeekFromNow,
        duration: services[0].durationHours * 60,
        price: services[0].basePrice,
        notes: 'Please bring eco-friendly cleaning products',
        payment: {
          create: {
            userId: customer.id,
            amount: services[0].basePrice,
            status: 'COMPLETED',
            paymentMethod: 'CREDIT_CARD',
            payFastId: 'pf_' + Math.random().toString(36).substring(2, 15),
            merchantReference: 'BB-' + Math.random().toString(36).substring(2, 10),
          },
        },
      },
    }),
    prisma.booking.create({
      data: {
        userId: customer.id,
        addressId: customer.addresses[1].id,
        serviceId: services[1].id,
        status: 'PENDING',
        scheduledDate: twoWeeksFromNow,
        duration: services[1].durationHours * 60,
        price: services[1].basePrice,
        notes: 'Front door code: 1234',
      },
    }),
  ]);

  console.log('Created bookings:', bookings);

  console.log('Database seeding completed.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
