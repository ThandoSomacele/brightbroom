import type {
  User,
  Address,
  Service,
  Booking,
  Payment,
  UserRole,
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
  CleanerProfile,
  CleanerSpecialization,
  IdType,
  PetCompatibility,
  DayOfWeek
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
  PaymentMethod,
  CleanerProfile,
  CleanerSpecialization,
  IdType,
  PetCompatibility,
  DayOfWeek
};

// Create combined types for common relations
export type UserWithAddresses = User & {
  addresses: Address[];
};

export type UserWithBookings = User & {
  bookings: Booking[];
};

export type UserWithCleanerProfile = User & {
  cleanerProfile: CleanerProfile | null;
};

export type CleanerProfileWithSpecializations = CleanerProfile & {
  specializations: CleanerSpecialization[];
};

export type CleanerWithFullDetails = User & {
  cleanerProfile: CleanerProfileWithSpecializations;
};

export type BookingWithRelations = Booking & {
  user: User;
  address: Address;
  service: Service;
  cleaner?: User & {
    cleanerProfile?: CleanerProfile;
  };
  payment?: Payment;
};

export type ServiceWithSpecializations = Service & {
  cleanerSpecializations: CleanerSpecialization[];
};

export type PaymentWithBooking = Payment & {
  booking: Booking;
};

// API response types (for type safety in API responses)
export type UserResponse = Omit<User, 'passwordHash'>;

export type BookingResponse = BookingWithRelations;

export type CleanerResponse = Omit<User, 'passwordHash'> & {
  cleanerProfile: CleanerProfile;
};
