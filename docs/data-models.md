# Data Models

## Database Schema

BrightBroom uses PostgreSQL with Prisma as the ORM. Below are the core data models:

### User

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  firstName     String
  lastName      String
  phone         String?
  role          UserRole  @default(CUSTOMER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  addresses     Address[]
  bookings      Booking[]
  payments      Payment[]
  cleanerBookings Booking[] @relation("CleanerBookings")
}

enum UserRole {
  CUSTOMER
  CLEANER
  ADMIN
}
```

### Address

```prisma
model Address {
  id            String    @id @default(uuid())
  userId        String
  street        String
  aptUnit       String?
  city          String
  state         String
  zipCode       String
  instructions  String?
  isDefault     Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  bookings      Booking[]
}
```

### Service

```prisma
model Service {
  id            String    @id @default(uuid())
  name          String
  description   String
  basePrice     Decimal   @db.Decimal(10, 2)
  durationHours Int
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  bookings      Booking[]
}
```

### Booking

```prisma
model Booking {
  id            String        @id @default(uuid())
  userId        String
  addressId     String
  serviceId     String
  cleanerId     String?
  status        BookingStatus @default(PENDING)
  scheduledDate DateTime
  duration      Int           // Duration in minutes
  price         Decimal       @db.Decimal(10, 2)
  notes         String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  user          User          @relation(fields: [userId], references: [id])
  address       Address       @relation(fields: [addressId], references: [id])
  service       Service       @relation(fields: [serviceId], references: [id])
  cleaner       User?         @relation("CleanerBookings", fields: [cleanerId], references: [id])
  payment       Payment?
}

enum BookingStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

### Payment

```prisma
model Payment {
  id                String        @id @default(uuid())
  bookingId         String        @unique
  userId            String
  amount            Decimal       @db.Decimal(10, 2)
  status            PaymentStatus @default(PENDING)
  paymentMethod     PaymentMethod @default(CREDIT_CARD)
  
  // PayFast specific fields
  payFastId         String?       // PayFast payment ID
  payFastToken      String?       // PayFast token for recurring payments
  merchantReference String?       // Your own reference number
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  booking           Booking       @relation(fields: [bookingId], references: [id])
  user              User          @relation(fields: [userId], references: [id])
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

enum PaymentMethod {
  CREDIT_CARD
  DEBIT_CARD
  EFT
  MOBICRED
  SNAPSCAN
  ZAPPER
  OTHER
}
```

## Data Relationships

### One-to-Many Relationships
- One User can have many Addresses
- One User can have many Bookings
- One User can have many Payments
- One Address can have many Bookings
- One Service can have many Bookings

### One-to-One Relationships
- One Booking has one Payment

### Special Relationships
- A Booking can optionally be assigned to a Cleaner (who is a User with role CLEANER)

## Data Validation

Validation is handled through Zod schemas. Example:

```typescript
// src/lib/schemas/booking.ts
import { z } from 'zod';

export const bookingSchema = z.object({
  serviceId: z.string().uuid(),
  addressId: z.string().uuid(),
  scheduledDate: z.string().refine(
    (date) => new Date(date) > new Date(),
    { message: 'Scheduled date must be in the future' }
  ),
  notes: z.string().optional(),
});

export const updateBookingSchema = bookingSchema.partial().extend({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
```

## Database Access Patterns

- Use Prisma for all database access
- Encapsulate database queries in service functions
- Use transactions for operations that modify multiple tables
- Implement proper error handling and validation

Example service function:

```typescript
// src/lib/server/booking.ts
import { prisma } from '$lib/server/prisma';
import type { BookingInput } from '$lib/schemas/booking';

export async function createBooking(userId: string, input: BookingInput) {
  const service = await prisma.service.findUnique({
    where: { id: input.serviceId },
  });
  
  if (!service) {
    throw new Error('Service not found');
  }
  
  return prisma.booking.create({
    data: {
      userId,
      addressId: input.addressId,
      serviceId: input.serviceId,
      scheduledDate: new Date(input.scheduledDate),
      duration: service.durationHours * 60,
      price: service.basePrice,
      notes: input.notes,
      status: 'PENDING',
    },
    include: {
      service: true,
      address: true,
    },
  });
}
```
