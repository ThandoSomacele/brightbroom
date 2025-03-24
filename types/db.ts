// src/lib/types/db.ts
import type {
  Address,
  Booking,
  CleanerProfile,
  CleanerSpecialisation,
  Payment,
  Service,
  User,
} from "$lib/server/db/schema";

// Re-export types from Drizzle schema
export type {
  Address,
  Booking,
  CleanerProfile,
  CleanerSpecialisation,
  Payment,
  Service,
  User,
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

export type CleanerProfileWithSpecialisations = CleanerProfile & {
  specialisations: CleanerSpecialisation[];
};

export type CleanerWithFullDetails = User & {
  cleanerProfile: CleanerProfileWithSpecialisations;
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

export type ServiceWithSpecialisations = Service & {
  cleanerSpecialisations: CleanerSpecialisation[];
};

export type PaymentWithBooking = Payment & {
  booking: Booking;
};

// API response types (for type safety in API responses)
export type UserResponse = Omit<User, "passwordHash">;

export type BookingResponse = BookingWithRelations;

export type CleanerResponse = Omit<User, "passwordHash"> & {
  cleanerProfile: CleanerProfile;
};
