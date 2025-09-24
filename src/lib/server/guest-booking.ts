// src/lib/server/guest-booking.ts
import type { RequestEvent } from '@sveltejs/kit';

export interface GuestBookingData {
  serviceId: string;
  serviceName: string;
  servicePrice: string;
  scheduledDate?: string; // Optional for recurring bookings
  duration: number;
  notes?: string;

  // Recurring booking fields
  isRecurring?: boolean;
  recurringFrequency?: 'WEEKLY' | 'BIWEEKLY' | 'TWICE_WEEKLY' | 'TWICE_MONTHLY';
  preferredDays?: string[];
  preferredTimeSlot?: string;
  monthlyDates?: number[];
  // Alternative field names used in the booking flow
  recurringDays?: string[];
  recurringTimeSlot?: string;
  recurringMonthlyDates?: number[];
  basePrice?: number;
  discountPercentage?: number;
  finalPrice?: number;
  addressId?: string;
  cleanerId?: string;

  // Guest address info (contact info obtained during authentication)
  guestAddress?: {
    street: string;
    streetNumber?: string;
    aptUnit?: string;
    city: string;
    state: string;
    zipCode: string;
    instructions?: string;
    lat?: number;
    lng?: number;
  };
}

const GUEST_BOOKING_COOKIE = 'guest_booking_data';

/**
 * Store guest booking data in session cookie
 */
export function storeGuestBookingData(event: RequestEvent, data: Partial<GuestBookingData>): void {
  const existing = getGuestBookingData(event);
  const updated = { ...existing, ...data };
  
  // Serialize and store in cookie (expires in 24 hours)
  const cookieValue = encodeURIComponent(JSON.stringify(updated));
  
  event.cookies.set(GUEST_BOOKING_COOKIE, cookieValue, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 // 24 hours
  });
}

/**
 * Retrieve guest booking data from session cookie
 */
export function getGuestBookingData(event: RequestEvent): Partial<GuestBookingData> {
  const cookieValue = event.cookies.get(GUEST_BOOKING_COOKIE);
  
  if (!cookieValue) {
    return {};
  }
  
  try {
    const decoded = decodeURIComponent(cookieValue);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error parsing guest booking data:', error);
    return {};
  }
}

/**
 * Clear guest booking data from session cookie
 */
export function clearGuestBookingData(event: RequestEvent): void {
  event.cookies.delete(GUEST_BOOKING_COOKIE, {
    path: '/'
  });
}

/**
 * Check if guest booking data is complete for payment
 */
export function isGuestBookingDataComplete(data: Partial<GuestBookingData>): boolean {
  // For recurring bookings
  if (data.isRecurring) {
    return !!(
      data.serviceId &&
      data.recurringFrequency &&
      data.guestAddress?.city &&
      data.guestAddress?.state &&
      data.guestAddress?.zipCode
    );
  }

  // For one-time bookings
  return !!(
    data.serviceId &&
    data.scheduledDate &&
    data.guestAddress?.city &&
    data.guestAddress?.state &&
    data.guestAddress?.zipCode
  );
}

/**
 * Validate guest booking data structure
 */
export function validateGuestBookingData(data: any): data is GuestBookingData {
  if (!data || typeof data !== 'object') return false;

  // Required fields
  if (!data.serviceId || typeof data.serviceId !== 'string') return false;

  // For recurring bookings
  if (data.isRecurring) {
    if (!data.recurringFrequency || typeof data.recurringFrequency !== 'string') return false;
    // Other recurring fields are optional but validate if present
    if (data.preferredDays && !Array.isArray(data.preferredDays)) return false;
    if (data.monthlyDates && !Array.isArray(data.monthlyDates)) return false;
  } else {
    // For one-time bookings
    if (!data.scheduledDate || typeof data.scheduledDate !== 'string') return false;
  }

  // Guest contact info is no longer stored (obtained during authentication)

  // Optional address validation
  if (data.guestAddress) {
    if (typeof data.guestAddress !== 'object') return false;
    if (data.guestAddress.street && typeof data.guestAddress.street !== 'string') return false;
    if (data.guestAddress.city && typeof data.guestAddress.city !== 'string') return false;
    if (data.guestAddress.state && typeof data.guestAddress.state !== 'string') return false;
    if (data.guestAddress.zipCode && typeof data.guestAddress.zipCode !== 'string') return false;
    if (data.guestAddress.lat && typeof data.guestAddress.lat !== 'number') return false;
    if (data.guestAddress.lng && typeof data.guestAddress.lng !== 'number') return false;
  }

  return true;
}