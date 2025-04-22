// src/lib/server/services/cleaner-assignment.service.ts

import { db } from "$lib/server/db";
import { booking, cleanerProfile, user, service, address } from "$lib/server/db/schema";
import { eq, and, gte, lt, like, or, ne, sql } from "drizzle-orm"; 
import { getDistanceFromLatLonInKm } from "$lib/utils/serviceAreaValidator";

/**
 * Service for assigning cleaners to bookings
 */
export const cleanerAssignmentService = {
  /**
   * Find available cleaners for a booking based on location, availability, and specialization
   * @param bookingId The ID of the booking
   * @returns Array of suitable cleaners with availability status and distance
   */
  async findAvailableCleaners(bookingId: string): Promise<{ 
    cleaners: Array<{ 
      id: string;
      firstName: string;
      lastName: string;
      rating: number | null;
      distance: number;
      availability: "AVAILABLE" | "LIMITED" | "UNAVAILABLE";
    }>;
    bookingData: any;
  }> {
    try {
      // Get booking details
      const bookingDetails = await db
        .select({
          id: booking.id,
          serviceId: booking.serviceId,
          addressId: booking.addressId,
          scheduledDate: booking.scheduledDate,
          duration: booking.duration,
        })
        .from(booking)
        .where(eq(booking.id, bookingId))
        .limit(1);

      if (bookingDetails.length === 0) {
        throw new Error(`Booking not found: ${bookingId}`);
      }

      const bookingData = bookingDetails[0];
      
      // Get booking address coordinates
      const addressDetails = await db
        .select()
        .from(address)
        .where(eq(address.id, bookingData.addressId))
        .limit(1);
        
      if (addressDetails.length === 0) {
        throw new Error(`Address not found for booking: ${bookingId}`);
      }
      
      const bookingAddress = addressDetails[0];
      
      // Extract and validate booking address coordinates
      let bookingLat: number | null = null;
      let bookingLng: number | null = null;
      
      if (bookingAddress.lat !== undefined && bookingAddress.lng !== undefined) {
        bookingLat = parseFloat(String(bookingAddress.lat));
        bookingLng = parseFloat(String(bookingAddress.lng));
        
        if (isNaN(bookingLat) || isNaN(bookingLng)) {
          console.warn(`Invalid booking coordinates for address ID ${bookingData.addressId}: Lat ${bookingAddress.lat}, Lng ${bookingAddress.lng}`);
          bookingLat = null;
          bookingLng = null;
        }
      } else {
        console.warn(`Missing coordinates for address ID ${bookingData.addressId}. Using city-based distance estimation.`);
      }
      
      // Fallback to using geocoding service in future if no coordinates available
      // For now, we'll proceed with null coordinates and handle that case in distance calculation
      
      // Calculate booking date range
      const startTime = new Date(bookingData.scheduledDate);
      const endTime = new Date(bookingData.scheduledDate);
      endTime.setMinutes(endTime.getMinutes() + bookingData.duration);
      
      // Get day of week name for availability check
      const dayNames = [
        "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"
      ];
      const bookingDayName = dayNames[startTime.getDay()];
      
      // Find active cleaners
      const cleaners = await db
        .select({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          rating: cleanerProfile.rating,
          workLocationLat: cleanerProfile.workLocationLat,
          workLocationLng: cleanerProfile.workLocationLng,
          workRadius: cleanerProfile.workRadius,
          availableDays: cleanerProfile.availableDays,
          isAvailable: cleanerProfile.isAvailable,
          // Add these fields to help with fallback distance calculation if needed
          workAddress: cleanerProfile.workAddress,
        })
        .from(user)
        .innerJoin(cleanerProfile, eq(user.id, cleanerProfile.userId))
        .where(
          and(
            eq(user.role, "CLEANER"),
            eq(user.isActive, true),
            eq(cleanerProfile.isAvailable, true)
          )
        );

      if (cleaners.length === 0) {
        return { cleaners: [], bookingData };
      }
      
      // Get existing bookings for the same day to check for conflicts
      const existingBookings = await db
        .select({
          id: booking.id,
          cleanerId: booking.cleanerId,
          scheduledDate: booking.scheduledDate,
          duration: booking.duration,
        })
        .from(booking)
        .where(
          and(
            // Same day
            gte(booking.scheduledDate, new Date(new Date(startTime).setHours(0, 0, 0, 0))),
            lt(booking.scheduledDate, new Date(new Date(startTime).setHours(23, 59, 59, 999))),
            // Not cancelled
            ne(booking.status, "CANCELLED"),
            // Has assigned cleaner
            sql`${booking.cleanerId} IS NOT NULL`
          )
        );
      
      // Create conflict map for quick lookup
      const bookingConflicts = new Map<string, boolean>();
      existingBookings.forEach(existingBooking => {
        if (!existingBooking.cleanerId) return;
        
        const existingStart = new Date(existingBooking.scheduledDate);
        const existingEnd = new Date(existingBooking.scheduledDate);
        existingEnd.setMinutes(existingEnd.getMinutes() + existingBooking.duration);
        
        // Check for time overlap
        const hasOverlap = (
          (startTime < existingEnd && startTime >= existingStart) || 
          (endTime > existingStart && endTime <= existingEnd) ||
          (startTime <= existingStart && endTime >= existingEnd)
        );
        
        if (hasOverlap) {
          bookingConflicts.set(existingBooking.cleanerId, true);
        }
      });
      
      // Filter and rank cleaners
      const availableCleaners = cleaners.map(cleaner => {
        // Check if cleaner is available on booking day
        const isAvailableOnDay = cleaner.availableDays && 
          cleaner.availableDays.includes(bookingDayName);
        
        // Check if cleaner has a booking conflict
        const hasConflict = bookingConflicts.has(cleaner.id);
        
        // Calculate distance only if we have valid coordinates
        let distance = 0;
        let canCalculateDistance = false;
        
        // Check and parse cleaner coordinates
        let cleanerLat: number | null = null;
        let cleanerLng: number | null = null;
        
        if (cleaner.workLocationLat !== undefined && cleaner.workLocationLng !== undefined) {
          cleanerLat = parseFloat(String(cleaner.workLocationLat));
          cleanerLng = parseFloat(String(cleaner.workLocationLng));
          
          if (isNaN(cleanerLat) || isNaN(cleanerLng) || 
              (cleanerLat === 0 && cleanerLng === 0)) {
            console.warn(`Invalid cleaner coordinates for cleaner ${cleaner.id}: Lat ${cleanerLat}, Lng ${cleanerLng}`);
            cleanerLat = null;
            cleanerLng = null;
          }
        }
        
        // Only calculate distance if both booking and cleaner coordinates are valid
        if (bookingLat !== null && bookingLng !== null && 
            cleanerLat !== null && cleanerLng !== null) {
          try {
            distance = getDistanceFromLatLonInKm(
              bookingLat, 
              bookingLng,
              cleanerLat,
              cleanerLng
            );
            
            // Round to 1 decimal place for display
            distance = Math.round(distance * 10) / 10;
            canCalculateDistance = true;
          } catch (error) {
            console.error("Error calculating distance:", error);
            canCalculateDistance = false;
          }
        } else {
          // No valid coordinates for distance calculation
          canCalculateDistance = false;
        }
        
        // Determine availability status
        let availability: "AVAILABLE" | "LIMITED" | "UNAVAILABLE" = "UNAVAILABLE";
        
        if (isAvailableOnDay && !hasConflict) {
          if (canCalculateDistance) {
            // If we can calculate distance, use it to determine availability
            const workRadius = parseFloat(String(cleaner.workRadius)) || 20; // Default to 20km if not set
            
            if (distance <= workRadius) {
              availability = "AVAILABLE";
            } else {
              availability = "LIMITED"; // Available but outside preferred work area
            }
          } else {
            // If we can't calculate distance, default to LIMITED
            // This ensures cleaners still show up but with a warning
            availability = "LIMITED";
          }
        }
        
        return {
          id: cleaner.id,
          firstName: cleaner.firstName,
          lastName: cleaner.lastName,
          rating: cleaner.rating,
          distance,
          availability
        };
      });
      
      // Sort cleaners by availability, distance, and rating
      availableCleaners.sort((a, b) => {
        // First sort by availability status
        const availabilityOrder = { "AVAILABLE": 0, "LIMITED": 1, "UNAVAILABLE": 2 };
        if (availabilityOrder[a.availability] !== availabilityOrder[b.availability]) {
          return availabilityOrder[a.availability] - availabilityOrder[b.availability];
        }
        
        // Then sort by distance (but only if both have non-zero distance)
        if (a.distance > 0 && b.distance > 0 && a.distance !== b.distance) {
          return a.distance - b.distance;
        }
        
        // Then sort by rating (descending)
        return (b.rating || 0) - (a.rating || 0);
      });
      
      return { 
        cleaners: availableCleaners,
        bookingData
      };
    } catch (error) {
      console.error("Error finding available cleaners:", error);
      throw error;
    }
  },
  

  /**
   * Automatically assign the best available cleaner to a booking
   * @param bookingId The ID of the booking
   * @returns The assigned cleaner or null if no cleaner could be assigned
   */
  async autoAssignCleaner(bookingId: string): Promise<{ 
    success: boolean; 
    cleanerId?: string;
    message?: string;
  }> {
    try {
      // Find available cleaners
      const { cleaners, bookingData } = await this.findAvailableCleaners(bookingId);
      
      // Filter to only fully available cleaners
      const availableCleaners = cleaners.filter(c => c.availability === "AVAILABLE");
      
      if (availableCleaners.length === 0) {
        return { 
          success: false, 
          message: "No available cleaners found for this booking" 
        };
      }
      
      // Assign the first available cleaner (already sorted by priority)
      const assignedCleaner = availableCleaners[0];
      
      // Update the booking with the assigned cleaner
      await db.update(booking)
        .set({ 
          cleanerId: assignedCleaner.id,
          updatedAt: new Date()
        })
        .where(eq(booking.id, bookingId));
      
      // Send notification to customer
      try {
        await sendCleanerAssignmentNotification(bookingId);
      } catch (notificationError) {
        console.error("Error sending cleaner assignment notification:", notificationError);
        // Continue even if notification fails
      }
      
      return { 
        success: true, 
        cleanerId: assignedCleaner.id,
        message: `Cleaner ${assignedCleaner.firstName} ${assignedCleaner.lastName} assigned successfully`
      };
    } catch (error) {
      console.error("Error auto-assigning cleaner:", error);
      return { 
        success: false, 
        message: `Failed to assign cleaner: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};
