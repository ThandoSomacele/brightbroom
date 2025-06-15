// src/lib/stores/guest-booking.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * Guest booking data structure
 * This stores booking information for users who haven't signed up yet
 */
export interface GuestBookingData {
  serviceId: string;
  addressData: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    formatted: string;
    instructions?: string;
  };
  scheduledDate: string;
  notes?: string;
  // Temporary guest data
  guestInfo?: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
}

/**
 * Guest booking store for reactive updates
 */
export const guestBooking = writable<GuestBookingData | null>(null);

/**
 * Guest booking service - handles localStorage persistence
 */
export class GuestBookingService {
  private static readonly STORAGE_KEY = 'brightbroom_guest_booking';
  
  /**
   * Save guest booking data to localStorage
   */
  static save(data: Partial<GuestBookingData>): void {
    if (!browser) return;
    
    try {
      const existing = this.load() || {};
      const updated = { ...existing, ...data };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      guestBooking.set(updated as GuestBookingData);
    } catch (error) {
      console.error('Error saving guest booking data:', error);
    }
  }
  
  /**
   * Load guest booking data from localStorage
   */
  static load(): GuestBookingData | null {
    if (!browser) return null;
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const data = JSON.parse(stored) as GuestBookingData;
      guestBooking.set(data);
      return data;
    } catch (error) {
      console.error('Error loading guest booking data:', error);
      return null;
    }
  }
  
  /**
   * Clear guest booking data
   */
  static clear(): void {
    if (!browser) return;
    
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      guestBooking.set(null);
    } catch (error) {
      console.error('Error clearing guest booking data:', error);
    }
  }
  
  /**
   * Check if we have enough data to show a booking review
   */
  static isReadyForReview(): boolean {
    const data = this.load();
    return !!(
      data?.serviceId && 
      data?.addressData?.formatted && 
      data?.scheduledDate
    );
  }
  
  /**
   * Convert localStorage booking data to a format compatible with existing booking flow
   * This maintains backward compatibility with your current localStorage approach
   */
  static syncWithLegacyStorage(): void {
    if (!browser) return;
    
    const data = this.load();
    if (!data) return;
    
    // Keep existing localStorage keys for backward compatibility
    if (data.serviceId) {
      localStorage.setItem('booking_service', data.serviceId);
    }
    if (data.scheduledDate) {
      localStorage.setItem('booking_schedule', data.scheduledDate);
    }
    if (data.notes) {
      localStorage.setItem('booking_notes', data.notes);
    }
    if (data.addressData?.instructions) {
      localStorage.setItem('booking_instructions', data.addressData.instructions);
    }
  }
  
  /**
   * Load data from legacy localStorage keys and migrate to new format
   */
  static migrateFromLegacyStorage(): void {
    if (!browser) return;
    
    const serviceId = localStorage.getItem('booking_service');
    const scheduledDate = localStorage.getItem('booking_schedule');
    const notes = localStorage.getItem('booking_notes');
    const instructions = localStorage.getItem('booking_instructions');
    
    if (serviceId && scheduledDate) {
      // We have some legacy data, but we need address data too
      // This will be handled in the address page
      this.save({
        serviceId,
        scheduledDate,
        notes: notes || undefined,
        addressData: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'South Africa',
          formatted: '',
          instructions: instructions || undefined
        }
      });
    }
  }
}
