import type {
  User,
  Address,
  Service,
  Booking,
  Payment,
  UserRole,
  BookingStatus,
  PaymentStatus,
  PaymentMethod
} from '@prisma/client';

// Re-export types from Prisma
export type {
  User,
  Address,
  Service,
  Booking,
  Payment,
  UserRole,
  BookingStatus,
  PaymentStatus,
  PaymentMethod
};

// Create combined types for common relations
export type UserWithAddresses = User & {
  addresses: Address[];
};

export type UserWithBookings = User & {
  bookings: Booking[];
};

export type BookingWithRelations = Booking & {
  user: User;
  address: Address;
  service: Service;
  cleaner?: User;
  payment?: Payment;
};

export type PaymentWithBooking = Payment & {
  booking: Booking;
};

// API response types (for type safety in API responses)
export type UserResponse = Omit<User, 'passwordHash'>;

export type BookingResponse = BookingWithRelations;
