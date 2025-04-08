// src/lib/server/services/cleaner-assignment.service.ts
import { db } from "$lib/server/db";
import { booking, cleanerProfile, user, service, address } from "$lib/server/db/schema";
import { eq, and, gte, lt, like, or, ne, sql } from "drizzle-orm"; // Added sql import
import { getDistanceFromLatLonInKm } from "$lib/utils/serviceAreaValidator";
import { sendCleanerAssignmentNotification } from "./notification.service";

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
      
      // Get service details
      const serviceDetails = await db
        .select()
        .from(service)
        .where(eq(service.id, bookingData.serviceId))
        .limit(1);
        
      if (serviceDetails.length === 0) {
        throw new Error(`Service not found for booking: ${bookingId}`);
      }
      
      // Calculate booking date range
      const startTime = new Date(bookingData.scheduledDate);
      const endTime = new Date(bookingData.scheduledDate);
      endTime.setMinutes(endTime.getMinutes() + bookingData.duration);
      
      // Calculate day of week (1 = Monday, 7 = Sunday)
      const dayOfWeek = startTime.getDay() === 0 ? 7 : startTime.getDay();
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
            gte(booking.scheduledDate, new Date(startTime.setHours(0, 0, 0, 0))),
            lt(booking.scheduledDate, new Date(startTime.setHours(23, 59, 59, 999))),
            // Not cancelled
            ne(booking.status, "CANCELLED"),
            // Has assigned cleaner - FIX: Using SQL expression instead of isNotNull
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
        
        // Calculate distance (assuming address lat/lng and cleaner work location)
        const distance = getDistanceFromLatLonInKm(
          Number(addressDetails[0].lat || 0), 
          Number(addressDetails[0].lng || 0),
          Number(cleaner.workLocationLat),
          Number(cleaner.workLocationLng)
        );
        
        // Determine availability status
        let availability: "AVAILABLE" | "LIMITED" | "UNAVAILABLE" = "UNAVAILABLE";
        
        if (isAvailableOnDay && !hasConflict && distance <= Number(cleaner.workRadius)) {
          availability = "AVAILABLE";
        } else if (isAvailableOnDay && !hasConflict) {
          availability = "LIMITED"; // Available but outside preferred work area
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
        
        // Then sort by distance
        if (a.distance !== b.distance) {
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
