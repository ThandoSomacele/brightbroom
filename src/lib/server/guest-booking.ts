// src/lib/server/guest-booking.ts
import type { RequestEvent } from '@sveltejs/kit';

export interface GuestBookingData {
  serviceId: string;
  serviceName: string;
  servicePrice: string;
  scheduledDate: string;
  duration: number;
  notes?: string;
  
  // Guest contact info
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  
  // Guest address info
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
  return !!(
    data.serviceId &&
    data.scheduledDate &&
    data.guestName &&
    data.guestEmail &&
    data.guestPhone &&
    data.guestAddress?.street &&
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
  if (!data.scheduledDate || typeof data.scheduledDate !== 'string') return false;
  
  // Optional guest info validation
  if (data.guestName && typeof data.guestName !== 'string') return false;
  if (data.guestEmail && typeof data.guestEmail !== 'string') return false;
  if (data.guestPhone && typeof data.guestPhone !== 'string') return false;
  
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